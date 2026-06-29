import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { MenuItem } from 'primereact/menuitem';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import AppHeader from '../AppHeader/AppHeader';
import AppSidebar from '../AppSidebar/AppSidebar';
import ViewportMask from '../ViewportMask/ViewportMask';
import { useAuth } from '../../contexts/AuthContext';
import { useNotify } from '../../contexts/NotificationContext';

interface iLayoutProps {
  children: ReactNode;
}

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/account': 'Account',
  '/settings': 'Settings',
};

export default function Layout({ children }: iLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pageName = PAGE_NAMES[location.pathname] ?? '';
  const { user, isLoading } = useAuth();
  const { toastRef, hideToast, showBanner, bannerConfig, triggerToast } = useNotify();

  const NAV_ITEMS: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', url: '/dashboard', command: () => navigate('/dashboard'), className: location.pathname === '/dashboard' ? 'active' : undefined },
    { label: 'Accounts', icon: 'pi pi-wallet', url: '/account', command: () => navigate('/account'), className: location.pathname === '/account' ? 'active' : undefined },
    { label: 'Transactions', icon: 'pi pi-list' },
    { label: 'Reports', icon: 'pi pi-chart-bar' },
    { label: 'Settings', icon: 'pi pi-cog', url: '/settings', command: () => navigate('/settings'), className: location.pathname === '/settings' ? 'active' : undefined },
  ];

  useEffect(() => {
    if (!isLoading && user) {
      const flag = sessionStorage.getItem('banksy_login_pending');
      if (flag) {
        sessionStorage.removeItem('banksy_login_pending');
        triggerToast({ severity: 'success', summary: 'Login Successful', detail: 'Welcome to Banksy!' });
      }
    }
  }, [isLoading, user, triggerToast]);

  function handleSidebarToggle() {
    setIsSidebarOpen((prev) => !prev);
  }

  function handleSidebarClose() {
    setIsSidebarOpen(false);
  }

  return (
    <>
      <div className="layout" inert={!user ? true : undefined}>
        <AppHeader
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={handleSidebarToggle}
          items={NAV_ITEMS}
          pageName={pageName}
        />

        <AppSidebar
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
          items={NAV_ITEMS}
        />

        {isSidebarOpen && (
          <div
            className="layout__overlay"
            onClick={handleSidebarClose}
            aria-hidden="true"
          />
        )}

        <Toast ref={toastRef} onHide={hideToast} />

        {showBanner && bannerConfig && (
          <div className="layout__banner">
            <Message {...bannerConfig} />
          </div>
        )}

        <main className="layout__body">{children}</main>
      </div>
      <ViewportMask />
    </>
  );
}
