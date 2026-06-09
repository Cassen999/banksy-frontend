import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Divider } from 'primereact/divider';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '../../contexts/AuthContext';

interface iAppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}

export default function AppSidebar({ isOpen, onClose, items }: iAppSidebarProps) {
  const { user } = useAuth();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`sidebar${isOpen ? ' sidebar--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      id="app-sidebar"
    >
      <button
        className="sidebar__close"
        onClick={onClose}
        aria-label="Close menu"
      >
        <i className="pi pi-times" aria-hidden="true" />
      </button>

      <div className="sidebar__user">
        <i className="pi pi-user" aria-hidden="true" />
        <span>{user ? `${user.firstName} ${user.lastName}` : 'Guest'}</span>
      </div>

      <Divider />

      <nav className="sidebar__nav-wrapper" aria-label="Main navigation">
        <ul className="sidebar__nav">
          {items.map((item) => (
            <li key={item.label} className={`sidebar__nav-item${item.url ? ' sidebar__nav-item--link' : ''}`}>
              {item.url ? (
                <Link to={item.url}>
                  {item.icon && <i className={item.icon} aria-hidden="true" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <>
                  {item.icon && <i className={item.icon} aria-hidden="true" />}
                  <span>{item.label}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <small className="sidebar__copyright">
        © Banksy. All rights reserved.
      </small>
    </div>
  );
}
