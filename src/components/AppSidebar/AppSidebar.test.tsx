import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import type { MenuItem } from 'primereact/menuitem';
import { AuthProvider } from '../../contexts/AuthContext';
import AppSidebar from './AppSidebar';
import { server } from '../../mocks/server';
import { handlers } from '../../mocks/handlers';


const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Accounts', icon: 'pi pi-wallet' },
  { label: 'Transactions', icon: 'pi pi-list' },
  { label: 'Reports', icon: 'pi pi-chart-bar' },
  { label: 'Settings', icon: 'pi pi-cog' },
];

function renderSidebar(props?: Partial<{ isOpen: boolean; onClose: () => void }>) {
  const merged = { isOpen: true, onClose: vi.fn(), ...props };
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AppSidebar isOpen={merged.isOpen} onClose={merged.onClose} items={NAV_ITEMS} />
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('AppSidebar', () => {
  it('should_notHaveOpenModifier_whenClosed', () => {
    renderSidebar({ isOpen: false });
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('sidebar--open');
  });

  it('should_haveOpenModifier_whenOpen', () => {
    renderSidebar({ isOpen: true });
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('sidebar--open');
  });

  it('should_haveDialogRole_andAriaAttributes', () => {
    renderSidebar();
    const sidebar = screen.getByRole('dialog');
    expect(sidebar).toHaveAttribute('aria-modal', 'true');
    expect(sidebar).toHaveAttribute('aria-label', 'Navigation menu');
  });

  it('should_haveCorrectId_forAriaControls', () => {
    renderSidebar();
    expect(screen.getByRole('dialog')).toHaveAttribute('id', 'app-sidebar');
  });

  it('should_renderCloseButton', () => {
    renderSidebar();
    expect(
      screen.getByRole('button', { name: 'Close menu' }),
    ).toBeInTheDocument();
  });

  it('should_callOnClose_whenCloseButtonClicked', async () => {
    const onClose = vi.fn();
    renderSidebar({ onClose });
    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should_displayUserFullName_whenLoggedIn', async () => {
    renderSidebar();
    expect(await screen.findByText('Test User')).toBeInTheDocument();
  });

  it('should_displayGuest_whenNoUserIsLoggedIn', async () => {
    server.use(handlers.auth.me.unauthorized);
    renderSidebar();
    expect(await screen.findByText('Guest')).toBeInTheDocument();
  });

  it('should_renderAllNavItems', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should_renderCopyrightText', () => {
    renderSidebar();
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
  });

  it('should_lockBodyScroll_whenOpen', () => {
    renderSidebar({ isOpen: true });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should_restoreBodyScroll_whenClosed', () => {
    renderSidebar({ isOpen: false });
    expect(document.body.style.overflow).toBe('');
  });
});
