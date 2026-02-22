"use client";
import { useState } from "react";
import ClassicLanding from "./ClassicLanding";
import ClassicMenu from "./ClassicMenu";

export default function ClassicLayout({
  restaurant,
  categories,
  tableId,
  featuredProducts,
  isGuestMode,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <main className="w-full min-h-screen bg-[#FDFBF7] text-[#2C1810] overflow-hidden font-serif selection:bg-[#D4AF37] selection:text-white">
      {/* Landing Layer */}
      <div
        className={`absolute inset-0 z-50 transition-opacity duration-1000 ease-in-out ${
          showMenu ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <ClassicLanding
          restaurant={restaurant}
          tableId={tableId}
          onEnter={() => setShowMenu(true)}
        />
      </div>

      {/* Menu Layer */}
      <div
        className={`absolute inset-0 z-40 transition-transform duration-1000 ease-in-out ${
          showMenu ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <ClassicMenu
          restaurant={restaurant}
          categories={categories}
          tableId={tableId}
          isGuestMode={isGuestMode}
        />
      </div>
    </main>
  );
}
