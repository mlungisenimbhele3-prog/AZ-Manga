import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-slate-900/95 px-3.5 py-2 text-xs font-semibold text-amber-200 shadow-xl backdrop-blur-md"
    >
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode — Cached OVERVERSE data active</span>
    </div>
  );
};
