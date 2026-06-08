import { useAuth } from '../../contexts/AuthContext';
import banksyLogo from '../../assets/banksy-logo.png';
import type { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';

const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Accounts', icon: 'pi pi-wallet' },
  { label: 'Transactions', icon: 'pi pi-list' },
  { label: 'Reports', icon: 'pi pi-chart-bar' },
  { label: 'Settings', icon: 'pi pi-cog' },
];

export default function HomepagePage() {
  const { user } = useAuth();

  return (
    <div className="homepage">
      <div className="homepage__content">
        {user ? (
          <>
            <h1 className="homepage__heading">
              Welcome to{' '}
              <img src={banksyLogo} alt="Banksy" className="homepage__logo" />
            </h1>
            <nav className="homepage__nav" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <Button key={item.label} label={item.label} icon={item.icon} />
              ))}
            </nav>
          </>
        ) : (
          <h1>Please log in to be finance guy</h1>
        )}
      </div>
    </div>
  );
}
