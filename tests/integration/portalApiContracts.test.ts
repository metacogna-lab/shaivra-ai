/**
 * Integration tests: portalApi responses match portal contracts when MSW returns schema-valid dummy data.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { portalApi } from '../../src/services/portalApi';
import { dashboardDataSchema, ingestionJobSchema } from '../../src/contracts/portal';

const server = setupServer(
  http.get('/api/projects', () => HttpResponse.json([])),
  http.get('/api/stats', () =>
    HttpResponse.json({
      total_entities: 100,
      active_investigations: 2,
      data_points_ingested: 1000,
      threat_actors_tracked: 5,
      last_sync: new Date().toISOString(),
    })
  ),
  http.get('/api/admin/reports/daily', () =>
    HttpResponse.json({
      report_id: 'daily-rpt-2025-01-15',
      date: new Date().toISOString(),
      summary: 'Daily summary',
      top_threats: [],
      sector_shifts: [],
      graph_updates: { nodes: [], links: [] },
      ml_insights: { clusters: [], trends: [] },
    })
  ),
  http.post('/api/ingestion/advanced', () =>
    HttpResponse.json({
      job_ids: ['job-1'],
      status: 'complete',
      data: [],
    })
  ),
  http.post('/api/osint/maltego', () =>
    HttpResponse.json({
      status: 'success',
      results: [{ id: 'm1', type: 'DNS', value: 'example.com', source: 'Maltego' }],
    })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard flow – getDashboardStats', () => {
  it('getDashboardStats return shape validates against dashboardDataSchema', async () => {
    const res = await portalApi.getDashboardStats();
    const parsed = dashboardDataSchema.safeParse(res.data);
    expect(parsed.success).toBe(true);
  });
});

describe('Dashboard flow – getLensJobs', () => {
  it('getLensJobs returns array and each job validates against ingestionJobSchema', async () => {
    const res = await portalApi.getLensJobs();
    expect(Array.isArray(res.data)).toBe(true);
    for (const job of res.data) {
      const parsed = ingestionJobSchema.safeParse(job);
      expect(parsed.success).toBe(true);
    }
  });
});

describe('Lens flow – ingestion and Maltego', () => {
  it('ingestion/advanced stub returns job_ids and status', async () => {
    const res = await fetch('/api/ingestion/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'target', sources: [] }),
    });
    const data = await res.json();
    expect(data).toHaveProperty('job_ids');
    expect(data).toHaveProperty('status');
  });

  it('osint/maltego stub returns status and results', async () => {
    const res = await fetch('/api/osint/maltego', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'example.com', transform: 'ToDNS' }),
    });
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(Array.isArray(data.results)).toBe(true);
  });
});
