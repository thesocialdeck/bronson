import { useEffect, useState } from 'react';

export function usePWA() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let updateInterval: NodeJS.Timeout | null = null;

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service worker registered');
        setRegistration(reg);

        // Check for updates periodically
        updateInterval = setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        // Listen for updates
        const handleUpdateFound = () => {
          const newWorker = reg.installing;

          if (newWorker) {
            const handleStateChange = () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Update available');
                setUpdateAvailable(true);
              }
            };
            newWorker.addEventListener('statechange', handleStateChange);
          }
        };

        reg.addEventListener('updatefound', handleUpdateFound);
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });

    // Listen for controlling service worker changes
    const handleControllerChange = () => {
      console.log('[PWA] Controller changed, reloading');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Cleanup function
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    registration,
    updateAvailable,
    updateServiceWorker,
  };
}
