import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, it, vi } from 'vitest';
import Lens from './Lens';
import { portalApi } from '../../services/portalApi';

const projects = [
  {
    id: 'proj-1',
    name: 'Sentinel',
    description: 'Monitoring narratives',
    created_at: new Date().toISOString(),
    settings: { threat_velocity_threshold: 0.5 }
  }
];

const server = setupServer(
  http.get('/api/projects', () => HttpResponse.json(projects)),
  http.post('/api/osint/maltego', () =>
    HttpResponse.json({ status: 'success', results: [] })
  ),
  http.post('/api/ingestion/advanced', () =>
    HttpResponse.json({ job_ids: ['job-1'], status: 'complete', data: [] })
  ),
  http.get('/api/osint/fingerprint', () =>
    HttpResponse.json({
      stack: ['React'],
      architecture: 'Edge',
      api_endpoints: ['/api/v1'],
      cloud_assets: ['AWS'],
      vulnerabilities: ['none']
    })
  )
);

const portalSpies: Array<ReturnType<typeof vi.spyOn>> = [];

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  portalSpies.forEach(spy => spy.mockRestore());
  portalSpies.length = 0;
});
afterAll(() => server.close());

describe('Lens pipeline', () => {
  it('runs the strategic ingestion flow and shows progress overlay', async () => {
    portalSpies.push(
      vi.spyOn(portalApi, 'simulateNormalization').mockResolvedValue({
        data: {
          event_id: 'evt_1',
          meta: { trace_id: 'tr_norm', timestamp: new Date().toISOString() },
          canonical_event: { type: 'post', normalized_text: 'text' }
        }
      } as any)
    );
    portalSpies.push(
      vi.spyOn(portalApi, 'simulateEnrichment').mockResolvedValue({
        data: {
          embedding_vector: [0.1, 0.2],
          extracted_entities: ['Entity'],
          topic_tags: ['security'],
          meta: { trace_id: 'tr_enrich', timestamp: new Date().toISOString() }
        }
      } as any)
    );
    portalSpies.push(
      vi.spyOn(portalApi, 'simulateClustering').mockResolvedValue({
        data: {
          cluster_id: 'cls_1',
          velocity_score: 0.9,
          lifecycle_stage: 'emerging',
          meta: { trace_id: 'tr_cluster', timestamp: new Date().toISOString() }
        }
      } as any)
    );
    portalSpies.push(
      vi.spyOn(portalApi, 'simulateLLMAnalysis').mockResolvedValue({
        data: {
          escalation_probability: 0.9,
          recommended_actions: ['Monitor'],
          meta: { trace_id: 'tr_llm', timestamp: new Date().toISOString() }
        }
      } as any)
    );
    render(
      <MemoryRouter>
        <Lens />
      </MemoryRouter>
    );

    await screen.findByText(/Advanced Ingestion Configuration/i);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Enter domains, entities/i),
      'target-corp.com'
    );

    await user.click(screen.getByRole('button', { name: /Launch Strategic Ingestion/i }));

    const overlays = await screen.findAllByText(/Strategic Intelligence Synthesis/i);
    expect(overlays.length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument());
  });
});
