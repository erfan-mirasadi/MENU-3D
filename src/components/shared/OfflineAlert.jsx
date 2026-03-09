"use client";
import { useEffect, useState } from "react";
import { FaWifi, FaRedo } from "react-icons/fa";

export default function OfflineAlert({ isConnected }) {
  const [delayedDisconnect, setDelayedDisconnect] = useState(false);
  const [isBrowserOffline, setIsBrowserOffline] = useState(
    () => typeof window !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsBrowserOffline(false);
    const handleOffline = () => setIsBrowserOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isConnected && !isBrowserOffline) {
      const timer = setTimeout(() => setDelayedDisconnect(true), 5000);
      return () => clearTimeout(timer);
    }
    const reset = setTimeout(() => setDelayedDisconnect(false), 0);
    return () => clearTimeout(reset);
  }, [isConnected, isBrowserOffline]);

  const showPopup = isBrowserOffline || delayedDisconnect;

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1F1D2B] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
          <FaWifi className="text-4xl text-red-500" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connection Lost
          </h2>
          <p className="text-gray-400">
            You are currently offline. Real-time updates are paused.
            <br />
            Please check your internet and refresh.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="w-full py-3 bg-accent hover:bg-[#d96c5b] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <FaRedo className={showPopup ? "animate-spin-once" : ""} />
          Refresh Application
        </button>
      </div>
    </div>
  );
}
