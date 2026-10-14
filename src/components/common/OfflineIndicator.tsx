import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Mode Offline</span>
    </div>
  );
};
