/**
 * Gap Detection Agent: ensures intelligence completeness.
 * Checks every entity for missing attributes (e.g. Domain without IP, Organization without people,
 * Account without narrative links, Infrastructure without owner). Triggers enrichment when gaps appear.
 * @see docs/osint/05-routing-and-gaps.md
 */

import type { EnrichmentState, IntelligenceGap, GraphSnapshot } from '../state';

/** Minimum observations count to consider entity "sufficient" for a dimension. */
const MIN_OBSERVATIONS_FOR_COVERAGE = 1;

/** Confidence below which we consider entity under-enriched. */
const CONFIDENCE_GAP_THRESHOLD = 0.6;

/** Relationship types that imply ownership (Infrastructure → Organization/Actor). */
const OWNER_LINK_TYPES = ['owns', 'registered_to', 'REGISTERED_TO', 'OWNS', 'associated_with', 'ASSOCIATED_WITH'];

/** Relationship types that link Account/Person to narratives (promotes, mentions, etc.). */
const NARRATIVE_LINK_TYPES = ['promotes', 'PROMOTES', 'mentions', 'MENTIONS', 'amplifies', 'AMPLIFIES', 'propagates', 'PROPAGATES'];

/**
 * Detects gaps for the current entity from graph snapshot (entities, observations, relationships).
 * Returns empty array if coverage is already sufficient.
 */
export function detectIntelligenceGaps(state: EnrichmentState): IntelligenceGap[] {
  const { entity, graphSnapshot } = state;
  const gaps: IntelligenceGap[] = [];
  const { entities, observations, relationships } = graphSnapshot;
  const currentId = entity.id ?? entity.refs[0]?.id;

  const hasObservation = (property: string) =>
    observations.some(o => o.property === property || o.property?.toLowerCase().includes(property));
  const hasEntityType = (type: string) =>
    entities.some(e => e.type === type) || entity.refs.some(r => r.type === type);
  const hasRelationship = () => relationships.length >= MIN_OBSERVATIONS_FOR_COVERAGE;
  const avgConfidence = () => {
    const refs = [...entity.refs, ...entities];
    if (refs.length === 0) return 0;
    return refs.reduce((s, r) => s + r.confidence, 0) / refs.length;
  };
  /** True if this entity has an owner link (org or person) via owns/registered_to/associated_with. */
  const hasOwner = () => {
    if (!currentId) return false;
    const ownerRels = relationships.filter(r => (r.fromEntityId === currentId || r.toEntityId === currentId) && OWNER_LINK_TYPES.includes(r.type));
    const otherIds = new Set(ownerRels.flatMap(r => [r.fromEntityId, r.toEntityId].filter(id => id !== currentId)));
    return [...otherIds].some(id => entities.some(e => e.id === id && (e.type === 'organization' || e.type === 'person')) || entity.refs.some(r => r.id === id && (r.type === 'organization' || r.type === 'person')));
  };
  /** True if this entity has a narrative link (promotes, mentions, amplifies, propagates). */
  const hasNarrativeLink = () =>
    currentId && relationships.some(r => (r.fromEntityId === currentId || r.toEntityId === currentId) && NARRATIVE_LINK_TYPES.includes(r.type));

  switch (entity.type) {
    case 'infrastructure':
      if (!hasObservation('ip') && !hasObservation('host')) gaps.push({ kind: 'missing_infrastructure', entityType: 'infrastructure', reason: 'Domain/infrastructure without IP or host' });
      if (!hasRelationship()) gaps.push({ kind: 'missing_relationships', entityType: 'infrastructure', reason: 'No relationship edges' });
      if (!hasEntityType('organization') && !hasObservation('organization')) gaps.push({ kind: 'missing_organization', entityType: 'organization', reason: 'No linked organization' });
      if (!hasOwner()) gaps.push({ kind: 'missing_owner', entityType: 'organization', reason: 'Infrastructure without owner (org/person)' });
      break;
    case 'person':
      if (!hasObservation('email') && !hasObservation('mail')) gaps.push({ kind: 'missing_emails', entityType: 'person', reason: 'No email observations' });
      if (!hasObservation('social') && !hasObservation('profile')) gaps.push({ kind: 'missing_social_signals', entityType: 'person', reason: 'No social signals' });
      if (!hasRelationship()) gaps.push({ kind: 'missing_relationships', entityType: 'person', reason: 'No relationship edges' });
      if ((hasObservation('social') || hasObservation('profile') || hasObservation('account')) && !hasNarrativeLink()) {
        gaps.push({ kind: 'missing_narrative_links', entityType: 'unknown', reason: 'Account without narrative links' });
      }
      break;
    case 'organization':
      if (!hasObservation('domain') && !hasObservation('infrastructure')) gaps.push({ kind: 'missing_infrastructure', entityType: 'infrastructure', reason: 'No domain/infrastructure' });
      if (!hasEntityType('person')) gaps.push({ kind: 'missing_person', entityType: 'person', reason: 'Organization without linked people' });
      if (!hasRelationship()) gaps.push({ kind: 'missing_relationships', entityType: 'organization', reason: 'No relationship edges' });
      break;
    default:
      if (!hasRelationship()) gaps.push({ kind: 'missing_relationships', entityType: 'unknown', reason: 'No relationship edges' });
  }

  if (avgConfidence() < CONFIDENCE_GAP_THRESHOLD) {
    gaps.push({ kind: 'low_confidence', entityType: entity.type, reason: 'Average confidence below threshold' });
  }

  return gaps;
}

/**
 * Returns whether the entity has sufficient coverage (no gaps or only low_confidence).
 * Used to skip tool runs when already well-covered.
 */
export function hasSufficientCoverage(state: EnrichmentState): boolean {
  const gaps = detectIntelligenceGaps(state);
  const onlyLowConfidence = gaps.length === 1 && gaps[0].kind === 'low_confidence';
  return gaps.length === 0 || onlyLowConfidence;
}
