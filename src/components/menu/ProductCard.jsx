"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function ProductCard({ product, onClick, onAdd }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // --- VARIABLES ---
  // فرض بر اینه که لینک ویدیو یا WebP رو توی این فیلد ذخیره کردی
  const videoUrl = product.model_lowpoly_url;
  const hasVideo = !!videoUrl;
  const isPromo = !!product.original_price;

  // --- 1. LAZY LOAD OBSERVER ---
  // ویدیو فقط وقتی لود میشه که کاربر اسکرول کنه برسه بهش
  useEffect(() => {
    if (!hasVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once loaded
        }
      },
      { rootMargin: "100px" } // ۱۰۰ پیکسل قبل از رسیدن، لود رو شروع کن که پرش نداشته باشه
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [hasVideo]);

  // --- HELPER ---
  const getTitle = (obj) => {
    if (!obj) return "";
    return typeof obj === "object" ? obj["tr"] || obj["en"] : obj;
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="group relative w-full max-w-[320px] mx-auto mt-24 mb-6 select-none cursor-pointer"
    >
      {/* GLOW EFFECT (Only if video exists) */}
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
            {/* Logic: اگر ویدیو داشت و اسکرول رسید -> ویدیو پخش شه. در غیر این صورت -> عکس ثابت */}
            {hasVideo && isVisible ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted // حتما باید باشه وگرنه اتوپلی نمیشه
                playsInline // برای iOS حیاتیه
                className="w-full h-full object-contain animate-in fade-in duration-700"
                // poster رو حذف کردم چون گفتی نمیخوای
              />
            ) : (
              <Image
                src={product.image_url}
                alt={getTitle(product.title)}
                fill
                sizes="176px"
                className="object-contain transform group-hover:scale-105 transition-transform duration-500"
                priority={false}
              />
            )}
          </div>
        </div>

        {/* --- INFO SECTION --- */}
        <div className="flex flex-col items-center text-center mt-2">
          <h3 className="text-white text-xl font-bold leading-tight w-full line-clamp-2 h-[3.5rem] flex items-center justify-center">
            {getTitle(product.title)}
          </h3>

          <div className="w-10 h-1 bg-[#ea7c69] rounded-full my-3 opacity-80"></div>

          <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2 h-[2.5rem] w-full px-2 overflow-hidden">
            {getTitle(product.description)}
          </p>

          {/* FOOTER: Price & Add Button */}
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
                <span className="text-[#ea7c69] text-xs font-bold">₺</span>
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
