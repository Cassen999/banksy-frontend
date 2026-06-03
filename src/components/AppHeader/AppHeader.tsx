import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '../../contexts/AuthContext';
import banksyLogo from '../../assets/banksy-logo.png';
import banksyAppLogo from '../../assets/banksy-app-logo.png';

interface iAppHeaderProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  items: MenuItem[];
}

export default function AppHeader({ isSidebarOpen, onSidebarToggle, items }: iAppHeaderProps) {
  const { user } = useAuth();

  function handleLogin() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
  }

  function handleLogout() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/logout`;
  }

  const authButton = (
    <Button
      label={user ? 'Logout' : 'Login'}
      rounded
      onClick={user ? handleLogout : handleLogin}
      className='header__auth-button'
    />
  );

  const menubarStart = (
    <Link
      to="/"
      className="header__menubar-logo-link"
      aria-label="Banksy — go to home page"
    >
      <img
        src={banksyAppLogo}
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
        <button
          className="header__hamburger"
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
        >
          <i className="pi pi-bars" aria-hidden="true" />
        </button>

        <Link
          to="/"
          className="header__app-logo-link"
          aria-label="Banksy — go to home page"
        >
          <img
            src={banksyAppLogo}
            alt=""
            aria-hidden="true"
            className="header__app-logo"
          />
        </Link>

        <div className="header__mobile-auth">{authButton}</div>
      </div>

      {/* Desktop layout — visible at desktop breakpoint and above */}
      <div className="header__desktop">
        <Link
          to="/"
          className="header__brand-link"
          aria-label="Banksy — go to home page"
        >
          <img
            src={banksyLogo}
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
              Welcome {user.firstName} {user.lastName}!
            </span>
          )}
          {authButton}
        </div>
      </div>
    </header>
  );
}
