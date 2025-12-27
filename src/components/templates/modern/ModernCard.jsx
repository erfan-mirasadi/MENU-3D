"use client";

import { useState, useRef, useEffect } from "react";
import SmartMedia from "@/components/ui/SmartMedia";
import { useLanguage } from "@/context/LanguageContext";

export default function ModernCard({ product, onClick, onAdd }) {
  const { content, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  const iosUrl = product.animation_url_ios;
  const androidUrl = product.animation_url_android;
  const hasVideo = !!(iosUrl || androidUrl);
  const isPromo = !!product.original_price;

  // همون IntersectionObserver قبلی برای تریگر کردن
  useEffect(() => {
    if (!hasVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [hasVideo]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="group relative w-full max-w-[320px] mx-auto mt-24 mb-6 select-none cursor-pointer"
    >
      {/* GLOW EFFECT - فقط اگه ویدیو باشه */}
      {hasVideo && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#ea7c69] opacity-20 blur-[60px] rounded-full pointer-events-none" />
      )}

      {/* CARD BASE */}
      <div className="relative bg-[#252836] rounded-t-[40px] rounded-b-[24px] pt-20 pb-5 px-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] border-t border-white/10 active:scale-[0.98] transition-transform duration-200">
        {/* --- VISUAL SECTION --- */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-44 h-44 z-20">
          {/* 360 BADGE */}
          {hasVideo && (
            <div className="absolute bottom-2 right-0 z-30 animate-pulse">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="flex items-center gap-1 bg-[#1F1D2B]/80 backdrop-blur border border-[#ea7c69]/30 pl-2 pr-3 py-1 rounded-full shadow-lg"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#ea7c69] animate-ping" />
                <span className="text-[9px] font-black text-white uppercase tracking-wider ml-1">
                  View
                </span>
              </button>
            </div>
          )}

          <div className="relative w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]">
            {/* استفاده از SmartMedia برای نمایش */}
            <SmartMedia
              files={{
                image_url: product.image_url,
                animation_url_ios: product.animation_url_ios,
                animation_url_android: product.animation_url_android,
              }}
              alt={content(product.title)}
              // خود SmartMedia لاجیک نمایش رو داره، ولی ما isVisible رو پاس میدیم تا با اسکرول سینک باشه
              isVisible={isVisible}
              className="transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* --- INFO SECTION --- */}
        <div className="flex flex-col items-center text-center mt-2">
          <h3 className="text-white text-xl font-bold leading-tight w-full line-clamp-2 h-[3.5rem] flex items-center justify-center">
            {content(product.title)}
          </h3>

          <div className="w-10 h-1 bg-[#ea7c69] rounded-full my-3 opacity-80"></div>

          <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2 h-[2.5rem] w-full px-2 overflow-hidden">
            {content(product.description)}
          </p>

          {/* FOOTER */}
          <div className="w-full mt-5 bg-[#1F1D2B] rounded-2xl p-3 flex items-center justify-between border border-white/5">
            <div className="flex flex-col items-start pl-1">
              {isPromo && (
                <span className="text-[10px] text-gray-500 line-through decoration-red-500/50 mb-[-2px]">
                  {Number(product.original_price).toLocaleString()}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-white text-2xl font-black tracking-tight">
                  {Number(product.price).toLocaleString()}
                </span>
                <span className="text-[#ea7c69] text-xs font-bold">
                  {t("currency")}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="relative overflow-hidden bg-[#ea7c69] text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 z-10"
              >
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
