"use client";
import { useState } from "react";
import ImmersiveLanding from "./ImmersiveLanding";
import ImmersiveMenu from "./ImmersiveMenu";

export default function ImmersiveLayout({
  restaurant,
  categories,
  tableId,
  featuredProducts,
  isGuestMode,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <main className="relative w-full min-h-screen bg-[#0f0f0f] text-white font-sans overflow-hidden selection:bg-fuchsia-500 selection:text-white">
      {/* --- AMBIENT BACKGROUND ANIMATION --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Blob 1 */}
        <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-purple-600/30 rounded-full blur-[100px] animate-pulse mix-blend-screen"></div>
        {/* Blob 2 */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000 mix-blend-screen"></div>
        {/* Blob 3 */}
        <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-pink-600/20 rounded-full blur-[90px] animate-pulse delay-700 mix-blend-screen"></div>

        {/* Noise Overlay (Texture) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* Landing Layer */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-1000 ease-[cubic-bezier(0.7,0,0.3,1)] ${
          showMenu
            ? "opacity-0 translate-y-[-20%] pointer-events-none"
            : "opacity-100 translate-y-0"
        }`}
      >
        <ImmersiveLanding
          restaurant={restaurant}
          tableId={tableId}
          onEnter={() => setShowMenu(true)}
        />
      </div>

      {/* Menu Layer */}
      <div
        className={`relative z-10 min-h-screen transition-all duration-1000 ease-[cubic-bezier(0.7,0,0.3,1)] ${
          showMenu
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <ImmersiveMenu
          restaurant={restaurant}
          categories={categories}
          tableId={tableId}
          isGuestMode={isGuestMode}
        />
      </div>
    </main>
  );
}
