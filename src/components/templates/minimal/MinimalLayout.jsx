"use client";
import { useState } from "react";
import MinimalLanding from "./MinimalLanding";
import MinimalMenu from "./MinimalMenu";

export default function MinimalLayout({
  restaurant,
  categories,
  tableId,
  featuredProducts,
  isGuestMode,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <main className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Landing Layer */}
      <div
        className={`fixed inset-0 z-50 transition-transform duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] ${
          showMenu ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <MinimalLanding
          restaurant={restaurant}
          tableId={tableId}
          onEnter={() => setShowMenu(true)}
        />
      </div>

      {/* Menu Layer */}
      <div className="relative z-0 min-h-screen">
        <MinimalMenu
          restaurant={restaurant}
          categories={categories}
          tableId={tableId}
          isGuestMode={isGuestMode}
        />
      </div>
    </main>
  );
}
