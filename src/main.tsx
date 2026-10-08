import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { App } from './app/App';
import { AuthProvider } from './app/auth';
import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3200} newestOnTop closeOnClick pauseOnHover theme="colored" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
