"use client";
import SmartMedia from "@/components/ui/SmartMedia";
import { useLanguage } from "@/context/LanguageContext";

export default function ImmersiveCard({ product, onClick, onAdd }) {
  const { content, t } = useLanguage();
  const has3D = !!(product.model_url || product.model_lowpoly_url);

  return (
    <div onClick={onClick} className="group relative pt-14 cursor-pointer">
      {/* Glass Card Base */}
      <div className="relative bg-[#1a1a1a]/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-5 pb-5 transition-all duration-300 active:scale-[0.98]">
        {/* --- FLOATING IMAGE --- */}
        {/* Increased 'top' offset to make sure it doesn't overlap text */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[85%] aspect-square z-20">
          {/* Glow */}
          <div className="absolute inset-4 bg-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            <SmartMedia
              files={{
                image_url: product.image_url,
                animation_url_ios: product.animation_url_ios,
                animation_url_android: product.animation_url_android,
              }}
              alt={content(product.title)}
              className="w-full h-full object-contain transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105"
            />
          </div>

          {/* BIGGER & OBVIOUS 3D BADGE */}
          {has3D && (
            <div className="absolute -right-2 top-10 bg-white/10 backdrop-blur-md border border-white/30 rounded-full py-1.5 px-3 flex items-center gap-2 shadow-lg animate-pulse">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs font-bold text-white tracking-wider">
                3D
              </span>
            </div>
          )}
        </div>

        {/* --- CONTENT --- */}
        {/* Added Margin Top so title doesn't stick to image */}
        <div className="mt-[60%] flex flex-col items-center text-center">
          {/* Title */}
          <h3 className="text-xl font-black text-white mb-2 leading-tight px-2">
            {content(product.title)}
          </h3>

          {/* Description */}
          <p className="text-white/50 text-[11px] line-clamp-2 mb-5 h-8 font-medium leading-relaxed px-2">
            {content(product.description)}
          </p>

          {/* Price & Add Bar */}
          <div className="w-full flex items-center justify-between bg-black/40 rounded-2xl p-1.5 pr-5 border border-white/5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="bg-white text-black w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl hover:scale-105 active:scale-90 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              +
            </button>

            <div className="flex items-baseline gap-1">
              {/* HUGE PRICE */}
              <span className="text-3xl font-black text-white drop-shadow-md">
                {Number(product.price).toLocaleString()}
              </span>
              <span className="text-sm text-white/50 font-bold">₺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
