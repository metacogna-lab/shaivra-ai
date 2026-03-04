import request from 'supertest';
import type { Express } from 'express';
import { describe, expect, it, afterEach, beforeAll, vi } from 'vitest';

if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = 'https://stub.supabase.co';
if (!process.env.SUPABASE_ANON_KEY) process.env.SUPABASE_ANON_KEY = 'public-anon-key';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret';

vi.mock('vite', () => ({
  createServer: vi.fn()
}));

vi.mock('../../src/server/middleware/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'tester', role: 'admin', email: 'tester@shaivra.ai' };
    next();
  },
  optionalAuthenticate: (_req: any, _res: any, next: any) => next()
}));

const passThrough = (_req: any, _res: any, next: any) => next();
vi.mock('../../src/server/middleware/rateLimiting', () => ({
  globalLimiter: passThrough,
  aiLimiter: passThrough,
  authLimiter: passThrough,
  searchLimiter: passThrough
}));

const mockAuthenticateUser = vi.fn();
const mockRegisterUser = vi.fn();
const mockSignOutUser = vi.fn();

vi.mock('../../src/server/auth/supabaseAuth', () => ({
  authenticateUser: mockAuthenticateUser,
  registerUser: mockRegisterUser,
  signOutUser: mockSignOutUser,
  generateToken: () => 'signed-jwt',
  verifyToken: () => ({ userId: 'tester', role: 'admin', email: 'tester@shaivra.ai' })
}));

let app: Express;

beforeAll(async () => {
  const mod = await import('../../server');
  app = mod.app;
});

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return {
      models: {
        generateContent: mockGenerateContent
      }
    };
  })
}));

const mockFetch = vi.fn();
vi.mock('node-fetch', () => ({
  default: (...args: any[]) => mockFetch(...args)
}));

const restoreEnv = (key: string, value?: string) => {
  if (typeof value === 'undefined') {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

const originalEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SHODAN_API_KEY: process.env.SHODAN_API_KEY
};

afterEach(() => {
  mockGenerateContent.mockReset();
  mockFetch.mockReset();
  mockAuthenticateUser.mockReset();
  mockRegisterUser.mockReset();
  mockSignOutUser.mockReset();
  restoreEnv('GEMINI_API_KEY', originalEnv.GEMINI_API_KEY);
  restoreEnv('SHODAN_API_KEY', originalEnv.SHODAN_API_KEY);
});

describe('POST /api/search', () => {
  it('rejects requests when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await request(app).post('/api/search').send({ query: 'targets' });
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/GEMINI_API_KEY/i);
  });

  it('returns AI results when configured', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockResolvedValue({
      text: 'analysis',
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { title: 'Doc', uri: 'https://example.com' } }
            ]
          }
        }
      ]
    });

    const response = await request(app).post('/api/search').send({ query: 'targets' });
    expect(response.status).toBe(200);
    expect(response.body.text).toBe('analysis');
    expect(response.body.sources[0].uri).toBe('https://example.com');
  });
});

describe('GET /api/osint/shodan', () => {
  it('returns 400 when API key missing', async () => {
    delete process.env.SHODAN_API_KEY;
    const response = await request(app).get('/api/osint/shodan').query({ query: 'sample' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/SHODAN_API_KEY/i);
  });

  it('proxies the shodan API when configured', async () => {
    process.env.SHODAN_API_KEY = 'shodan-key';
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ matches: [{ ip_str: '1.1.1.1' }] })
    } as any);

    const response = await request(app).get('/api/osint/shodan').query({ query: 'sample' });
    expect(response.status).toBe(200);
    expect(response.body.matches[0].ip_str).toBe('1.1.1.1');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('shodan.io'));
  });
});

describe('POST /api/forge/analyze', () => {
  it('fails when API key missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await request(app).post('/api/forge/analyze').send({
      target: 'Target Corp',
      scenario: 'Test',
      lensData: {},
      globalGraphData: {}
    });
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/GEMINI_API_KEY/i);
  });

  it('returns synthesized analysis when configured', async () => {
    process.env.GEMINI_API_KEY = 'forge-key';
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        consensus_summary: 'Aligned summary',
        probability_assessment: 0.82,
        corroborated_findings: ['Finding'],
        contradictions_flagged: [],
        source_weighting: { lens: 0.6, global_graph: 0.4 },
        strategic_recommendation: 'Proceed',
        generated_scenarios: []
      })
    });

    const response = await request(app).post('/api/forge/analyze').send({
      target: 'Target Corp',
      scenario: 'Supply Chain',
      lensData: { signals: [] },
      globalGraphData: { entities: [] }
    });
    expect(response.status).toBe(200);
    expect(response.body.consensus_summary).toBe('Aligned summary');
    expect(response.body.source_weighting.lens).toBe(0.6);
  });
});

describe('Agent investigations API', () => {
  it('creates an investigation and returns completed status', async () => {
    process.env.GEMINI_API_KEY = 'agent-key';
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        new_certainty: 90,
        new_findings: { report: 'Complete' },
        citations: [],
        logs: ['done'],
        is_satisfied: true
      })
    });

    const response = await request(app)
      .post('/api/agent/investigate')
      .send({ target: 'Alpha Org', sector: 'Energy', focus: 'Exposure' });

    expect(response.status).toBe(200);
    expect(response.body.runId).toMatch(/run-/);

    await new Promise(resolve => setTimeout(resolve, 10));

    const status = await request(app).get(`/api/agent/investigate/${response.body.runId}`);
    expect(status.status).toBe(200);
    expect(status.body.status).toBe('completed');
    expect(status.body.certainty).toBeGreaterThanOrEqual(80);
  });

  it('returns 404 for unknown run id', async () => {
    const res = await request(app).get('/api/agent/investigate/run-missing');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token and user payload from Supabase auth', async () => {
    mockAuthenticateUser.mockResolvedValue({
      user: { id: 'user-1', email: 'analyst@shaivra.ai', role: 'analyst' },
      session: { refresh_token: 'refresh', access_token: 'access' }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@shaivra.ai', password: 'Secret123!' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('signed-jwt');
    expect(response.body.user.role).toBe('analyst');
    expect(mockAuthenticateUser).toHaveBeenCalledWith('analyst@shaivra.ai', 'Secret123!');
  });

  it('returns 401 when Supabase rejects credentials', async () => {
    mockAuthenticateUser.mockRejectedValue(new Error('Invalid credentials'));

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@shaivra.ai', password: 'bad' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/Authentication failed/i);
  });
});
