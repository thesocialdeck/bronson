import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSince < 7) {
        return;
      }
    }

    let showPromptTimer: NodeJS.Timeout | null = null;

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after user has used app a bit (3 seconds)
      showPromptTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (showPromptTimer) {
        clearTimeout(showPromptTimer);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted install');
    } else {
      console.log('User dismissed install');
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Install Bronson</h3>
            <p className="text-sm text-purple-100 mb-3">
              Add to your home screen for quick access and offline use!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors text-sm"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 font-medium rounded-lg transition-colors text-sm"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
