import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      let refreshed = false;
      const recargar = () => {
        if (refreshed) return;
        refreshed = true;
        window.location.reload();
      };
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing;
        if (nuevo) nuevo.addEventListener('statechange', () => {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting?.postMessage('skipWaiting');
          }
        });
      });
      if (reg.waiting) reg.waiting.postMessage('skipWaiting');
      navigator.serviceWorker.addEventListener('controllerchange', recargar);
    } catch {}
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
