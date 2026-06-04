import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import HomepagePage from './components/Homepage/HomepagePage';

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomepagePage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
