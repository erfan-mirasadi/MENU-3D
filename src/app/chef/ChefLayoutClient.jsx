"use client";
import { useEffect } from "react";
import { subscribeToPushNotifications } from "@/services/notificationService";
import InstallPwaPopup from "@/components/ui/InstallPwaPopup";

export default function ChefLayoutClient({ children }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => {
        subscribeToPushNotifications("chef");
      });
    }
  }, []);
  return (
    <div className="relative w-full h-dvh bg-dark-900 text-text-light font-sans overflow-hidden">
      <div className="w-full h-full">{children}</div>
      <InstallPwaPopup />
    </div>
  );
}