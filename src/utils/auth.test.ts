import { describe, it, expect, beforeEach } from 'vitest';

describe('handleUnauthorized', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  it('should_redirectToOAuthEndpoint_whenCalled', async () => {
    const { handleUnauthorized } = await import('./auth');
    handleUnauthorized();
    expect(window.location.href).toBe(
      `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`,
    );
  });
});
