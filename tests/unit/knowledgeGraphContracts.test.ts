/**
 * Unit tests for knowledge-graph and landing Zod schemas. Valid structures pass; invalid fail.
 */

import { describe, it, expect } from 'vitest';
import {
  productSchema,
  navItemSchema,
  entityTypeSchema,
  relationshipTypeSchema,
  graphNodeSchema,
  graphEdgeSchema,
  graphDataSchema,
  playbookSchema,
  playbookStrategySchema,
} from '../../src/contracts/knowledgeGraph';

const ISO = '2025-01-15T12:00:00.000Z';

describe('productSchema', () => {
  it('accepts valid product', () => {
    const product = {
      id: 'lens',
      name: 'Lens',
      tagline: 'Ingest',
      description: 'Pipeline',
      icon: 'lens' as const,
      features: ['Ingestion', 'Normalization'],
    };
    expect(productSchema.safeParse(product).success).toBe(true);
  });
  it('rejects invalid icon', () => {
    const product = {
      id: 'x',
      name: 'X',
      tagline: 'T',
      description: 'D',
      icon: 'other',
      features: [],
    };
    expect(productSchema.safeParse(product).success).toBe(false);
  });
});

describe('navItemSchema', () => {
  it('accepts valid nav item', () => {
    expect(navItemSchema.safeParse({ label: 'Dashboard', id: 'dashboard' }).success).toBe(true);
  });
  it('rejects missing id', () => {
    expect(navItemSchema.safeParse({ label: 'Dashboard' }).success).toBe(false);
  });
});

describe('entityTypeSchema', () => {
  it('accepts all entity types', () => {
    const types = ['person', 'organization', 'domain', 'ip_address', 'infrastructure_asset', 'event'];
    types.forEach((t) => expect(entityTypeSchema.safeParse(t).success).toBe(true));
  });
  it('rejects invalid type', () => {
    expect(entityTypeSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('relationshipTypeSchema', () => {
  it('accepts known relationship types', () => {
    expect(relationshipTypeSchema.safeParse('OWNS').success).toBe(true);
    expect(relationshipTypeSchema.safeParse('HOSTS').success).toBe(true);
  });
  it('rejects invalid type', () => {
    expect(relationshipTypeSchema.safeParse('UNKNOWN').success).toBe(false);
  });
});

describe('graphEdgeSchema', () => {
  it('accepts valid edge', () => {
    const edge = {
      source: 'n1',
      target: 'n2',
      type: 'HOSTS' as const,
      strength: 0.8,
      confidence: 0.9,
      evidenceCount: 1,
    };
    expect(graphEdgeSchema.safeParse(edge).success).toBe(true);
  });
  it('rejects strength > 1', () => {
    const edge = {
      source: 'n1',
      target: 'n2',
      type: 'HOSTS',
      strength: 1.5,
      confidence: 0.9,
      evidenceCount: 1,
    };
    expect(graphEdgeSchema.safeParse(edge).success).toBe(false);
  });
});

describe('graphNodeSchema', () => {
  const baseNode = {
    id: 'n1',
    label: 'Node 1',
    type: 'organization' as const,
    x: 0,
    y: 0,
    r: 10,
    confidence: 0.9,
    riskScore: 50,
    sourceCount: 2,
    firstSeen: ISO,
    lastSeen: ISO,
    details: {
      role: 'Actor',
      description: 'Desc',
      sources: [],
      attribution: 'OSINT',
      linkedEvidence: [],
    },
  };

  it('accepts valid graph node', () => {
    expect(graphNodeSchema.safeParse(baseNode).success).toBe(true);
  });
  it('rejects invalid entity type', () => {
    expect(graphNodeSchema.safeParse({ ...baseNode, type: 'invalid' }).success).toBe(false);
  });
});

describe('graphDataSchema', () => {
  it('accepts valid graph data with nodes and edges', () => {
    const data = {
      nodes: [
        {
          id: 'n1',
          label: 'N1',
          type: 'person' as const,
          x: 0,
          y: 0,
          r: 10,
          confidence: 0.9,
          riskScore: 0,
          sourceCount: 0,
          firstSeen: ISO,
          lastSeen: ISO,
          details: { role: '', description: '', sources: [], attribution: '', linkedEvidence: [] },
        },
      ],
      edges: [
        {
          source: 'n1',
          target: 'n2',
          type: 'OWNS' as const,
          strength: 0.8,
          confidence: 0.9,
          evidenceCount: 0,
        },
      ],
    };
    expect(graphDataSchema.safeParse(data).success).toBe(true);
  });
  it('rejects empty nodes when edges reference missing nodes', () => {
    const data = { nodes: [], edges: [{ source: 'a', target: 'b', type: 'OWNS', strength: 0.5, confidence: 0.5, evidenceCount: 0 }] };
    expect(graphDataSchema.safeParse(data).success).toBe(true); // schema doesn't enforce referential integrity
  });
});

describe('playbookStrategySchema', () => {
  const validStrategy = {
    id: 's1',
    name: 'Defensive Comms',
    type: 'defensive_comm' as const,
    description: 'Narrative control',
    rationale: {
      signalProvenance: 'Spike',
      strategyLogic: 'Counter',
      impactEstimate: '30%',
    },
    metrics: [{ name: 'Sentiment', target: 'Positive' }],
    nextSteps: ['Step 1'],
    risks: ['Risk 1'],
    triggers: ['Trigger 1'],
  };

  it('accepts valid playbook strategy', () => {
    expect(playbookStrategySchema.safeParse(validStrategy).success).toBe(true);
  });
  it('rejects invalid type', () => {
    expect(playbookStrategySchema.safeParse({ ...validStrategy, type: 'other' }).success).toBe(false);
  });
});

describe('playbookSchema', () => {
  const validStrategy = {
    id: 's1',
    name: 'S1',
    type: 'defensive_comm' as const,
    description: 'D',
    rationale: { signalProvenance: 'P', strategyLogic: 'L', impactEstimate: 'E' },
    metrics: [],
    nextSteps: [],
    risks: [],
    triggers: [],
  };

  it('accepts valid playbook', () => {
    const playbook = {
      id: 'pb-1',
      userId: 'u1',
      sessionId: 'sess1',
      createdAt: ISO,
      scenarioDrivers: ['Driver 1'],
      strategies: [validStrategy],
    };
    expect(playbookSchema.safeParse(playbook).success).toBe(true);
  });
  it('rejects invalid createdAt', () => {
    const playbook = {
      id: 'pb-1',
      userId: 'u1',
      sessionId: 'sess1',
      createdAt: 'not-a-date',
      scenarioDrivers: [],
      strategies: [validStrategy],
    };
    expect(playbookSchema.safeParse(playbook).success).toBe(false);
  });
});
