import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<p>Welcome to Banksy</p>} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
