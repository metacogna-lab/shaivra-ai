/**
 * Standardise & Deduplicate service.
 *
 * Runs after ingestion/normalization: assigns one canonical unique ID per entity,
 * normalises names (handles, display names), merges entities/observations/relationships
 * using content-aware and fuzzy matching so variants (@elonmusk, "Elon Musk", misspellings)
 * resolve to the same entity.
 */

import type {
  EntityReference,
  Observation,
  Relationship,
  IntelligenceEvent,
} from '../../contracts/intelligence';
import { v4 as uuidv4 } from 'uuid';

/** Default similarity threshold for fuzzy match (0–1). */
const DEFAULT_FUZZY_THRESHOLD = 0.85;

/** Options for standardiseAndDeduplicate. */
export interface StandardiseOptions {
  /** Min similarity (0–1) to treat two names as same entity. Default 0.85. */
  fuzzyThreshold?: number;
}

/**
 * Normalises an entity name for keying and comparison by type.
 * Domains: lowercase. IPs: trim. Persons/orgs: lowercase, trim, strip leading @.
 */
export function normaliseEntityName(name: string, type: EntityReference['type']): string {
  const trimmed = String(name).trim();
  if (!trimmed) return trimmed;
  if (type === 'infrastructure') {
    const lower = trimmed.toLowerCase();
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    return ipPattern.test(lower) ? lower : lower;
  }
  if (type === 'person' || type === 'organization' || type === 'event' || type === 'unknown') {
    const noHandle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    return noHandle.toLowerCase().trim();
  }
  return trimmed.toLowerCase().trim();
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const dp: number[][] = Array(an + 1)
    .fill(null)
    .map(() => Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) dp[i][0] = i;
  for (let j = 0; j <= bn; j++) dp[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[an][bn];
}

/** Similarity ratio 0–1 (1 = identical). */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Returns whether two names refer to the same entity: exact normalised match
 * or fuzzy similarity above threshold against canonical name and aliases.
 */
function isSameEntity(
  normalisedKey: string,
  candidateName: string,
  canonical: EntityReference,
  threshold: number
): boolean {
  const canonicalKey = normaliseEntityName(canonical.name, canonical.type);
  if (canonicalKey === normalisedKey) return true;
  const allNames = [canonical.name, ...canonical.aliases].map((n) =>
    normaliseEntityName(n, canonical.type)
  );
  if (allNames.includes(normalisedKey)) return true;
  for (const n of allNames) {
    if (stringSimilarity(normalisedKey, n) >= threshold) return true;
  }
  if (stringSimilarity(normaliseEntityName(candidateName, canonical.type), canonicalKey) >= threshold)
    return true;
  return false;
}

/**
 * Builds a stable key for grouping: type + normalised name.
 */
function entityStableKey(entity: EntityReference): string {
  return `${entity.type}:${normaliseEntityName(entity.name, entity.type)}`;
}

/**
 * Finds an existing canonical entity that matches the candidate, or null.
 */
function findMatchingCanonical(
  candidate: EntityReference,
  canonicals: EntityReference[],
  threshold: number
): EntityReference | null {
  const key = entityStableKey(candidate);
  for (const c of canonicals) {
    if (c.type !== candidate.type) continue;
    if (isSameEntity(key, candidate.name, c, threshold)) return c;
  }
  return null;
}

/** Ensures value is a comparable string for observation dedup. */
function observationValueKey(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Standardises and deduplicates a list of intelligence events.
 * One canonical unique ID per entity; name variants (handles, display names, misspellings)
 * merge into one entity with merged aliases. Returns a single merged event.
 */
export function standardiseAndDeduplicate(
  events: IntelligenceEvent[],
  options: StandardiseOptions = {}
): IntelligenceEvent[] {
  if (events.length === 0) return [];
  const threshold = options.fuzzyThreshold ?? DEFAULT_FUZZY_THRESHOLD;
  const idToCanonicalId = new Map<string, string>();
  const canonicalEntities: EntityReference[] = [];
  const allObservations: Observation[] = [];
  const allRelationships: Relationship[] = [];

  const ensureDate = (d: unknown): Date =>
    d instanceof Date ? d : new Date(typeof d === 'string' ? d : 0);

  for (const ev of events) {
    for (const entity of ev.entities) {
      const existing = findMatchingCanonical(entity, canonicalEntities, threshold);
      if (existing) {
        idToCanonicalId.set(entity.id, existing.id);
        const aliasSet = new Set([existing.name, ...existing.aliases, entity.name, ...entity.aliases]);
        existing.aliases = [...aliasSet].filter((a) => a !== existing.name);
        existing.sourceIds = [...new Set([...existing.sourceIds, ...entity.sourceIds])];
        const entityFirst = ensureDate(entity.firstSeen);
        const entityLast = ensureDate(entity.lastSeen);
        if (entityFirst < ensureDate(existing.firstSeen)) existing.firstSeen = entityFirst;
        if (entityLast > ensureDate(existing.lastSeen)) existing.lastSeen = entityLast;
        existing.confidence = Math.max(existing.confidence, entity.confidence);
      } else {
        const canonicalName =
          entity.type === 'person' || entity.type === 'organization' || entity.type === 'unknown'
            ? entity.name.trim()
            : entity.name.trim().toLowerCase();
        const merged: EntityReference = {
          ...entity,
          id: entity.id,
          name: canonicalName,
          aliases: [...new Set([...entity.aliases].filter((a) => a !== canonicalName))],
          firstSeen: ensureDate(entity.firstSeen),
          lastSeen: ensureDate(entity.lastSeen),
        };
        canonicalEntities.push(merged);
        idToCanonicalId.set(entity.id, entity.id);
      }
    }

    for (const obs of ev.observations) {
      const canonicalId = idToCanonicalId.get(obs.entityId);
      if (canonicalId)
        allObservations.push({
          ...obs,
          entityId: canonicalId,
          id: obs.id,
          source: {
            ...obs.source,
            timestamp: ensureDate(obs.source.timestamp),
          },
        });
    }

    for (const rel of ev.relationships) {
      const fromId = idToCanonicalId.get(rel.fromEntityId);
      const toId = idToCanonicalId.get(rel.toEntityId);
      if (fromId && toId)
        allRelationships.push({
          ...rel,
          fromEntityId: fromId,
          toEntityId: toId,
          metadata: {
            ...rel.metadata,
            firstSeen: ensureDate(rel.metadata.firstSeen),
            lastSeen: ensureDate(rel.metadata.lastSeen),
          },
        });
    }
  }

  const seenObs = new Set<string>();
  const dedupedObservations = allObservations.filter((o) => {
    const key = `${o.entityId}:${o.property}:${observationValueKey(o.value)}`;
    if (seenObs.has(key)) return false;
    seenObs.add(key);
    return true;
  });

  const seenRel = new Set<string>();
  const dedupedRelationships = allRelationships.filter((r) => {
    const key = `${r.fromEntityId}:${r.toEntityId}:${r.type}`;
    if (seenRel.has(key)) return false;
    seenRel.add(key);
    return true;
  });

  const firstEvent = events[0];
  const mergedEvent: IntelligenceEvent = {
    id: uuidv4(),
    traceId: firstEvent?.traceId ?? uuidv4(),
    investigationId: firstEvent?.investigationId,
    tool: 'standardise-and-deduplicate',
    target: firstEvent?.target ?? '',
    timestamp: new Date(),
    status: 'success',
    entities: canonicalEntities,
    observations: dedupedObservations,
    relationships: dedupedRelationships,
    metadata: {
      executionTime: 0,
      raw: { inputEventCount: events.length },
    },
  };

  return [mergedEvent];
}
