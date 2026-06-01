import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeicons/primeicons.css';
import './styles/index.scss';
import './api/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <PrimeReactProvider>
          <App />
        </PrimeReactProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
