import { useEffect, useState } from 'react';

export function usePWA() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service worker registered');
        setRegistration(reg);

        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Update available');
                setUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading');
      window.location.reload();
    });
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
