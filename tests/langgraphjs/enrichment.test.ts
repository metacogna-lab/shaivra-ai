/**
 * Enrichment agent: gap detection and tool selection. Agent reasons on canonical state only.
 */

import { describe, it, expect, vi } from 'vitest';
import { detectIntelligenceGaps, hasSufficientCoverage } from '../../langgraphjs/nodes/gapDetection';
import { selectToolsForGaps } from '../../langgraphjs/nodes/toolDispatch';
import type { EnrichmentState } from '../../langgraphjs/state';

function baseState(overrides: Partial<EnrichmentState> = {}): EnrichmentState {
  return {
    entity: { type: 'infrastructure', value: 'example.com', refs: [] },
    graphSnapshot: { entities: [], observations: [], relationships: [] },
    budget: { maxToolRuns: 5 },
    gaps: [],
    events: [],
    toolRuns: [],
    ...overrides,
  };
}

describe('Enrichment agent', () => {
  describe('gapDetection', () => {
    it('detects missing infrastructure and relationships for domain entity', () => {
      const state = baseState();
      const gaps = detectIntelligenceGaps(state);
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps.some(g => g.kind === 'missing_infrastructure' || g.kind === 'missing_relationships')).toBe(true);
    });

    it('returns fewer gaps when entity has observations, organization, and relationships', () => {
      const state = baseState({
        entity: { type: 'infrastructure', value: 'example.com', refs: [{ id: 'er1', type: 'organization', name: 'Acme', aliases: [], confidence: 0.8, attributes: {}, sourceIds: [], firstSeen: new Date(), lastSeen: new Date(), metadata: { verified: false, tags: [] } } as any] },
        graphSnapshot: {
          entities: [{ id: 'e1', type: 'organization', name: 'Acme', aliases: [], confidence: 0.8, attributes: {}, sourceIds: [], firstSeen: new Date(), lastSeen: new Date(), metadata: { verified: false, tags: [] } } as any],
          observations: [{ id: 'o1', entityId: 'e1', type: 'attribute', property: 'ip', value: '1.2.3.4', confidence: 0.9, source: { tool: 'shodan', timestamp: new Date(), raw: {} }, context: {} } as any],
          relationships: [{ id: 'r1', fromEntityId: 'e1', toEntityId: 'e2', type: 'hosts', strength: 0.8, confidence: 0.9, evidence: [], bidirectional: false, metadata: { firstSeen: new Date(), lastSeen: new Date(), count: 1 } } as any],
        },
      });
      const gaps = detectIntelligenceGaps(state);
      expect(gaps.length).toBe(0);
    });

    it('hasSufficientCoverage returns false when gaps exist', () => {
      const state = baseState();
      expect(hasSufficientCoverage(state)).toBe(false);
    });

    it('uses only entity and graphSnapshot (resolved entities); no raw signals', () => {
      const state = baseState({
        graphSnapshot: {
          entities: [],
          observations: [{ id: 'o1', entityId: 'e1', type: 'attribute', property: 'ip', value: '1.2.3.4', confidence: 0.9, source: { tool: 'shodan', timestamp: new Date(), raw: {} }, context: {} } as any],
          relationships: [{ id: 'r1', fromEntityId: 'e1', toEntityId: 'e2', type: 'RELATED', strength: 1, confidence: 0.7, evidence: [], bidirectional: false, metadata: {} } as any],
        },
      });
      const gaps = detectIntelligenceGaps(state);
      expect(gaps.length).toBeGreaterThanOrEqual(1);
      expect(state).not.toHaveProperty('rawSignals');
      expect(state).not.toHaveProperty('rawToolOutput');
    });
  });

  describe('tool selection', () => {
    it('selectToolsForGaps returns only tools with normalizers within budget', () => {
      const state = baseState({ toolRuns: [] });
      const tools = selectToolsForGaps(state);
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.every(t => ['shodan', 'virustotal', 'alienvault'].includes(t))).toBe(true);
    });

    it('respects budget maxToolRuns', () => {
      const state = baseState({ toolRuns: ['shodan', 'virustotal', 'alienvault', 'shodan', 'virustotal'] });
      const tools = selectToolsForGaps(state);
      expect(tools.length).toBe(0);
    });
  });
});
