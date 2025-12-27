"use client";
import SmartMedia from "@/components/ui/SmartMedia";
import { useLanguage } from "@/context/LanguageContext";

export default function MinimalCard({ product, onClick, onAdd }) {
  const { content, t } = useLanguage();
  const has3D = !!(product.model_url || product.model_lowpoly_url);

  return (
    <div
      onClick={onClick}
      className="group flex flex-col h-full w-full cursor-pointer"
    >
      {/* 1. Image Area */}
      <div className="relative w-full aspect-4/5 bg-gray-50 mb-3 overflow-hidden border border-transparent group-hover:border-black transition-all duration-300 rounded-sm">
        <div className="w-full h-full p-6 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105">
          <SmartMedia
            files={{
              image_url: product.image_url,
              animation_url_ios: product.animation_url_ios,
              animation_url_android: product.animation_url_android,
            }}
            alt={content(product.title)}
            className="w-full h-full object-contain drop-shadow-lg scale-140"
          />
        </div>

        {/* 3D Indicator (Minimal Badge) */}
        {has3D && (
          <div className="absolute top-2 left-2 bg-white/80 backdrop-blur border border-black/10 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-wider text-black">
              3D
            </span>
          </div>
        )}

        {/* Quick Add Button (Bottom Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="absolute bottom-0 right-0 w-12 h-12 bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black border-l border-t border-black"
        >
          <span className="text-2xl font-light leading-none mb-1">+</span>
        </button>
      </div>

      {/* 2. Info Area */}
      <div className="flex flex-col flex-1 px-1">
        {/* ROW 1: Title & Price (Side by Side) */}
        <div className="flex justify-between items-start gap-4 mb-1">
          <h3 className="text-base font-black uppercase leading-tight text-black line-clamp-2">
            {content(product.title)}
          </h3>

          <div className="shrink-0 flex items-baseline gap-0.5">
            <span className="text-xl font-black text-black">
              {Number(product.price).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-black">₺</span>
          </div>
        </div>

        {/* ROW 2: Description */}
        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
          {content(product.description)}
        </p>

        {/* 'Add to Order' Text Button (Mobile friendly fallback) */}
        <div className="mt-3 md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-0.5"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
