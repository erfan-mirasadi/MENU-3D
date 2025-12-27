"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function ModernHeader({
  restaurant,
  tableId,
  categories,
  activeCategory,
  setActiveCategory,
}) {
  const { content, t } = useLanguage();
  return (
    <div className="sticky top-0 z-20 border-b border-white/5 shadow-2xl transition-all bg-[#1F1D2B]">
      {/* Background Overlay */}
      {restaurant.bg_image ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={restaurant.bg_image}
            alt="header-bg"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#1F1D2B]/95 to-[#1F1D2B]" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[#1F1D2B]/95 backdrop-blur-md" />
      )}

      <div className="relative z-10 pt-4.5 pb-0">
        {/* Language Switcher */}
        <div className="absolute top-5 right-4">
          <LanguageSwitcher />
        </div>

        <div className="flex justify-between items-start mb-1.5">
          {/* LOGO & INFO */}
          <div className="flex items-center gap-4 px-3.5">
            {restaurant.logo ? (
              <div className="relative w-12 h-12 rounded-2xl border border-white/10 p-0.5 bg-[#252836] shadow-lg">
                <Image
                  src={restaurant.logo}
                  alt="logo"
                  fill
                  priority
                  sizes="48px"
                  className="object-cover rounded-xl"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#252836] border border-white/10 flex items-center justify-center text-lg font-bold text-[#ea7c69]">
                {restaurant.name.charAt(0)}
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-md leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-gray-400 text-[10px] mt-0.5 font-mono uppercase tracking-widest opacity-80">
                {t("table")}: {tableId}
              </p>
            </div>
          </div>

          {/* STATUS BADGE */}
          {/* <div className="bg-[#252836]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                {t("open")}
              </span>
            </div>
          </div> */}
        </div>

        {/* CATEGORIES PILLS */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 pt-5 px-7 min-h-[70px] ">
          {categories?.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative h-[50px] rounded-full flex items-center justify-center overflow-hidden transition-all scale-120 duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] flex-shrink-0 group ${
                  isActive
                    ? "w-[160px] shadow-[0_0_20px_-5px_#ea7c69]"
                    : "w-[50px] bg-[#252836] border border-white/10 hover:bg-[#2d303e]"
                }`}
              >
                {isActive && cat.image_url && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={cat.image_url}
                      fill
                      sizes="160spx"
                      className="object-cover brightness-50"
                      alt="bg"
                    />
                    <div className="absolute inset-0 bg-[#ea7c69]/40 mix-blend-overlay"></div>
                  </div>
                )}
                <div
                  className={`absolute z-10 transition-all duration-300 ${
                    isActive ? "opacity-0 scale-50" : "opacity-100 scale-100"
                  }`}
                >
                  {cat.image_url ? (
                    <div className="relative w-16 h-16">
                      <Image
                        src={cat.image_url}
                        alt=""
                        fill
                        sizes="35px"
                        className="object-contain grayscale opacity-70 group-hover:grayscale-0"
                      />
                    </div>
                  ) : (
                    <span className="text-lg">🍔</span>
                  )}
                </div>
                <div
                  className={`absolute z-10 flex items-center gap-2 px-4 transition-all duration-500 delay-100 ${
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  <span className="text-sm font-bold text-white drop-shadow-md whitespace-nowrap">
                    {content(cat.title)}
                  </span>
                  <span className="bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                    {cat.products?.length}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full z-20"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
