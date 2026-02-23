"use client";

import { useEffect } from "react";
import { subscribeToPushNotifications } from "@/services/notificationService";
import InstallPwaPopup from "@/components/ui/InstallPwaPopup";

export default function WaiterLayoutClient({ children }) {
  useEffect(() => {
    // Register service worker and subscribe to push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        subscribeToPushNotifications('waiter');
      });
    }
  }, []);
  return (
    <div className="relative w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      {/* Main Content */}
      <div className="w-full h-full overflow-y-auto overflow-x-hidden">
          {children}
      </div>
      <InstallPwaPopup />
    </div>
  );
}
