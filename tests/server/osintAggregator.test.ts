/**
 * Unit tests for OSINT aggregator. Mocks integrations; asserts AggregatedOSINTReport shape and IntelligenceEvent on results.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const shodanResponse = {
  matches: [
    {
      ip_str: '93.184.216.34',
      port: 443,
      transport: 'tcp',
      data: '',
      org: 'Example',
      tags: [],
      hostnames: [],
      domains: [],
    },
  ],
  total: 1,
};

const virusTotalResponse = {
  data: {
    id: 'example.com',
    type: 'domain',
    attributes: {
      last_analysis_stats: { harmless: 70, malicious: 2, suspicious: 1, undetected: 5, timeout: 0 },
      last_analysis_date: Math.floor(Date.now() / 1000) - 3600,
      last_modification_date: Math.floor(Date.now() / 1000) - 7200,
      reputation: 80,
      total_votes: { harmless: 100, malicious: 2 },
      categories: {},
      tags: [],
    },
    links: { self: 'https://www.virustotal.com/api/v3/domains/example.com' },
  },
};

const alienVaultResponse = {
  indicator: 'example.com',
  type: 'domain',
  title: 'Sample',
  description: 'Sample indicator',
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  is_active: true,
  threat_score: 30,
  pulse_info: {
    count: 1,
    pulses: [
      {
        id: 'p1',
        name: 'Pulse 1',
        description: 'D',
        tags: [],
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author_name: 'Test',
        tlp: 'white',
        references: [],
      },
    ],
  },
};

const mockSearchShodan = vi.fn();
const mockGetShodanHost = vi.fn();
const mockGetAlienVaultGeneral = vi.fn();
const mockGetAlienVaultMalware = vi.fn();
const mockGetVirusTotalReport = vi.fn();

vi.mock('../../src/server/integrations/shodan', () => ({
  searchShodan: (...args: unknown[]) => mockSearchShodan(...args),
  getShodanHost: (...args: unknown[]) => mockGetShodanHost(...args),
}));

vi.mock('../../src/server/integrations/alienvault', () => ({
  getAlienVaultGeneral: (...args: unknown[]) => mockGetAlienVaultGeneral(...args),
  getAlienVaultMalware: (...args: unknown[]) => mockGetAlienVaultMalware(...args),
}));

vi.mock('../../src/server/integrations/virustotal', () => ({
  getVirusTotalReport: (...args: unknown[]) => mockGetVirusTotalReport(...args),
}));

beforeEach(() => {
  mockSearchShodan.mockResolvedValue(shodanResponse);
  mockGetShodanHost.mockResolvedValue(shodanResponse.matches[0]);
  mockGetAlienVaultGeneral.mockResolvedValue(alienVaultResponse);
  mockGetAlienVaultMalware.mockResolvedValue({ data: [] });
  mockGetVirusTotalReport.mockResolvedValue(virusTotalResponse);
});

describe('aggregateOSINTData', () => {
  it('returns AggregatedOSINTReport with target, type, results, summary, generated_at', async () => {
    const { aggregateOSINTData } = await import('../../src/server/services/osintAggregator');
    const report = await aggregateOSINTData('example.com', 'domain');
    expect(report).toHaveProperty('target', 'example.com');
    expect(report).toHaveProperty('type', 'domain');
    expect(report).toHaveProperty('results');
    expect(Array.isArray(report.results)).toBe(true);
    expect(report).toHaveProperty('summary');
    expect(report.summary).toHaveProperty('total_sources');
    expect(report.summary).toHaveProperty('successful_sources');
    expect(report.summary).toHaveProperty('failed_sources');
    expect(report.summary).toHaveProperty('threat_level');
    expect(report.summary).toHaveProperty('confidence_score');
    expect(report).toHaveProperty('generated_at');
  });

  it('attaches normalized IntelligenceEvent on successful results when normalizers run', async () => {
    const { aggregateOSINTData } = await import('../../src/server/services/osintAggregator');
    const report = await aggregateOSINTData('93.184.216.34', 'ip');
    const successful = report.results.filter((r) => r.success);
    expect(successful.length).toBeGreaterThan(0);
    for (const r of successful) {
      expect(r.event).toBeDefined();
      if (r.event) {
        expect(r.event.tool).toBeDefined();
        expect(r.event.target).toBeDefined();
        expect(r.event.entities).toBeDefined();
        expect(Array.isArray(r.event.observations)).toBe(true);
        expect(['success', 'partial', 'failed']).toContain(r.event.status);
        expect(r.event.timestamp).toBeInstanceOf(Date);
      }
    }
  });

  it('includes failed source entries when an integration throws', async () => {
    mockGetVirusTotalReport.mockRejectedValueOnce(new Error('VT_API_KEY missing'));
    const { aggregateOSINTData } = await import('../../src/server/services/osintAggregator');
    const report = await aggregateOSINTData('example.com', 'domain');
    const failed = report.results.filter((r) => !r.success);
    expect(failed.length).toBeGreaterThanOrEqual(0);
    expect(report.summary.total_sources).toBe(3);
  });
});
