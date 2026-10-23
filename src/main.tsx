import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { getActivePerformanceTier, applyPerformanceClasses } from './utils/devicePerformance';

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
