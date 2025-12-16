"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function ProductCard({ product, onClick }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const getTitle = (obj) => {
    if (!obj) return "";
    return typeof obj === "object" ? obj["tr"] || obj["en"] : obj;
  };

  const has3D = product.model_url || product.model_lowpoly_url;
  const isPromo = !!product.original_price;

  return (
    <div
      onClick={onClick}
      // mb-12 baraye fasele az payin, mt-24 baraye fazaye bala ke ax nazane biroon az kadr kolli
      className="group relative w-full max-w-[320px] mx-auto mt-24 mb-6 select-none"
    >
      {/*CONDITIONAL GLOW */}
      {has3D && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#ea7c69] opacity-30 blur-[60px] rounded-full pointer-events-none animate-pulse" />
      )}

      {/* CARD BASE */}
      <div className="relative bg-[#252836] rounded-t-[40px] rounded-b-[24px] pt-20 pb-5 px-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] border-t border-white/10 active:scale-[0.98] transition-transform duration-200">
        {/* --- 3. FLOATING VISUAL  --- */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-44 h-44 z-20">
          {/* Indicator 3D (Floating Tag) */}
          {has3D && (
            <div className="absolute bottom-2 right-0 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="flex items-center gap-1 bg-[#1F1D2B]/90 backdrop-blur border border-[#ea7c69]/40 pl-2 pr-3 py-1.5 rounded-full shadow-lg transform translate-y-2 hover:-translate-y-1 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-[#ea7c69] animate-ping" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider ml-1">
                  360°
                </span>
              </button>
            </div>
          )}

          {/* Container Asli Model/Ax */}
          <div className="relative w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]">
            {product.model_lowpoly_url && isMounted ? (
              <div className="w-full h-full">
                <model-viewer
                  src={product.model_lowpoly_url}
                  poster={product.image_url}
                  alt={getTitle(product.title)}
                  auto-rotate
                  rotation-per-second="25deg"
                  camera-orbit="0deg 80deg 105%"
                  shadow-intensity="1"
                  shadow-softness="0.8"
                  disable-zoom
                  disable-pan
                  interaction-prompt="none"
                  loading="lazy"
                  style={{ width: "100%", height: "100%" }}
                />
                <div className="absolute inset-0 z-10 bg-transparent" />
              </div>
            ) : (
              <Image
                src={product.image_url}
                alt={getTitle(product.title)}
                fill
                sizes="176px"
                className="object-contain transform group-hover:scale-105 transition-transform duration-500"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center text-center mt-2">
          {/* TITLE: Height Fix Shode (h-[3.5rem]) ke 2 khat ja beshe */}
          <h3 className="text-white text-xl font-bold leading-tight w-full line-clamp-2 h-[3.5rem] flex items-center justify-center">
            {getTitle(product.title)}
          </h3>
          <div className="w-10 h-1 bg-[#ea7c69] rounded-full my-3 opacity-80"></div>
          <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2 h-[2.5rem] w-full px-2 overflow-hidden">
            {getTitle(product.description)}
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
                <span className="text-[#ea7c69] text-xs font-bold">₺</span>
              </div>
            </div>

            {/* Add Button (Creative Shape) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Add Logic
              }}
              className="relative overflow-hidden bg-[#ea7c69] text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              {/* Icon Plus */}
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
              {/* Shine effect roye dokme */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
