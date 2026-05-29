import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

vi.mock('../utils/auth', () => ({
  handleUnauthorized: vi.fn(),
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_callHandleUnauthorized_when401ResponseReceived', async () => {
    const { handleUnauthorized } = await import('../utils/auth');
    const { apiClient } = await import('./client');

    server.use(
      http.get('http://localhost:8080/api/_test-401', () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    await expect(apiClient.get('/api/_test-401')).rejects.toThrow();
    expect(handleUnauthorized).toHaveBeenCalledOnce();
  });

  it('should_notCallHandleUnauthorized_when200ResponseReceived', async () => {
    const { handleUnauthorized } = await import('../utils/auth');
    const { apiClient } = await import('./client');

    server.use(
      http.get('http://localhost:8080/api/_test-200', () =>
        HttpResponse.json({ ok: true }),
      ),
    );

    await expect(apiClient.get('/api/_test-200')).resolves.toBeDefined();
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });

  it('should_notCallHandleUnauthorized_whenNetworkErrorHasNoResponse', async () => {
    const { handleUnauthorized } = await import('../utils/auth');
    const { apiClient } = await import('./client');

    server.use(
      http.get('http://localhost:8080/api/_test-network', () =>
        HttpResponse.error(),
      ),
    );

    await expect(apiClient.get('/api/_test-network')).rejects.toThrow();
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });
});
