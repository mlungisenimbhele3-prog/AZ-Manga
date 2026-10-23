import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-950/90 px-4 py-2.5 text-xs font-bold text-amber-200 shadow-2xl backdrop-blur-md animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Offline Mode — Cached manga pages & local data active.</span>
    </div>
  );
};
