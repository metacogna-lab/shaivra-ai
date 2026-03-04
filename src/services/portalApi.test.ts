import { portalApi } from './portalApi';

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
});
