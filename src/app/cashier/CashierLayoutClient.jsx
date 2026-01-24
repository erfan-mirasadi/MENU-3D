"use client";
import AdminMobileNav from "@/app/admin/_components/layouts/AdminMobileNav";
import AdminSidebar from "@/app/admin/_components/layouts/AdminSidebar";
import { CASHIER_LINKS } from "./_components/cashierNavLinks";

import { usePathname } from 'next/navigation';

import NotificationManager from "@/components/shared/NotificationManager";

export default function CashierLayoutClient({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard');

  return (
    <div className="flex w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      <NotificationManager role="cashier" />
      {/* Sidebar with Waiter Links */}
      <AdminSidebar
        links={CASHIER_LINKS}
        user={{ email: "Cashier" }}
        isCashier={true}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isDashboard ? 'p-0' : 'p-4 md:p-8 pb-24 md:pb-8'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Nav with Waiter Links */}
      <AdminMobileNav links={CASHIER_LINKS} />
    </div>
  );
}
