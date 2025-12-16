"use client";

import { useState } from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";

export default function MenuInterface({ restaurant, categories, tableId }) {
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const getTitle = (obj) => {
    if (!obj) return "";
    return typeof obj === "object"
      ? obj["en"] || obj["tr"] || Object.values(obj)[0]
      : obj;
  };

  return (
    <div className="min-h-screen bg-[#1F1D2B] font-sans pb-24 text-gray-100 selection:bg-[#ea7c69] selection:text-white overflow-x-hidden">
      {/* --- HEADER --- */}
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

        <div className="relative z-10 p-6 pb-0">
          <div className="flex justify-between items-start mb-6">
            {/* LOGO & INFO */}
            <div className="flex items-center gap-3">
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
                  Masa: {tableId}
                </p>
              </div>
            </div>

            {/* STATUS BADGE */}
            <div className="bg-[#252836]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                  Open
                </span>
              </div>
            </div>
          </div>

          {/* --- CATEGORIES PILLS --- */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 min-h-[70px]">
            {categories?.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative h-[50px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] flex-shrink-0 group ${
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
                        sizes="160px"
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
                      <div className="relative w-6 h-6">
                        <Image
                          src={cat.image_url}
                          alt=""
                          fill
                          sizes="24px"
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
                      {getTitle(cat.title)}
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

      {/* --- MAIN GRID --- */}
      <div className="p-4 pt-2 min-h-[60vh]">
        {categories?.map((cat) => (
          <div
            key={cat.id}
            className={`${
              activeCategory === cat.id ? "block" : "hidden"
            } animate-in fade-in zoom-in-95 duration-500`}
          >
            <div className="flex items-center gap-4 mb-6 opacity-50">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                Menu
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {cat.products?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- CART BAR --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-30">
        <button className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] text-white py-4 rounded-3xl shadow-[0_20px_40px_-10px_rgba(234,124,105,0.5)] flex items-center justify-between px-6 active:scale-95 transition-all border border-white/20 backdrop-blur-xl">
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
              Total
            </span>
            <span className="text-lg font-black">0 ₺</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">View Cart</span>
            <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">
              0
            </div>
          </div>
        </button>
      </div>

      {/* --- MODAL (AR READY - FINAL SIMPLIFIED) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProduct(null)}
          ></div>
          <div className="bg-[#252836] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] relative z-10 border-t border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="h-80 relative group bg-[#1a1c25] w-full">
              {selectedProduct.model_url ? (
                <div className="w-full h-full">
                  {/* === MODEL VIEWER (CLEAN VERSION) === */}
                  <model-viewer
                    // 1. Source
                    src={
                      selectedProduct.model_url ||
                      selectedProduct.model_lowpoly_url
                    }
                    // 2. Poster (ساده‌ترین حالت - اگر عکس بود نشون بده)
                    poster={selectedProduct.image_url}
                    alt={getTitle(selectedProduct.title)}
                    // 3. AR Settings
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    ar-scale="auto"
                    ar-placement="floor"
                    // 4. Configs
                    loading="eager"
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    style={{ width: "100%", height: "100%", outline: "none" }}
                  >
                    {/* AR BUTTON */}
                    <button
                      slot="ar-button"
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#ea7c69] text-white h-12 px-8 rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95 transition-all z-50 cursor-pointer border border-white/20"
                    >
                      <span className="text-xl">📦</span>
                      <span className="whitespace-nowrap text-sm font-bold tracking-wide">
                        Show on Table
                      </span>
                    </button>
                  </model-viewer>
                </div>
              ) : (
                <Image
                  src={selectedProduct.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                />
              )}
              {/* Gradient & Close Button */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#252836] via-transparent to-transparent pointer-events-none"></div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 bg-black/40 text-white w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center hover:bg-[#ea7c69] transition-colors border border-white/10 z-50 shadow-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-8 -mt-12 relative pointer-events-none">
              {/* Content Panel */}
              <div className="pointer-events-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white text-3xl font-black leading-tight w-3/4">
                    {getTitle(selectedProduct.title)}
                  </h3>
                  <div className="bg-[#ea7c69] px-3 py-1.5 rounded-xl shadow-lg shadow-orange-900/30">
                    <p className="text-white font-bold text-lg">
                      {Number(selectedProduct.price).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-10 leading-relaxed font-light">
                  {getTitle(selectedProduct.description)}
                </p>
                <button className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-orange-900/40 active:scale-95 transition-transform flex items-center justify-center gap-3">
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
