import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { portalApi } from './portalApi';
import { dashboardDataSchema } from '../contracts/portal';
import { ingestionJobSchema } from '../contracts/portal';

describe('portalApi.hashData', () => {
  it('produces deterministic 64-character sha256 hashes', async () => {
    const hash = await portalApi.hashData('shaivra');
    const secondHash = await portalApi.hashData('shaivra');

    expect(hash).toHaveLength(64);
    expect(hash).toBe(secondHash);
  });
});

describe('portalApi.login', () => {
  const fetchMock = vi.fn();

  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock as any);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  it('throws when required credentials are missing', async () => {
    await expect(portalApi.login('', '')).rejects.toThrow('Email and password are required');
  });

  it('persists tokens and returns backend payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          token: 'mock-token',
          user: { id: '1', email: 'analyst@shaivra.ai', role: 'admin' }
        })
    });

    const response = await portalApi.login('analyst@shaivra.ai', 'StrongPass!23', 'turnstile-token');
    expect(response.token).toBe('mock-token');
    expect(localStorage.getItem('auth_token')).toBe('mock-token');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('surfaces API error messages when authentication fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' })
    });

    await expect(portalApi.login('analyst@shaivra.ai', 'bad-password')).rejects.toThrow('Invalid credentials');
  });
});

describe('portalApi.getDashboardStats', () => {
  it('returns metrics payload with expected schema', async () => {
    const stats = await portalApi.getDashboardStats();
    expect(Array.isArray(stats.data.metrics)).toBe(true);
    expect(stats.data.metrics[0]).toMatchObject({
      id: expect.any(String),
      label: expect.any(String),
      status: expect.any(String)
    });
    expect(typeof stats.data.system_health).toBe('string');
  });

  it('response data validates against dashboardDataSchema', async () => {
    const stats = await portalApi.getDashboardStats();
    const parsed = dashboardDataSchema.safeParse(stats.data);
    expect(parsed.success).toBe(true);
  });
});

describe('portalApi.getLensJobs', () => {
  it('returns array of ingestion jobs and each validates against ingestionJobSchema', async () => {
    const res = await portalApi.getLensJobs();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    for (const job of res.data) {
      const parsed = ingestionJobSchema.safeParse(job);
      expect(parsed.success).toBe(true);
    }
  });
});

describe('portalApi.getMasterGraph', () => {
  const fetchMock = vi.fn();

  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock);
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ nodes: [{ id: 'n1', label: 'Node 1' }], links: [{ source: 'n1', target: 'n2' }] }),
    });
  });

  it('returns graph with nodes and links', async () => {
    const graph = await portalApi.getMasterGraph();
    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('links');
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.links)).toBe(true);
  });
});

describe('portalApi.startAgentInvestigation and pollAgentRun', () => {
  const fetchMock = vi.fn();

  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock);
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('startAgentInvestigation returns runId and poll returns status', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ runId: 'run-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'completed', certainty: 85 }),
      });
    const start = await portalApi.startAgentInvestigation('Target', 'Sector', 'Focus');
    expect(start.runId).toBe('run-123');
    const poll = await portalApi.pollAgentInvestigation('run-123');
    expect(poll.status).toBe('completed');
    expect(poll.certainty).toBe(85);
  });
});
