/**
 * Pipeline integrity module and /api/system/integrity endpoint tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runPipelineIntegrity,
  REQUIRED_TOPICS,
  REQUIRED_GRAPH_LABELS,
  type ToolRegistryCheck,
} from '../../src/server/integrity';

vi.mock('@shaivra/osint-sdk', () => ({
  hasAdapter: vi.fn((name: string) => ['shodan', 'spiderfoot'].includes(name)),
}));

vi.mock('../../src/server/normalizers', () => ({
  normalizerRegistry: {
    has: vi.fn((name: string) => ['shodan', 'virustotal', 'alienvault', 'twitter', 'reddit'].includes(name)),
    getRegisteredTools: vi.fn(() => ['shodan', 'virustotal', 'alienvault', 'twitter', 'reddit']),
  },
}));

vi.mock('../../src/server/services/toolSelector', () => ({
  toolSelector: {
    getAllTools: vi.fn(() => [
      'shodan',
      'virustotal',
      'alienvault',
      'spiderfoot',
      'reconng',
      'theharvester',
      'securitytrails',
      'epieos',
      'twitter',
      'reddit',
    ]),
    getToolMetadata: vi.fn((name: string) => {
      const meta: Record<string, { entityTypes: string[] }> = {
        shodan: { entityTypes: ['infrastructure'] },
        virustotal: { entityTypes: ['infrastructure'] },
        alienvault: { entityTypes: ['infrastructure'] },
        spiderfoot: { entityTypes: ['infrastructure', 'person', 'organization'] },
        reconng: { entityTypes: ['infrastructure'] },
        theharvester: { entityTypes: ['infrastructure', 'person', 'organization'] },
        securitytrails: { entityTypes: ['infrastructure'] },
        epieos: { entityTypes: ['person', 'organization'] },
        twitter: { entityTypes: ['person', 'organization'] },
        reddit: { entityTypes: ['person', 'organization'] },
      };
      return meta[name] ? { name, entityTypes: meta[name].entityTypes } : undefined;
    }),
  },
}));

vi.mock('../../src/server/db/memgraphClient', () => ({
  getSession: vi.fn(() => ({
    run: vi.fn(() => ({ records: [] })),
    close: vi.fn(),
  })),
}));

describe('pipelineIntegrity', () => {
  beforeEach(() => {
    delete process.env.REDPANDA_BROKERS;
    delete process.env.KAFKA_BROKERS;
  });

  describe('constants', () => {
    it('REQUIRED_TOPICS includes raw, normalized, resolved, graph.updates', () => {
      expect(REQUIRED_TOPICS).toContain('shaivra.signals.raw');
      expect(REQUIRED_TOPICS).toContain('shaivra.signals.normalized');
      expect(REQUIRED_TOPICS).toContain('shaivra.entities.resolved');
      expect(REQUIRED_TOPICS).toContain('shaivra.graph.updates');
      expect(REQUIRED_TOPICS).toHaveLength(4);
    });

    it('REQUIRED_GRAPH_LABELS includes Actor, Narrative, Message, Account, etc.', () => {
      expect(REQUIRED_GRAPH_LABELS).toContain('Actor');
      expect(REQUIRED_GRAPH_LABELS).toContain('Organization');
      expect(REQUIRED_GRAPH_LABELS).toContain('Narrative');
      expect(REQUIRED_GRAPH_LABELS).toContain('Message');
      expect(REQUIRED_GRAPH_LABELS).toContain('Account');
      expect(REQUIRED_GRAPH_LABELS).toContain('Audience');
      expect(REQUIRED_GRAPH_LABELS).toContain('Campaign');
      expect(REQUIRED_GRAPH_LABELS).toHaveLength(12);
    });
  });

  describe('runPipelineIntegrity', () => {
    it('returns result with toolRegistry, signalSchema, redpanda, graphSchema', async () => {
      const result = await runPipelineIntegrity();
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('toolRegistry');
      expect(result).toHaveProperty('signalSchema');
      expect(result).toHaveProperty('redpanda');
      expect(result).toHaveProperty('graphSchema');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('signalSchema check passes (minimal IntelligenceEvent valid)', async () => {
      const result = await runPipelineIntegrity();
      expect(result.signalSchema.ok).toBe(true);
    });

    it('toolRegistry checks include hasAdapter and hasNormalizer per tool', async () => {
      const result = await runPipelineIntegrity();
      expect(result.toolRegistry.checks.length).toBeGreaterThan(0);
      const shodan = result.toolRegistry.checks.find((c: ToolRegistryCheck) => c.tool === 'shodan');
      expect(shodan).toBeDefined();
      expect(shodan).toHaveProperty('hasAdapter');
      expect(shodan).toHaveProperty('hasNormalizer');
      expect(shodan).toHaveProperty('entityTypesNonEmpty');
      expect(shodan).toHaveProperty('errors');
    });

    it('redpanda is skipped when REDPANDA_BROKERS not set', async () => {
      const result = await runPipelineIntegrity();
      expect(result.redpanda.skipped).toBe(true);
      expect(result.redpanda.ok).toBe(true);
    });

    it('graphSchema passes when memgraph session mock runs', async () => {
      const result = await runPipelineIntegrity();
      expect(result.graphSchema).toHaveProperty('ok');
      expect(result.graphSchema).toHaveProperty('skipped');
    });

    it('returns subsystems for validator with verified, missingComponents, recommendations', async () => {
      const result = await runPipelineIntegrity();
      expect(result.subsystems).toBeDefined();
      const keys = [
        'toolRegistryCompleteness',
        'adapterAvailability',
        'signalSchemaCompliance',
        'redpandaTopicHealth',
        'entityResolutionPipeline',
        'graphWriteIntegrity',
        'langGraphWorkflowConnectivity',
      ];
      for (const k of keys) {
        expect(result.subsystems).toHaveProperty(k);
        expect(result.subsystems![k as keyof typeof result.subsystems]).toHaveProperty('verified');
        expect(result.subsystems![k as keyof typeof result.subsystems]).toHaveProperty('missingComponents');
        expect(result.subsystems![k as keyof typeof result.subsystems]).toHaveProperty('recommendations');
      }
    });
  });
});
