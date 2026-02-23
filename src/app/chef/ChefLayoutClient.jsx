"use client";

import { useEffect } from "react";
import { subscribeToPushNotifications } from "@/services/notificationService";

export default function ChefLayoutClient({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        subscribeToPushNotifications('chef');
      });
    }
  }, []);
  return (
    <div className="relative w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      {/* Main Content */}
      <div className="w-full h-full">
          {children}
      </div>
    </div>
  );
}
