import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import HomepagePage from './components/Homepage/HomepagePage';
import AccountPage from './components/Account/AccountPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomepagePage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </Layout>
      </NotificationProvider>
    </AuthProvider>
  );
}
