"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { RiLogoutBoxRLine, RiStore2Line } from "react-icons/ri";

export default function AdminSidebar({ links }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = links || [];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <aside className="hidden md:flex w-28 h-full bg-dark-900 flex-col items-center py-6 z-50 border-r border-dark-800">
      <div className="mb-10">
        <div className="flex items-center justify-center pointer-events-none select-none">
          <Image 
            src="/logo-web.png" 
            alt="logo" 
            width={0} 
            height={0} 
            sizes="100vw"
            className="object-contain drop-shadow-[0_0_8px_rgba(234,124,105,0.7)]" 
            style={{ width: '60px', height: 'auto' }}
            priority
          />
        </div>
      </div>

      {/* 2. Navigation Items */}
      <nav className="flex-1 flex flex-col gap-6 w-full px-4 items-center">
        {navItems.map((link) => {
          const isActive = pathname === link.path;
          const Icon = link.icon;

          return (
            <Link
              key={link.path}
              href={link.path}
              className={`
                group relative flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-accent/40 translate-x-2" // Active Style
                    : "text-accent hover:bg-dark-800 hover:text-white" // Normal Style
                }
              `}
            >
              <Icon
                size={22}
                className={`transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              />

              {/* Tooltip */}
              <span className="absolute left-16 bg-dark-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Logout Button (Bottom) */}
      <button
        onClick={handleLogout}
        className="mt-auto mb-4 text-accent hover:text-white hover:bg-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
      >
        <RiLogoutBoxRLine size={24} />
      </button>
    </aside>
  );
}
