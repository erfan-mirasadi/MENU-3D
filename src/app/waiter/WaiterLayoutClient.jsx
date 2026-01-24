"use client";
import NotificationManager from "@/components/shared/NotificationManager";

export default function WaiterLayoutClient({ children }) {


  return (
    <div className="relative w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      <NotificationManager role="waiter" />
      {/* Main Content */}
      <div className="w-full h-full overflow-y-auto overflow-x-hidden">
          {children}
      </div>
    </div>
  );
}
