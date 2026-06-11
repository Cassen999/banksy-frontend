import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthButton from './AuthButton';
import type { iAuthButtonHandle } from './AuthButton';
import type { iUser } from '../../types/types';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';

const MOCK_USER: iUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
};

describe('AuthButton', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
    sessionStorage.clear();
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('label', () => {
    it('should_showLogin_whenUserIsNull', () => {
      render(<AuthButton />);
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('should_showLogout_whenUserIsPresent', () => {
      vi.mocked(useAuth).mockReturnValue({ user: MOCK_USER, isLoading: false, clearUser: vi.fn() });
      render(<AuthButton />);
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });
  });

  describe('login', () => {
    it('should_setSessionStorageFlag_whenLoginClicked', async () => {
      render(<AuthButton />);
      await userEvent.click(screen.getByRole('button', { name: 'Login' }));
      expect(sessionStorage.getItem('banksy_login_pending')).toBe('1');
    });

    it('should_navigateToOAuthUrl_whenLoginClicked', async () => {
      render(<AuthButton />);
      await userEvent.click(screen.getByRole('button', { name: 'Login' }));
      expect(window.location.href).toContain('/oauth2/authorization/google');
    });
  });

  describe('logout', () => {
    it('should_notSetSessionStorageFlag_whenLogoutClicked', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: MOCK_USER, isLoading: false, clearUser: vi.fn() });
      render(<AuthButton />);
      await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
      expect(sessionStorage.getItem('banksy_login_pending')).toBeNull();
    });

    it('should_navigateToLogoutUrl_whenLogoutClicked', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: MOCK_USER, isLoading: false, clearUser: vi.fn() });
      render(<AuthButton />);
      await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
      expect(window.location.href).toContain('/logout');
    });
  });

  describe('ref forwarding', () => {
    it('should_exposesFocusMethod_viaRef', () => {
      const ref = createRef<iAuthButtonHandle>();
      render(<AuthButton ref={ref} />);
      expect(typeof ref.current?.focus).toBe('function');
    });
  });
});
