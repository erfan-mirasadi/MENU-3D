"use client";
import AdminMobileNav from "@/app/admin/_components/layouts/AdminMobileNav";
import AdminSidebar from "@/app/admin/_components/layouts/AdminSidebar";
import { WAITER_LINKS } from "./_components/waiterNavLinks";

export default function WaiterLayoutClient({ children }) {
  return (
    <div className="flex w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      {/* Sidebar with Waiter Links */}
      <AdminSidebar
        links={WAITER_LINKS}
        user={{ email: "Waiter" }}
        isWaiter={true}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Nav with Waiter Links */}
      <AdminMobileNav links={WAITER_LINKS} />
    </div>
  );
}
