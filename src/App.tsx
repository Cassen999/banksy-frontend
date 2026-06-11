import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import HomepagePage from './components/Homepage/HomepagePage';
import AccountPage from './components/Account/AccountPage';
import SettingsPage from './components/Settings/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<HomepagePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </NotificationProvider>
    </AuthProvider>
  );
}
