import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import type { MenuItem } from 'primereact/menuitem';
import AppHeader from './AppHeader';
import { useAuth } from '../../contexts/AuthContext';
import type { iUser } from '../../types/types';

vi.mock('../../utils/auth', () => ({
  handleUnauthorized: vi.fn(),
  registerClearUser: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));


const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Accounts', icon: 'pi pi-wallet' },
  { label: 'Transactions', icon: 'pi pi-list' },
  { label: 'Reports', icon: 'pi pi-chart-bar' },
  { label: 'Settings', icon: 'pi pi-cog' },
];

const MOCK_USER: iUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
};

const mockClearUser = vi.fn();

function renderHeader(props?: Partial<{ isSidebarOpen: boolean; onSidebarToggle: () => void }>) {
  const merged = { isSidebarOpen: false, onSidebarToggle: vi.fn(), ...props };
  return render(
    <BrowserRouter>
      <AppHeader
        isSidebarOpen={merged.isSidebarOpen}
        onSidebarToggle={merged.onSidebarToggle}
        items={NAV_ITEMS}
      />
    </BrowserRouter>,
  );
}

describe('AppHeader', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: mockClearUser });
    mockClearUser.mockReset();
  });

  describe('hamburger button', () => {
    it('should_renderWithOpenLabel_whenClosed', () => {
      renderHeader({ isSidebarOpen: false });
      expect(
        screen.getByRole('button', { name: 'Open navigation menu' }),
      ).toBeInTheDocument();
    });

    it('should_renderWithCloseLabel_whenOpen', () => {
      renderHeader({ isSidebarOpen: true });
      expect(
        screen.getByRole('button', { name: 'Close navigation menu' }),
      ).toBeInTheDocument();
    });

    it('should_haveAriaExpandedFalse_whenClosed', () => {
      renderHeader({ isSidebarOpen: false });
      expect(
        screen.getByRole('button', { name: 'Open navigation menu' }),
      ).toHaveAttribute('aria-expanded', 'false');
    });

    it('should_haveAriaExpandedTrue_whenOpen', () => {
      renderHeader({ isSidebarOpen: true });
      expect(
        screen.getByRole('button', { name: 'Close navigation menu' }),
      ).toHaveAttribute('aria-expanded', 'true');
    });

    it('should_haveAriaControls_pointingToSidebar', () => {
      renderHeader();
      expect(
        screen.getByRole('button', { name: 'Open navigation menu' }),
      ).toHaveAttribute('aria-controls', 'app-sidebar');
    });

    it('should_callOnSidebarToggle_whenClicked', async () => {
      const onSidebarToggle = vi.fn();
      renderHeader({ onSidebarToggle });
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      expect(onSidebarToggle).toHaveBeenCalledOnce();
    });
  });

  describe('logo links', () => {
    it('should_renderAccessibleLogoLinks', () => {
      renderHeader();
      const logoLinks = screen.getAllByRole('link', { name: /banksy/i });
      expect(logoLinks.length).toBeGreaterThan(0);
    });
  });

  describe('auth button — logged out', () => {
    it('should_showLoginButtons_whenUserIsNull', () => {
      renderHeader();
      const buttons = screen.getAllByRole('button', { name: 'Login' });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('should_navigateToGoogleOAuth_whenLoginButtonClicked', async () => {
      renderHeader();
      const [firstLoginButton] = screen.getAllByRole('button', { name: 'Login' });
      await userEvent.click(firstLoginButton);
      expect(window.location.href).toContain('/oauth2/authorization/google');
    });
  });

  describe('auth button — logged in', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: MOCK_USER,
        isLoading: false,
        clearUser: mockClearUser,
      });
    });

    it('should_showLogoutButtons_whenUserIsLoggedIn', () => {
      renderHeader();
      const buttons = screen.getAllByRole('button', { name: 'Logout' });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('should_navigateToLogoutUrl_whenLogoutClicked', async () => {
      renderHeader();
      const [firstLogoutButton] = screen.getAllByRole('button', { name: 'Logout' });
      await userEvent.click(firstLogoutButton);
      expect(window.location.href).toContain('/logout');
    });
  });

  describe('desktop — welcome message', () => {
    it('should_showWelcomeMessage_whenUserIsLoggedIn', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: MOCK_USER,
        isLoading: false,
        clearUser: mockClearUser,
      });
      renderHeader();
      expect(screen.getByText('Welcome Test User!')).toBeInTheDocument();
    });

    it('should_notShowWelcomeMessage_whenUserIsNull', () => {
      renderHeader();
      expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
    });
  });

  describe('desktop — menubar', () => {
    it('should_renderMenubarComponent', () => {
      renderHeader();
      expect(document.querySelector('.p-menubar')).toBeInTheDocument();
    });

    it('should_renderMultipleLogoLinksIncludingMenubarStart', () => {
      renderHeader();
      const logoLinks = screen.getAllByRole('link', { name: /banksy/i });
      expect(logoLinks.length).toBeGreaterThanOrEqual(2);
    });
  });
});
