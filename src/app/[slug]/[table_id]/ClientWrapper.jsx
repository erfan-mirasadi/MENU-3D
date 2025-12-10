"use client";
import { useState } from "react";
import MenuInterface from "@/components/menu/MenuInterface";
import LandingInterface from "@/components/ui/LandingInterface";

export default function ClientWrapper({
  restaurant,
  categories,
  tableId,
  featuredProducts,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <main className="w-full min-h-screen bg-[#1F1D2B] overflow-hidden">
      <div
        className={`absolute inset-0 z-50 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          showMenu ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <LandingInterface
          restaurant={restaurant}
          tableId={tableId}
          onEnter={() => setShowMenu(true)}
          featuredProducts={featuredProducts}
        />
      </div>

      <div className="absolute inset-0 z-40 h-full w-full">
        {/* for best experience, use in landscape mode */}
        <div className="h-full overflow-y-auto bg-[#1F1D2B]">
          <MenuInterface
            restaurant={restaurant}
            categories={categories}
            tableId={tableId}
          />
        </div>
      </div>
    </main>
  );
}
