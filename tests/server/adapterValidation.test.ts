/**
 * OSINT adapter validation tests.
 * Verifies each registered tool: reachable, entity types, canonical signals, rate/retry.
 */

import { describe, it, expect } from 'vitest';
import { validateOsintAdapters, type AdapterCheck, type AdapterValidationResult } from '../../src/server/integrity/adapterValidation';
import { normalizerRegistry } from '../../src/server/normalizers';

describe('adapterValidation', () => {
  describe('validateOsintAdapters', () => {
    it('returns result with checks for every registered tool', () => {
      const result = validateOsintAdapters();
      const tools = result.checks.map((c) => c.tool);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(new Set(tools).size).toBe(tools.length);
      result.checks.forEach((c) => {
        expect(c).toMatchObject({
          tool: expect.any(String),
          reachable: expect.any(Boolean),
          reachableVia: expect.stringMatching(/^(integration|sdk_adapter|none)$/),
          entityTypesMatch: expect.any(Boolean),
          emitsCanonicalSignals: expect.any(Boolean),
          rateLimitAndRetryConfigured: expect.any(Boolean),
          errors: expect.any(Array),
          ok: expect.any(Boolean),
        });
      });
    });

    it('flags tools with no normalizer as not emitting canonical signals', () => {
      const result = validateOsintAdapters();
      const noNormalizer = result.checks.filter(
        (c) => !['shodan', 'virustotal', 'alienvault', 'twitter', 'reddit'].includes(c.tool)
      );
      noNormalizer.forEach((c) => {
        expect(c.emitsCanonicalSignals).toBe(false);
        expect(c.errors.some((e) => e.includes('canonical') || e.includes('normalizer'))).toBe(true);
      });
    });

    it('marks shodan, alienvault, virustotal as reachable (integration or SDK adapter)', () => {
      const result = validateOsintAdapters();
      for (const name of ['shodan', 'alienvault', 'virustotal']) {
        const check = result.checks.find((c) => c.tool === name);
        expect(check).toBeDefined();
        expect(check!.reachable).toBe(true);
        expect(['integration', 'sdk_adapter']).toContain(check!.reachableVia);
      }
    });

    it('marks tools with integration as having rate/retry or notes', () => {
      const result = validateOsintAdapters();
      const shodan = result.checks.find((c) => c.tool === 'shodan');
      expect(shodan?.rateLimitAndRetryConfigured).toBe(true);
    });

    it('includes entity type contract deviation for infrastructure-only tools', () => {
      const result = validateOsintAdapters();
      const infraOnly = result.checks.find((c) => c.tool === 'shodan');
      expect(infraOnly?.entityTypesMatch).toBe(true);
      expect(infraOnly?.entityTypesContractDeviation).toBeDefined();
      expect(infraOnly?.entityTypesContractDeviation).toMatch(/infrastructure|domain|ip|email/);
    });

    it('validates normalizers produce IntelligenceEvent (shodan, virustotal, alienvault, twitter, reddit)', () => {
      if (typeof normalizerRegistry.get !== 'function') {
        return; // Skip when normalizers are mocked (e.g. run with pipelineIntegrity.test.ts)
      }
      const result = validateOsintAdapters();
      const withNormalizer = ['shodan', 'virustotal', 'alienvault', 'twitter', 'reddit'];
      const failing: Array<{ tool: string; error?: string }> = [];
      for (const name of withNormalizer) {
        const check = result.checks.find((c) => c.tool === name);
        expect(check).toBeDefined();
        if (!check!.emitsCanonicalSignals) {
          failing.push({ tool: name, error: check!.canonicalSignalsError });
        }
      }
      expect(failing).toHaveLength(0);
    });

    it('deviations array lists all flagged issues', () => {
      const result = validateOsintAdapters();
      if (result.deviations.length > 0) {
        result.deviations.forEach((d) => {
          expect(d).toMatch(/^\[[\w-]+\]/);
        });
      }
    });
  });
});
