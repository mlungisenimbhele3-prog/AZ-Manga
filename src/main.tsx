import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { getActivePerformanceTier, applyPerformanceClasses } from './utils/devicePerformance';

// Register OVERVERSE PWA Service Worker in production; in dev mode clean up any stale dev-sw
// so Vite ESM dynamic imports are never intercepted by outdated Workbox caches.
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Periodically check for updated service worker in long-lived standalone sessions
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[OVERVERSE PWA] Service worker registration warning:', error);
    },
  });
} else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((reg) => {
        if (reg.active?.scriptURL?.includes('dev-sw') || reg.active?.scriptURL?.includes('sw.js')) {
          reg.unregister().catch(() => {});
        }
      });
    })
    .catch(() => {});
}

// Initialize device performance profile immediately to prevent layout flashes
try {
  applyPerformanceClasses(getActivePerformanceTier());
} catch {
  // Graceful fallback
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
