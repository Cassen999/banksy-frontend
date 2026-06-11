import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ViewportMask from './ViewportMask';
import type { iUser } from '../../types/types';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotify: vi.fn(),
}));

vi.mock('../AuthButton/AuthButton', async () => {
  const { forwardRef } = await import('react');
  return {
    default: forwardRef<HTMLButtonElement>((_props, ref) => <button ref={ref}>Login</button>),
  };
});

import { useAuth } from '../../contexts/AuthContext';
import { useNotify } from '../../contexts/NotificationContext';

const MOCK_USER: iUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
};

const mockTriggerToast = vi.fn();

function setupNotifyMock() {
  vi.mocked(useNotify).mockReturnValue({
    triggerToast: mockTriggerToast,
    hideToast: vi.fn(),
    showToast: false,
    toastConfig: null,
    toastRef: { current: null },
    showBanner: false,
    bannerConfig: null,
    triggerBanner: vi.fn(),
    hideBanner: vi.fn(),
  });
}

describe('ViewportMask', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setupNotifyMock();
    mockTriggerToast.mockReset();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should_renderNothing_whenUserIsPresent', () => {
    vi.mocked(useAuth).mockReturnValue({ user: MOCK_USER, isLoading: false, clearUser: vi.fn() });
    const { container } = render(<ViewportMask />);
    expect(container.firstChild).toBeNull();
  });

  it('should_renderMask_whenUserIsNullAndNotLoading', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(document.querySelector('.viewport-mask')).toBeInTheDocument();
  });

  it('should_renderMask_whenLoading', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: true, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(document.querySelector('.viewport-mask')).toBeInTheDocument();
  });

  it('should_showSpinner_whenLoading', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: true, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(document.querySelector('.p-progress-spinner')).toBeInTheDocument();
  });

  it('should_notShowSpinner_whenNotLoading', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(document.querySelector('.p-progress-spinner')).not.toBeInTheDocument();
  });

  it('should_showLoginMessage_whenNotLoadingAndNoUser', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(screen.getByText('Please login to be finance guy')).toBeInTheDocument();
  });

  it('should_renderAuthButton_whenNotLoadingAndNoUser', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should_notRenderAuthButton_whenLoading', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: true, clearUser: vi.fn() });
    render(<ViewportMask />);
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
  });

  describe('login failure detection', () => {
    it('should_triggerErrorToast_whenFlagSetAndAuthResolvesWithNoUser', async () => {
      sessionStorage.setItem('banksy_login_pending', '1');
      vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      render(<ViewportMask />);
      await waitFor(() => {
        expect(mockTriggerToast).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Something went wrong, please try to login again',
        });
      });
    });

    it('should_clearFlag_afterFailureDetected', async () => {
      sessionStorage.setItem('banksy_login_pending', '1');
      vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      render(<ViewportMask />);
      await waitFor(() => {
        expect(sessionStorage.getItem('banksy_login_pending')).toBeNull();
      });
    });

    it('should_focusLoginButton_afterFailureDetected', async () => {
      sessionStorage.setItem('banksy_login_pending', '1');
      vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      render(<ViewportMask />);
      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });
      focusSpy.mockRestore();
    });

    it('should_notTriggerToast_whenFlagIsAbsent', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      render(<ViewportMask />);
      await new Promise((r) => setTimeout(r, 50));
      expect(mockTriggerToast).not.toHaveBeenCalled();
    });
  });
});
