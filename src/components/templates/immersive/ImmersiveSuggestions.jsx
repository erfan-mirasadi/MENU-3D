"use client";

import { useState, useEffect } from "react";
import SmartMedia from "@/components/ui/SmartMedia";
import { useLanguage } from "@/context/LanguageContext";

export default function ImmersiveSuggestions({ products }) {
  const { content, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth entry
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full h-full overflow-y-auto px-6 pb-10 pt-2 no-scrollbar">
      <div className="flex items-center gap-2 mb-4 opacity-90">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-white text-sm font-bold uppercase tracking-widest">
          Hot Deals
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="relative w-full aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/10 bg-gray-900 shadow-2xl transition-all duration-700"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: `${index * 100}ms`,
            }}
          >
            {/* Offer Badge */}
            <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-wider">
              SPECIAL OFFER
            </div>

            {/* Smart Media (Background) */}
            <div className="absolute inset-0 z-0">
              <SmartMedia
                files={{
                  image_url: product.image_url,
                  animation_url_ios: product.animation_url_ios,
                  animation_url_android: product.animation_url_android,
                }}
                alt={content(product.title)}
                className="w-full h-full object-cover opacity-90"
              />
              {/* Dark Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* Content Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-5 z-20">
              <div className="flex justify-between items-end">
                <div className="w-2/3">
                  <h3 className="text-xl font-black text-white leading-tight mb-1 drop-shadow-md">
                    {content(product.title)}
                  </h3>
                  <p className="text-gray-300 text-xs line-clamp-1 font-light">
                    {content(product.description)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-gray-400 text-xs line-through decoration-red-500 font-bold">
                    {(product.price * 1.2).toFixed(0)} ₺
                  </span>
                  <span className="block text-2xl font-black text-white drop-shadow-md">
                    {Number(product.price).toLocaleString()} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Spacer */}
        <div className="h-10"></div>
      </div>
    </div>
  );
}
