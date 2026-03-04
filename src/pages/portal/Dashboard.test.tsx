import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import Dashboard from './Dashboard';

const projects = [
  {
    id: 'proj-1',
    name: 'Sentinel',
    description: 'Monitoring critical narratives',
    created_at: new Date().toISOString(),
    settings: { threat_velocity_threshold: 0.77 }
  }
];

const server = setupServer(
  http.get('/api/projects', () => HttpResponse.json(projects)),
  http.get('/api/history', () => HttpResponse.json([])),
  http.get('/api/stats', () =>
    HttpResponse.json({
      total_entities: 100,
      active_investigations: 2,
      data_points_ingested: 1000,
      threat_actors_tracked: 5,
      last_sync: new Date().toISOString()
    })
  ),
  http.get('/api/analytics/links', () =>
    HttpResponse.json([
      { id: 'link-1', source: 'Target', target: 'Node', strength: 0.9, type: 'Executive' }
    ])
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Portal Dashboard', () => {
  it('loads projects and exposes the saved threat threshold', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for data to load (spinner disappears)
    await screen.findByText(/Critical Alert: Narrative Velocity Spike/i);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /project settings/i }));

    await screen.findByText(/Project Settings/i);
    expect(screen.getByText('0.77')).toBeInTheDocument();
  });
});
