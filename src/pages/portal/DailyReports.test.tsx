import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import DailyReports from './DailyReports';

const report = {
  report_id: 'DIR-2026-03-04',
  date: new Date().toISOString(),
  summary: 'Narrative pressure intensifying around climate assets.',
  top_threats: ['Coordinated disinformation on major platforms'],
  sector_shifts: ['Energy firms reallocating budgets toward counter-influence'],
  ml_insights: {
    clusters: ['Cluster A'],
    trends: ['Trend spike into renewables']
  },
  graph_updates: {
    nodes: [{ id: 'n1' }],
    links: [{ id: 'l1' }]
  },
  regional_signals: [],
  recommendations: []
};

const feeds = [
  { id: 1, title: 'UN Resolution on AI Governance', source: 'UN News', type: 'Governance', timestamp: new Date().toISOString() }
];

const server = setupServer(
  http.get('/api/admin/reports/daily', () => HttpResponse.json(report)),
  http.get('/api/rss', () => HttpResponse.json(feeds))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DailyReports', () => {
  it('renders the fetched report and rss feed items', async () => {
    render(
      <MemoryRouter>
        <DailyReports />
      </MemoryRouter>
    );

    await screen.findByText(/Daily Intelligence Report/i);
    expect(screen.getByText(/Narrative pressure intensifying/i)).toBeInTheDocument();
    expect(screen.getAllByText(/UN Resolution on AI Governance/i).length).toBeGreaterThan(0);
  });
});
