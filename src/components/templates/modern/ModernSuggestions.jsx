"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function ModernSuggestions({ products }) {
  const { content, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <div
      className="w-full h-full overflow-y-auto px-6 pb-20 pt-4"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div
        className="flex items-center justify-between mb-6 transition-all duration-700"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "1000ms",
        }}
      >
        <span className="text-white font-black text-xl italic tracking-tighter">
          🔥 HOT DEALS
        </span>
        <span className="text-[#ea7c69] text-xs font-mono animate-pulse">
          Scroll Down ↓
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group shrink-0 transition-all duration-1000"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(40px)",
              transitionDelay: `${1200 + index * 200}ms`,
            }}
          >
            <div className="absolute top-0 right-0 z-20">
              <div className="bg-[#ea7c69] text-white font-black text-sm px-4 py-2 rounded-bl-2xl shadow-lg flex flex-col items-center leading-none">
                <span>20%</span>
                <span className="text-[8px] opacity-80">OFF</span>
              </div>
            </div>
            <Image
              src={product.image_url}
              alt={content(product.title)}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              priority={index === 0}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
            <div className="absolute bottom-0 left-0 w-full p-5">
              <h3 className="text-white text-2xl font-black leading-none drop-shadow-md mb-1">
                {content(product.title)}
              </h3>

              <p className="text-gray-300 text-xs line-clamp-1 font-light opacity-80 mb-3">
                {content(product.description)}
              </p>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs line-through decoration-red-500 decoration-2 font-bold opacity-70">
                    {(product.price * 1.25).toFixed(0)} ₺
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#ea7c69] text-3xl font-black drop-shadow-[0_0_10px_rgba(234,124,105,0.4)]">
                      {Number(product.price).toLocaleString()}
                    </span>
                    <span className="text-[#ea7c69] text-sm font-bold">₺</span>
                  </div>
                </div>

                <button className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-90 transition-transform">
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="h-20 w-full shrink-0"></div>
      </div>
    </div>
  );
}
