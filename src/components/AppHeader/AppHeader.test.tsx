import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import type { MenuItem } from 'primereact/menuitem';
import AppHeader from './AppHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { iUser } from '../../types/types';

vi.mock('../../assets/banksy-logo.png', () => ({ default: 'banksy-logo.png' }));
vi.mock('../../assets/banksy-logo-dark.png', () => ({ default: 'banksy-logo-dark.png' }));
vi.mock('../../assets/banksy-app-logo.png', () => ({ default: 'banksy-app-logo.png' }));
vi.mock('../../assets/banksy-app-logo-dark.png', () => ({ default: 'banksy-app-logo-dark.png' }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
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

function renderHeader(props?: Partial<{ isSidebarOpen: boolean; onSidebarToggle: () => void; pageName: string }>) {
  const merged = { isSidebarOpen: false, onSidebarToggle: vi.fn(), pageName: 'Dashboard', ...props };
  return render(
    <BrowserRouter>
      <AppHeader
        isSidebarOpen={merged.isSidebarOpen}
        onSidebarToggle={merged.onSidebarToggle}
        items={NAV_ITEMS}
        pageName={merged.pageName}
      />
    </BrowserRouter>,
  );
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
  });

  describe('hamburger button', () => {
    it('should_renderWithOpenLabel_whenClosed', () => {
      renderHeader({ isSidebarOpen: false });
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
    });

    it('should_renderWithCloseLabel_whenOpen', () => {
      renderHeader({ isSidebarOpen: true });
      expect(screen.getByRole('button', { name: 'Close navigation menu' })).toBeInTheDocument();
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

  describe('mobile layout', () => {
    it('should_notRenderMobileAppLogo', () => {
      renderHeader();
      expect(document.querySelector('.header__app-logo')).not.toBeInTheDocument();
    });

    it('should_notRenderAuthButton', () => {
      renderHeader();
      expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
    });
  });

  describe('desktop logo', () => {
    it('should_renderAccessibleBrandLogoLink', () => {
      renderHeader();
      const logoLinks = screen.getAllByRole('link', { name: /banksy/i });
      expect(logoLinks.length).toBeGreaterThan(0);
    });

    it('should_renderAtLeastTwoLogoLinks', () => {
      renderHeader();
      const logoLinks = screen.getAllByRole('link', { name: /banksy/i });
      expect(logoLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('dark mode logos', () => {
    it('should_useLightLogos_whenThemeIsLight', () => {
      vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
      renderHeader();
      expect(document.querySelector('.header__brand-logo')?.getAttribute('src')).toBe('banksy-logo.png');
      expect(document.querySelector('.header__menubar-logo')?.getAttribute('src')).toBe('banksy-app-logo.png');
    });

    it('should_useDarkLogos_whenThemeIsDark', () => {
      vi.mocked(useTheme).mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
      renderHeader();
      expect(document.querySelector('.header__brand-logo')?.getAttribute('src')).toBe('banksy-logo-dark.png');
      expect(document.querySelector('.header__menubar-logo')?.getAttribute('src')).toBe('banksy-app-logo-dark.png');
    });
  });

  describe('desktop — welcome message', () => {
    it('should_showWelcomeMessage_whenUserIsLoggedIn', () => {
      vi.mocked(useAuth).mockReturnValue({ user: MOCK_USER, isLoading: false, clearUser: vi.fn() });
      renderHeader();
      expect(screen.getByText('Welcome Test!')).toBeInTheDocument();
    });

    it('should_notShowWelcomeMessage_whenUserIsNull', () => {
      renderHeader();
      expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
    });
  });

  describe('page name', () => {
    it('should_renderPageNameElement_whenProvided', () => {
      renderHeader({ pageName: 'Dashboard' });
      expect(document.querySelectorAll('.header__page-name').length).toBeGreaterThan(0);
    });

    it('should_notRenderPageNameElement_whenEmpty', () => {
      renderHeader({ pageName: '' });
      expect(document.querySelector('.header__page-name')).not.toBeInTheDocument();
    });
  });

  describe('desktop — menubar', () => {
    it('should_renderMenubarComponent', () => {
      renderHeader();
      expect(document.querySelector('.p-menubar')).toBeInTheDocument();
    });

    it('should_renderMenubarLogoLink', () => {
      renderHeader();
      expect(document.querySelector('.header__menubar-logo')).toBeInTheDocument();
    });
  });
});
