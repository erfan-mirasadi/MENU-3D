'use client';
import { useState, useEffect, useRef } from 'react';
import { RiCloseLine, RiDownloadLine, RiShareLine, RiAddLine } from 'react-icons/ri';

export default function InstallPwaPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Already running as installed PWA — don't show anything
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;
    if (isStandalone) return;

    // Check if user already dismissed the popup in this session
    const dismissed = sessionStorage.getItem('pwa-popup-dismissed');
    if (dismissed) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // On iOS Safari show manual instruction after a short delay
      const timer = setTimeout(() => setShowPopup(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: listen for the native install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPopup(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowPopup(false);
  };

  const handleDismiss = () => {
    setShowPopup(false);
    sessionStorage.setItem('pwa-popup-dismissed', 'true');
  };

  if (!showPopup) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] animate-fadeIn"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[201] animate-slideUp">
        <div className="mx-auto max-w-lg bg-dark-800 border-t border-dark-600 rounded-t-2xl shadow-2xl p-5 pb-8">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-text-dim hover:text-white rounded-full hover:bg-dark-700 transition-colors"
          >
            <RiCloseLine size={22} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <RiDownloadLine size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-light">Install App</h3>
              <p className="text-xs text-text-dim">Get the full experience</p>
            </div>
          </div>

          {isIos ? (
            /* ── iOS Instructions ── */
            <div className="space-y-4">
              <p className="text-sm text-text-dim leading-relaxed">
                To install this app on your device, follow these steps:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-dark-900/60 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <RiShareLine size={18} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-text-light">
                    Tap the <strong className="text-white">Share</strong> button in Safari
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-dark-900/60 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <RiAddLine size={18} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-text-light">
                    Select <strong className="text-white">Add to Home Screen</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-text-light rounded-xl font-semibold transition-colors mt-2"
              >
                Got it!
              </button>
            </div>
          ) : (
            /* ── Android / Chrome Install ── */
            <div className="space-y-4">
              <p className="text-sm text-text-dim leading-relaxed">
                Install the app for a faster, full-screen experience with push notifications.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-text-dim rounded-xl font-semibold transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3 bg-accent hover:bg-accent/80 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                >
                  <RiDownloadLine size={18} />
                  Install
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
