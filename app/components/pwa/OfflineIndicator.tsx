import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOnlineToast) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      ) : (
        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Back Online!</span>
        </div>
      )}
    </div>
  );
}
