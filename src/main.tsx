import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { getActivePerformanceTier, applyPerformanceClasses } from './utils/devicePerformance';

// Register OVERVERSE PWA Service Worker (Workbox precache + runtime offline cache)
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
