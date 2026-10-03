import React, { useEffect, useState } from 'react';
import { WifiOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPendingSyncCount, simulateSyncAll } from '../../services/syncService';

export const LiteModeBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const updateCounts = () => {
    setPendingCount(getPendingSyncCount());
  };

  useEffect(() => {
    updateCounts();

    const handleOnline = () => {
      setIsOffline(false);
      const { syncedCount } = simulateSyncAll();
      if (syncedCount > 0) {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 5000);
      }
      updateCounts();
    };

    const handleOffline = () => {
      setIsOffline(true);
      updateCounts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('medibridge:sync_updated', updateCounts);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('medibridge:sync_updated', updateCounts);
    };
  }, []);

  if (showSyncSuccess) {
    return (
      <div className="bg-emerald-700 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md relative z-50 animate-fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-200" />
          <span>
            <strong className="font-bold">Reconnected:</strong> [Prototype sync simulation: offline records marked as synced in local storage]
          </span>
        </div>
        <button
          onClick={() => setShowSyncSuccess(false)}
          className="text-emerald-200 hover:text-white font-bold ml-2 text-[11px]"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs px-4 py-2.5 flex items-center justify-between shadow-md relative z-50 flex-wrap gap-2">
      <div className="flex items-center gap-2 max-w-2xl">
        <WifiOff size={15} className="shrink-0 animate-pulse" />
        <span>
          <strong className="font-semibold">Offline Mode Active:</strong> Field surveys and assessments are saved locally on this device.
          {pendingCount > 0 && (
            <span className="ml-1 bg-amber-800/80 px-2 py-0.5 rounded-md font-mono font-bold text-[11px]">
              {pendingCount} record{pendingCount > 1 ? 's' : ''} queued
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/resources"
          className="underline font-semibold hover:text-amber-100 flex items-center gap-1"
        >
          Offline Guides <ArrowRight size={12} />
        </Link>
        <Link
          to="/emergency"
          className="bg-red-700 hover:bg-red-800 text-white px-2.5 py-1 rounded font-bold transition-colors"
        >
          108 Emergency
        </Link>
      </div>
    </div>
  );
};
