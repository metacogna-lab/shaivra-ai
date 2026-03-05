/**
 * Tool Selector Tests
 * 
 * TDD: Write tests FIRST to define tool selection behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolSelector } from '../../src/server/services/toolSelector';

describe('Tool Selector', () => {
  let selector: ToolSelector;

  beforeEach(() => {
    selector = new ToolSelector();
  });

  describe('Entity-Based Selection', () => {
    it('should select infrastructure tools for IP address', () => {
      const tools = selector.selectTools({
        target: '93.184.216.34',
        entityType: 'infrastructure'
      });

      expect(tools).toContain('shodan');
      expect(tools).toContain('virustotal');
      expect(tools).not.toContain('twitter');
      expect(tools).not.toContain('reddit');
    });

    it('should select infrastructure tools for domain', () => {
      const tools = selector.selectTools({
        target: 'example.com',
        entityType: 'infrastructure'
      });

      expect(tools).toContain('shodan');
      expect(tools).toContain('virustotal');
      expect(tools).toContain('alienvault');
    });

    it('should select social media tools for person', () => {
      const tools = selector.selectTools({
        target: 'john_doe',
        entityType: 'person'
      });

      expect(tools).toContain('twitter');
      expect(tools).toContain('reddit');
      expect(tools).not.toContain('shodan');
    });

    it('should select all relevant tools for organization', () => {
      const tools = selector.selectTools({
        target: 'Acme Corp',
        entityType: 'organization'
      });

      expect(tools.length).toBeGreaterThanOrEqual(2);
      // Should get social media tools (Layer 5)
      expect(tools).toContain('twitter');
      expect(tools).toContain('reddit');
    });
  });

  describe('Auto-Detection', () => {
    it('should auto-detect IP address from target string', () => {
      const tools = selector.selectTools({
        target: '93.184.216.34'
      });

      expect(tools).toContain('shodan');
      expect(tools).toContain('virustotal');
    });

    it('should auto-detect domain from target string', () => {
      const tools = selector.selectTools({
        target: 'example.com'
      });

      expect(tools).toContain('virustotal');
      expect(tools).toContain('alienvault');
    });

    it('should auto-detect username/handle', () => {
      const tools = selector.selectTools({
        target: '@username'
      });

      expect(tools).toContain('twitter');
    });
  });

  describe('Signal Ranking', () => {
    it('should return tools ordered by signal rank (high to low)', () => {
      const tools = selector.selectTools({
        target: 'example.com',
        entityType: 'infrastructure',
        ranked: true
      });

      // Layer 2 tools (infrastructure) should come before Layer 4/5
      const shodanIndex = tools.indexOf('shodan');
      const twitterIndex = tools.indexOf('twitter');

      if (twitterIndex !== -1) {
        expect(shodanIndex).toBeLessThan(twitterIndex);
      }
    });

    it('should prioritize authoritative sources for organizations', () => {
      const tools = selector.selectTools({
        target: 'Acme Corp',
        entityType: 'organization',
        ranked: true
      });

      // Layer 1 tools (OpenCorporates, SEC) should come first
      // For now, just verify ranking system works
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Filters', () => {
    it('should filter by specific tools', () => {
      const tools = selector.selectTools({
        target: 'example.com',
        include: ['shodan', 'virustotal']
      });

      expect(tools).toHaveLength(2);
      expect(tools).toContain('shodan');
      expect(tools).toContain('virustotal');
    });

    it('should exclude specific tools', () => {
      const tools = selector.selectTools({
        target: '93.184.216.34',
        entityType: 'infrastructure',
        exclude: ['alienvault']
      });

      expect(tools).not.toContain('alienvault');
      expect(tools).toContain('shodan');
    });

    it('should respect max tools limit', () => {
      const tools = selector.selectTools({
        target: 'example.com',
        entityType: 'infrastructure',
        maxTools: 2
      });

      expect(tools.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Cost Optimization', () => {
    it('should prefer free tools when cost-aware', () => {
      const tools = selector.selectTools({
        target: 'example.com',
        entityType: 'infrastructure',
        costAware: true
      });

      // Should prioritize free/cached tools
      expect(tools.length).toBeGreaterThan(0);
    });
  });
});
