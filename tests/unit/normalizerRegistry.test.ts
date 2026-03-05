import { describe, it, expect } from 'vitest';
import { normalizerRegistry } from '../../src/server/normalizers';

const REQUIRED_TOOLS = ['shodan', 'virustotal', 'alienvault'] as const;

describe('Normalizer Registry', () => {
  it('registers BaseNormalizer implementations for all required tools', () => {
    REQUIRED_TOOLS.forEach((tool) => {
      const normalizer = normalizerRegistry.get(tool);
      expect(normalizer, `Missing normalizer for ${tool}`).toBeDefined();
      expect(typeof normalizer?.normalize).toBe('function');
    });
  });
});
