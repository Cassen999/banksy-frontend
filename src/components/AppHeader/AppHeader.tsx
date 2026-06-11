import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import banksyLogo from '../../assets/banksy-logo.png';
import banksyLogoDark from '../../assets/banksy-logo-dark.png';
import banksyAppLogo from '../../assets/banksy-app-logo.png';
import banksyAppLogoDark from '../../assets/banksy-app-logo-dark.png';

interface iAppHeaderProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  items: MenuItem[];
}

export default function AppHeader({ isSidebarOpen, onSidebarToggle, items }: iAppHeaderProps) {
  const { user } = useAuth();
  const { theme } = useTheme();

  const logoSrc = theme === 'dark' ? banksyLogoDark : banksyLogo;
  const appLogoSrc = theme === 'dark' ? banksyAppLogoDark : banksyAppLogo;

  const menubarStart = (
    <Link
      to="/dashboard"
      className="header__menubar-logo-link"
      aria-label="Banksy — go to home page"
    >
      <img
        src={appLogoSrc}
        alt=""
        aria-hidden="true"
        className="header__menubar-logo"
      />
    </Link>
  );

  return (
    <header className="header" role="banner">
      {/* Mobile layout — visible below desktop breakpoint */}
      <div className="header__mobile">
        <Button
          icon="pi pi-bars"
          rounded
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          className="header__hamburger"
        />
      </div>

      {/* Desktop layout — visible at desktop breakpoint and above */}
      <div className="header__desktop">
        <Link
          to="/dashboard"
          className="header__brand-link"
          aria-label="Banksy — go to home page"
        >
          <img
            src={logoSrc}
            alt=""
            aria-hidden="true"
            className="header__brand-logo"
          />
        </Link>

        <div className="header__nav">
          <Menubar model={items} start={menubarStart} />
        </div>

        <div className="header__user-section">
          {user && (
            <span className="header__welcome">
              Welcome {user.firstName}!
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
