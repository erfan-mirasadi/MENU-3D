"use client";
import { usePathname } from "next/navigation";
import AdminMobileNav from "./_components/layouts/AdminMobileNav";
import AdminSidebar from "./_components/layouts/AdminSidebar";
import { NAV_LINKS } from "./_components/layouts/navLinks";

export default function AdminLayoutClient({ children, user, restaurant }) {
  const pathname = usePathname();

  const isFullScreen =
    pathname.includes("/login") || pathname.includes("/onboarding");

  if (isFullScreen) {
    return (
      <main className="w-full h-[100dvh] bg-dark-900 flex items-center justify-center overflow-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="flex w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      <AdminSidebar user={user} restaurant={restaurant} links={NAV_LINKS} />

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      <AdminMobileNav user={user} restaurant={restaurant} links={NAV_LINKS} />
    </div>
  );
}
