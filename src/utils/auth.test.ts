import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('handleUnauthorized', () => {
  beforeEach(() => {
    vi.resetModules();
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

  it('should_callRegisteredClearUser_beforeRedirecting', async () => {
    const { handleUnauthorized, registerClearUser } = await import('./auth');
    const mockClearUser = vi.fn();
    registerClearUser(mockClearUser);
    handleUnauthorized();
    expect(mockClearUser).toHaveBeenCalledOnce();
  });

  it('should_notThrow_whenNoClearUserIsRegistered', async () => {
    const { handleUnauthorized } = await import('./auth');
    expect(() => handleUnauthorized()).not.toThrow();
  });
});

describe('registerClearUser', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  it('should_storeFunction_thatIsCalledByHandleUnauthorized', async () => {
    const { handleUnauthorized, registerClearUser } = await import('./auth');
    const fn = vi.fn();
    registerClearUser(fn);
    handleUnauthorized();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should_replaceExistingRegistration_whenCalledAgain', async () => {
    const { handleUnauthorized, registerClearUser } = await import('./auth');
    const first = vi.fn();
    const second = vi.fn();
    registerClearUser(first);
    registerClearUser(second);
    handleUnauthorized();
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });
});
