"use client";

import { useState, useEffect } from "react";

export default function LandingInterface({ restaurant, tableId, onEnter }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!restaurant) return null;

  return (
    <div className="relative min-h-screen w-full bg-[#1F1D2B] overflow-hidden flex flex-col items-center justify-between font-sans selection:bg-[#ea7c69] selection:text-white">
      {/* -- BACKGROUND LAYER --- */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D2B] via-[#1F1D2B]/80 to-black/40" />
          </>
        ) : (
          <div className="w-full h-full bg-[#1F1D2B]" />
        )}
      </div>

      <div
        className={`relative z-10 flex flex-col items-center justify-center flex-1 w-full px-6 transition-all duration-1000 delay-300 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 bg-[#ea7c69]/20 rounded-full blur-xl animate-pulse group-hover:bg-[#ea7c69]/30 transition-all"></div>

          {restaurant.logo ? (
            <div className="relative w-32 h-32 rounded-[2rem] border border-white/10 p-1 bg-[#252836]/50 backdrop-blur-xl shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-full h-full object-cover rounded-[1.8rem]"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-[2rem] bg-[#252836] border border-white/10 flex items-center justify-center text-5xl font-bold text-[#ea7c69] shadow-2xl">
              {restaurant.name?.charAt(0)}
            </div>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white text-center tracking-tight leading-tight drop-shadow-lg mb-2">
          {restaurant.name}
        </h1>
        <p className="text-gray-300 text-sm md:text-base font-light tracking-widest uppercase opacity-80 mb-8">
          Welcome
        </p>
        {tableId && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-12">
            <p className="text-gray-400 text-[10px] font-mono uppercase tracking-[0.2em]">
              Table{" "}
              <span className="text-[#ea7c69] font-bold text-xs">
                {tableId}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION (Button) */}
      <div
        className={`relative z-10 w-full p-6 pb-12 transition-all duration-1000 delay-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <button
          onClick={onEnter}
          className="group w-full bg-[#ea7c69] hover:bg-[#ff8f7d] text-white h-16 rounded-2xl shadow-[0_20px_40px_-10px_rgba(234,124,105,0.4)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-white/20 relative overflow-hidden"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>

          <span className="text-lg font-bold tracking-wide relative z-10">
            Enter Menu
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            Powered by <span className="text-gray-500 font-bold">ERFAN</span>
          </p>
        </div>
      </div>
    </div>
  );
}
