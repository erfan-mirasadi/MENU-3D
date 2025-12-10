"use client";

import { useState, useEffect } from "react";
import Suggestions from "./Suggestions";

export default function LandingInterface({
  restaurant,
  tableId,
  onEnter,
  featuredProducts,
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!restaurant) return null;

  return (
    <div className="relative h-[100dvh] w-full bg-[#1F1D2B] overflow-hidden font-sans selection:bg-[#ea7c69] selection:text-white flex flex-col">
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {restaurant.bg_image ? (
          <>
            <img
              src={restaurant.bg_image}
              alt="Ambience"
              className={`w-full h-full object-cover transition-transform duration-[3s] ease-out ${
                isLoaded ? "scale-105" : "scale-100"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D2B] via-[#1F1D2B]/90 to-black/30" />
          </>
        ) : (
          <div className="w-full h-full bg-[#1F1D2B]" />
        )}
      </div>

      {/* 1. TOP SECTION (Fixed Height) */}
      <div
        className={`relative z-10 shrink-0 flex flex-col items-center justify-center px-6 pt-12 pb-4 transition-all duration-1000 delay-300 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* LOGO */}
        <div className="relative mb-4 group">
          <div className="absolute -inset-4 bg-[#ea7c69]/20 rounded-full blur-xl animate-pulse"></div>
          {restaurant.logo ? (
            <div className="relative w-24 h-24 rounded-[2rem] border border-white/10 p-1 bg-[#252836]/50 backdrop-blur-xl shadow-2xl">
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-full h-full object-cover rounded-[1.8rem]"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-[2rem] bg-[#252836] border border-white/10 flex items-center justify-center text-4xl font-bold text-[#ea7c69] shadow-2xl">
              {restaurant.name?.charAt(0)}
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white text-center tracking-tight leading-tight drop-shadow-lg mb-1">
          {restaurant.name}
        </h1>

        {tableId && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-3 py-1 rounded-full mt-2">
            <p className="text-gray-400 text-[9px] font-mono uppercase tracking-[0.2em]">
              Table{" "}
              <span className="text-[#ea7c69] font-bold text-[10px]">
                {tableId}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* 2. MIDDLE SECTION (SCROLLABLE AREA) */}
      {/* نکته: اینجا flex-1 میدیم که بقیه فضا رو بگیره و overflow-hidden رو برمیداریم */}
      <div className="relative z-10 flex-1 w-full min-h-0">
        <Suggestions products={featuredProducts} />
      </div>

      {/* 3. FIXED BOTTOM BUTTON */}
      <div
        className={`relative z-20 shrink-0 w-full p-6 pb-8 bg-gradient-to-t from-[#1F1D2B] via-[#1F1D2B] to-transparent transition-all duration-1000 delay-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <button
          onClick={onEnter}
          className="group w-full bg-[#ea7c69] hover:bg-[#ff8f7d] text-white h-16 rounded-2xl shadow-[0_20px_40px_-10px_rgba(234,124,105,0.4)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
          <span className="text-lg font-bold tracking-wide relative z-10">
            Enter Menu
          </span>
        </button>
        <div className="mt-4 text-center">
          <p className="text-[9px] text-gray-600 font-mono">
            Powered by <span className="text-gray-500 font-bold">ERFAN</span>
          </p>
        </div>
      </div>
    </div>
  );
}
