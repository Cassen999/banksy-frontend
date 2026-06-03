import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Layout from './Layout';

vi.mock('../../utils/auth', () => ({
  handleUnauthorized: vi.fn(),
  registerClearUser: vi.fn(),
}));

function renderLayout(children = <p>page content</p>) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Layout>{children}</Layout>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('Layout', () => {
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
      expect(screen.getByRole('main')).toContainElement(
        screen.getByText('page content'),
      );
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
});
