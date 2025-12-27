"use client";

import { useState, useEffect } from "react";
import { Loader } from "@react-three/drei";
import Image from "next/image";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const styles = `
  @keyframes blurFadeIn {
    0% { opacity: 0; filter: blur(10px); transform: translateY(10px); }
    100% { opacity: 1; filter: blur(0); transform: translateY(0); }
  }
  .animate-text-change {
    animation: blurFadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  @keyframes swipeHint {
    0% { transform: translateX(20px); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(-20px); opacity: 0; }
  }
  .animate-swipe {
    animation: swipeHint 2s infinite;
  }
`;

// --- کامپوننت راهنمای Swipe ---
function SwipeHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute bottom-32 left-0 w-full flex justify-center items-center pointer-events-none z-40 transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10">
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-swipe"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-swipe delay-75 ml-1"></div>
          <div className="w-2 h-2 bg-white/20 rounded-full animate-swipe delay-150 ml-1"></div>
        </div>
        <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold">
          Swipe
        </span>
      </div>
    </div>
  );
}

export default function UIOverlay({
  restaurant,
  categories,
  activeCatId,
  setActiveCatId,
  focusedProduct,
  categoryMounted,
}) {
  const { content } = useLanguage();

  return (
    <>
      <style>{styles}</style>
      <Loader />
      <SwipeHint />

      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 w-full z-10 p-6 pt-10 text-center pointer-events-none">
        {/* Language Switcher */}
        <div className="absolute top-3 right-3 pointer-events-auto">
          <LanguageSwitcher />
        </div>

        <h3 className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase mb-2">
          {content(restaurant.name)}
        </h3>

        {focusedProduct && categoryMounted && (
          <div key={focusedProduct.id} className="flex flex-col items-center">
            <div className="overflow-hidden">
              <h1 className="text-white text-5xl font-black uppercase tracking-tighter drop-shadow-2xl animate-text-change">
                {content(focusedProduct.title)}
              </h1>
            </div>

            <div
              className="flex items-baseline gap-1 mt-2 animate-text-change"
              style={{ animationDelay: "0.1s" }}
            >
              <p className="text-[#ea7c69] text-4xl font-bold font-mono">
                {Number(focusedProduct.price).toLocaleString()}
              </p>
              <span className="text-[#ea7c69] text-lg">₺</span>
            </div>

            <p
              className="text-white/60 text-xs mt-4 max-w-[280px] leading-relaxed animate-text-change"
              style={{ animationDelay: "0.2s" }}
            >
              {content(focusedProduct.description) ||
                "Premium quality ingredients."}
            </p>
          </div>
        )}
      </div>

      {/* --- BOTTOM CATEGORY NAV --- */}
      <div className="absolute bottom-0 left-0 w-full z-50 pb-6">
        <div className="w-full overflow-x-auto no-scrollbar pl-4 pr-4">
          <div className="flex gap-6 justify-center min-w-max pt-4 px-4">
            {categories.map((cat) => {
              const isActive = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatId(cat.id)}
                  className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
                    isActive
                      ? "-translate-y-2 opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-all duration-500 backdrop-blur-sm bg-black/20 border border-white/10 ${
                      isActive
                        ? "shadow-[0_0_30px_rgba(234,124,105,0.4)] scale-110 ring-1 ring-[#ea7c69]"
                        : "grayscale"
                    }`}
                  >
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={content(cat.title)}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg text-white">●</span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
                      isActive ? "text-[#ea7c69]" : "text-white/50"
                    }`}
                  >
                    {content(cat.title)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
