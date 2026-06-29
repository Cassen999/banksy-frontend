import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import type { iUser } from '../../types/types';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotify: vi.fn(),
}));

vi.mock('../ViewportMask/ViewportMask', () => ({
  default: vi.fn(() => null),
}));

vi.mock('../../assets/banksy-logo.png', () => ({ default: 'banksy-logo.png' }));
vi.mock('../../assets/banksy-logo-dark.png', () => ({ default: 'banksy-logo-dark.png' }));
vi.mock('../../assets/banksy-app-logo.png', () => ({ default: 'banksy-app-logo.png' }));
vi.mock('../../assets/banksy-app-logo-dark.png', () => ({ default: 'banksy-app-logo-dark.png' }));

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

function setupMocks(user: iUser | null = MOCK_USER) {
  vi.mocked(useAuth).mockReturnValue({ user, isLoading: false, clearUser: vi.fn() });
  vi.mocked(useNotify).mockReturnValue({
    toastRef: { current: null },
    showToast: false,
    toastConfig: null,
    triggerToast: mockTriggerToast,
    hideToast: vi.fn(),
    showBanner: false,
    bannerConfig: null,
    triggerBanner: vi.fn(),
    hideBanner: vi.fn(),
  });
}

function renderLayout(children = <p>page content</p>) {
  return render(
    <BrowserRouter>
      <Layout>{children}</Layout>
    </BrowserRouter>,
  );
}

function renderLayoutWithRoute(path: string, children = <p>page content</p>) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>{children}</Layout>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockTriggerToast.mockReset();
    setupMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('structure', () => {
    it('should_renderHeaderLandmark', () => {
      renderLayout();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should_renderMainLandmark', () => {
      renderLayout();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should_renderChildrenInsideMain', () => {
      renderLayout(<p>page content</p>);
      expect(screen.getByRole('main')).toContainElement(screen.getByText('page content'));
    });

    it('should_haveOnlyOneMainLandmark', () => {
      renderLayout();
      expect(screen.getAllByRole('main')).toHaveLength(1);
    });
  });

  describe('sidebar state', () => {
    it('should_haveSidebarClosed_onInitialRender', () => {
      renderLayout();
      expect(document.querySelector('.sidebar')).not.toHaveClass('sidebar--open');
    });

    it('should_openSidebar_whenHamburgerIsClicked', async () => {
      renderLayout();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      expect(document.querySelector('.sidebar')).toHaveClass('sidebar--open');
    });

    it('should_showOverlay_whenSidebarIsOpen', async () => {
      renderLayout();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      expect(document.querySelector('.layout__overlay')).toBeInTheDocument();
    });

    it('should_closeSidebar_whenOverlayIsClicked', async () => {
      renderLayout();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      await userEvent.click(document.querySelector('.layout__overlay')!);
      await waitFor(() =>
        expect(document.querySelector('.sidebar')).not.toHaveClass('sidebar--open'),
      );
    });

    it('should_closeSidebar_whenXButtonIsClicked', async () => {
      renderLayout();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
      await waitFor(() =>
        expect(document.querySelector('.sidebar')).not.toHaveClass('sidebar--open'),
      );
    });

    it('should_notShowOverlay_whenSidebarIsClosed', () => {
      renderLayout();
      expect(document.querySelector('.layout__overlay')).not.toBeInTheDocument();
    });
  });

  describe('body scroll lock', () => {
    it('should_lockBodyScroll_whenSidebarOpens', async () => {
      renderLayout();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should_restoreBodyScroll_whenSidebarCloses', async () => {
      renderLayout();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
      await waitFor(() => expect(document.body.style.overflow).toBe(''));
    });
  });

  describe('nav items', () => {
    it('should_haveDashboardNavItemWithCorrectUrl', () => {
      renderLayout();
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar?.innerHTML).toContain('/dashboard');
    });

    it('should_haveSettingsNavItemWithCorrectUrl', () => {
      renderLayout();
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar?.innerHTML).toContain('/settings');
    });
  });

  describe('nav item active state', () => {
    it('applies active class to exactly one nav item', () => {
      renderLayoutWithRoute('/dashboard');
      const activeItems = document.querySelectorAll('.p-menuitem.active');
      expect(activeItems.length).toBe(1);
    });

    it('marks the Dashboard item active when on the dashboard route', () => {
      renderLayoutWithRoute('/dashboard');
      const activeItem = document.querySelector('.p-menuitem.active');
      expect(activeItem?.textContent).toContain('Dashboard');
    });

    it('marks the Settings item active when on the settings route', () => {
      renderLayoutWithRoute('/settings');
      const activeItem = document.querySelector('.p-menuitem.active');
      expect(activeItem?.textContent).toContain('Settings');
    });

    it('marks the Accounts item active when on the account route', () => {
      renderLayoutWithRoute('/account');
      const activeItem = document.querySelector('.p-menuitem.active');
      expect(activeItem?.textContent).toContain('Accounts');
    });
  });

  describe('inert attribute', () => {
    it('should_applyInert_whenUserIsNull', () => {
      setupMocks(null);
      renderLayout();
      expect(document.querySelector('.layout')).toHaveAttribute('inert');
    });

    it('should_notApplyInert_whenUserIsPresent', () => {
      setupMocks(MOCK_USER);
      renderLayout();
      expect(document.querySelector('.layout')).not.toHaveAttribute('inert');
    });
  });

  describe('login success notification', () => {
    it('should_triggerSuccessToast_whenFlagSetAndUserLoads', async () => {
      sessionStorage.setItem('banksy_login_pending', '1');
      setupMocks(MOCK_USER);
      renderLayout();
      await waitFor(() => {
        expect(mockTriggerToast).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Login Successful',
          detail: 'Welcome to Banksy!',
        });
      });
    });

    it('should_clearFlag_afterSuccessToastFires', async () => {
      sessionStorage.setItem('banksy_login_pending', '1');
      setupMocks(MOCK_USER);
      renderLayout();
      await waitFor(() => {
        expect(sessionStorage.getItem('banksy_login_pending')).toBeNull();
      });
    });

    it('should_notTriggerToast_whenFlagIsAbsent', async () => {
      setupMocks(MOCK_USER);
      renderLayout();
      await new Promise((r) => setTimeout(r, 50));
      expect(mockTriggerToast).not.toHaveBeenCalled();
    });

    it('should_notTriggerToast_whenUserIsNull', async () => {
      sessionStorage.setItem('banksy_login_pending', '1');
      setupMocks(null);
      renderLayout();
      await new Promise((r) => setTimeout(r, 50));
      expect(mockTriggerToast).not.toHaveBeenCalled();
    });
  });
});
