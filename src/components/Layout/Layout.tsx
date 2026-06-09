import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { MenuItem } from 'primereact/menuitem';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import AppHeader from '../AppHeader/AppHeader';
import AppSidebar from '../AppSidebar/AppSidebar';
import { useNotify } from '../../contexts/NotificationContext';

interface iLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: iLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toastRef, hideToast, showBanner, bannerConfig } = useNotify();

  const NAV_ITEMS: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home' },
    { label: 'Accounts', icon: 'pi pi-wallet', command: () => navigate('/account'), url: '/account' },
    { label: 'Transactions', icon: 'pi pi-list' },
    { label: 'Reports', icon: 'pi pi-chart-bar' },
    { label: 'Settings', icon: 'pi pi-cog' },
  ];

  function handleSidebarToggle() {
    setIsSidebarOpen((prev) => !prev);
  }

  function handleSidebarClose() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="layout">
      <AppHeader
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={handleSidebarToggle}
        items={NAV_ITEMS}
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
  );
}
