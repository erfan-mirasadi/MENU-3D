"use client";
import { useState } from "react";
import ModernMenu from "./ModernMenu";
import ModernLanding from "./ModernLanding";

export default function ModernLayout({
  restaurant,
  categories,
  tableId,
  featuredProducts,
  isGuestMode,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <main className="w-full min-h-screen bg-[#1F1D2B] overflow-hidden">
      <div
        className={`absolute inset-0 z-50 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          showMenu ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <ModernLanding
          restaurant={restaurant}
          tableId={tableId}
          onEnter={() => setShowMenu(true)}
          featuredProducts={featuredProducts}
        />
      </div>

      <div className="absolute inset-0 z-40 h-full w-full">
        <div className="h-full overflow-y-auto bg-[#1F1D2B]">
          <ModernMenu
            restaurant={restaurant}
            categories={categories}
            tableId={tableId}
            isGuestMode={isGuestMode}
          />
        </div>
      </div>
    </main>
  );
}
