/**
 * Investigation Agent flow: company-domain example.
 * Asserts end-to-end shape of runInvestigation (graph lookup → gaps → enrichment when budget → report).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInvestigation } from '../langgraphjs/index';

const mockGetMasterGraph = vi.fn();
const mockCallTrackedGemini = vi.fn();

vi.mock('../src/server/repositories/graphRepository', () => ({
  graphRepository: {
    getMasterGraph: mockGetMasterGraph,
  },
}));

vi.mock('../src/server/services/llmClient', () => ({
  callTrackedGemini: mockCallTrackedGemini,
}));

import { graphRepository } from '../src/server/repositories/graphRepository';
import { callTrackedGemini } from '../src/server/services/llmClient';

describe('Investigation flow (company domain example)', () => {
  beforeEach(() => {
    mockGetMasterGraph.mockResolvedValue({
      nodes: [],
      links: [],
      metadata: {},
    });
    mockCallTrackedGemini.mockResolvedValue({
      response: { text: 'Investigation report for target. No speculation; confidence > 0.6 only.' },
      lineage: { traceId: 'trace-1', model: 'gemini-2.0-flash-exp' },
    });
  });

  it('returns report, graphSnapshot, events, traceId, budgetConsumed for domain target', async () => {
    const result = await runInvestigation({
      target: 'company.com',
      entityType: 'infrastructure',
      budget: { maxToolRuns: 0 },
    });

    expect(result).toHaveProperty('report');
    expect(result).toHaveProperty('graphSnapshot');
    expect(result).toHaveProperty('events');
    expect(result).toHaveProperty('traceId');
    expect(result).toHaveProperty('budgetConsumed');
    expect(result.graphSnapshot).toMatchObject({
      entities: expect.any(Array),
      observations: expect.any(Array),
      relationships: expect.any(Array),
    });
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.traceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof result.budgetConsumed).toBe('number');
    expect(typeof result.report === 'string' || typeof result.report === 'object').toBe(true);
  });

  it('uses graph lookup then synthesizes report when budget is zero', async () => {
    mockGetMasterGraph.mockResolvedValue({
      nodes: [{ uuid: 'n1', label: 'company.com', type: 'Infrastructure' }],
      links: [],
      metadata: {},
    });

    const result = await runInvestigation({
      target: 'example.com',
      budget: { maxToolRuns: 0 },
    });

    expect(graphRepository.getMasterGraph).toHaveBeenCalled();
    expect(callTrackedGemini).toHaveBeenCalledWith(
      'investigation-report-synthesis',
      expect.objectContaining({
        contents: expect.stringContaining('example.com'),
      }),
      expect.any(String),
      expect.any(Object)
    );
    expect(result.report).toBeTruthy();
  });

  it('synthesis uses only canonical data (no raw signals): payload has entities, observations, relationships', async () => {
    mockGetMasterGraph.mockResolvedValue({
      nodes: [{ uuid: 'e1', label: 'example.com', type: 'Infrastructure' }],
      links: [],
      metadata: {},
    });

    await runInvestigation({
      target: 'example.com',
      budget: { maxToolRuns: 0 },
    });

    const call = mockCallTrackedGemini.mock.calls[0];
    const contents = call[1]?.contents ?? '';
    expect(contents).toContain('Canonical data (confidence > 0.6 or corroborated)');
    expect(contents).toMatch(/"entities":/);
    expect(contents).toMatch(/"observations":/);
    expect(contents).toMatch(/"relationships":/);
    expect(contents).not.toContain('raw_response');
    expect(contents).not.toContain('api_response');
  });
});
