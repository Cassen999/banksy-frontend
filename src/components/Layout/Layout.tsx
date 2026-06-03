import { useState } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem } from 'primereact/menuitem';
import AppHeader from '../AppHeader/AppHeader';
import AppSidebar from '../AppSidebar/AppSidebar';

interface iLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Accounts', icon: 'pi pi-wallet' },
  { label: 'Transactions', icon: 'pi pi-list' },
  { label: 'Reports', icon: 'pi pi-chart-bar' },
  { label: 'Settings', icon: 'pi pi-cog' },
];

export default function Layout({ children }: iLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      <main className="layout__body">{children}</main>
    </div>
  );
}
