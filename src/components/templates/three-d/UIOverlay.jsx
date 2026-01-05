"use client";

import { useState, useEffect } from "react";
import { useProgress } from "@react-three/drei";
import Image from "next/image";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { MdViewInAr } from "react-icons/md";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import Loader from "@/components/ui/Loader";

import CartControls from "./CartControls";
import ModernCartDrawer from "../modern/ModernCartDrawer";

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
  /* --- انیمیشن جدید با دامنه حرکت بیشتر --- */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-18px); } 
  }
  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
`;

function SwipeHint() {
  const { t } = useLanguage();
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
  onLaunchAR,
  // Cart Props
  cartItems,
  addToCart,
  decreaseFromCart,
  removeFromCart,
  submitOrder,
  isLoadingCart,
  // Nav
  activeIndex,
  setActiveIndex,
  productCount,
}) {
  const { content, t } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { active } = useProgress();

  return (
    <>
      <style>{styles}</style>
      <Loader active={active} />
      <SwipeHint />

      {/* --- CONTROLS --- */}
      <CartControls
        focusedProduct={focusedProduct}
        cartItems={cartItems || []}
        onAdd={addToCart}
        onDecrease={decreaseFromCart}
        onRemove={removeFromCart}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* --- DRAWER --- */}
      <ModernCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems || []}
        onRemove={removeFromCart}
        onSubmit={submitOrder}
      />

      {/* --- LIQUID GLASS NAVIGATION ARROWS (CENTERED) --- */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((prev) => prev - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white active:scale-90 transition-all duration-300 group overflow-hidden"
          aria-label="Previous Item"
        >
          {/* Liquid Gloss Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-60 pointer-events-none rounded-full" />
          <IoChevronBack size={24} className="relative z-10 drop-shadow-md" />
        </button>
      )}

      {activeIndex < productCount - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((prev) => prev + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white active:scale-80 transition-all duration-300 group overflow-hidden"
          aria-label="Next Item"
        >
          {/* Liquid Gloss Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none rounded-full" />
          <IoChevronForward size={24} className="relative z-10 drop-shadow-md" />
        </button>
      )}

      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 w-full z-10 p-6 pt-6 text-center pointer-events-none">
        
        <div className="absolute top-3 right-3 pointer-events-auto">
          <LanguageSwitcher />
        </div>

        <h3 className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase mb-3">
          {content(restaurant.name)}
        </h3>

        {focusedProduct && categoryMounted && (
          <div key={focusedProduct.id} className="flex flex-col items-center">
            {/* Fixed Height Container for Title */}
            <div className="h-24 w-full flex items-center justify-center px-4 mb-1">
              {(() => {
                const titleText = content(focusedProduct.title);
                const words = titleText?.split(' ') || [];
                const isLong = titleText?.length > 22 || words.length >= 3;

                if (isLong && words.length >= 2) {
                  // Split into two lines for better visual balance
                  const mid = Math.ceil(words.length / 2);
                  const line1 = words.slice(0, mid).join(' ');
                  const line2 = words.slice(mid).join(' ');

                  return (
                    <div className="flex flex-col items-center justify-center leading-none animate-text-change">
                      <h1 className="text-white text-4xl font-black uppercase tracking-tighter drop-shadow-2xl">
                        {line1}
                      </h1>
                      <h1 className="text-white text-4xl font-black uppercase tracking-tighter drop-shadow-2xl opacity-90 mt-1">
                        {line2}
                      </h1>
                    </div>
                  );
                }
                
                // Short title (1-2 words, short length)
                return (
                  <h1 
                    className="text-white text-5xl font-black uppercase tracking-tighter drop-shadow-2xl animate-text-change leading-[1.1]"
                  >
                    {titleText}
                  </h1>
                );
              })()}
            </div>

            {/* Price Section */}
            <div
              className="flex flex-col items-center mt-2 animate-text-change"
              style={{ animationDelay: "0.1s" }}
            >
              {(() => {
                const price = Number(focusedProduct.price);
                const originalPrice = focusedProduct.original_price ? Number(focusedProduct.original_price) : null;
                const hasDiscount = originalPrice && originalPrice > price;
                
                if (hasDiscount) {
                  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
                  
                  return (
                    <>
                      {/* Discount Header */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white/40 text-lg font-bold line-through decoration-white/40 decoration-2">
                          {originalPrice.toLocaleString()}₺
                        </span>
                        <div className="bg-[#ea7c69] text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(234,124,105,0.6)]">
                          {discountPercent}% {t('off')}
                        </div>
                      </div>

                      {/* Main Price */}
                      <div className="flex items-baseline gap-1">
                         <p className="text-white text-6xl font-black font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(234,124,105,0.8)]">
                          {price.toLocaleString()}
                        </p>
                        <span className="text-[#ea7c69] text-2xl font-bold">₺</span>
                      </div>
                    </>
                  );
                }

                // Standard Price
                return (
                  <div className="flex items-baseline gap-1">
                     <p className="text-[#ea7c69] text-5xl font-bold font-mono">
                      {price.toLocaleString()}
                    </p>
                    <span className="text-[#ea7c69] text-lg">₺</span>
                  </div>
                );
              })()}
            </div>

            <p
              className="text-white/60 text-xs mt-2 max-w-[280px] leading-relaxed animate-text-change"
              style={{ animationDelay: "0.2s" }}
            >
              {content(focusedProduct.description) ||
                ""}
            </p>

            {/* AR Button: Liquid Glass Style */}
            <div 
              className="mt-4 animate-text-change" 
              style={{ animationDelay: "0.38s" }}
            >
              {focusedProduct?.model_url && (
                <button
                  onClick={() => onLaunchAR()}
                  className="pointer-events-auto relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-300 active:scale-95 group overflow-hidden"
                >
                  {/* Liquid Gloss Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none" />
                  
                  <MdViewInAr className="text-white text-lg relative z-10" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest relative z-10">
                    {t('showOnTable')}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM CATEGORY NAV --- */}
      {/* --- BOTTOM CATEGORY NAV (APPLE LIQUID GLASS) --- */}
      <div className="absolute bottom-2 left-0 w-full z-50 pointer-events-none px-2">
        
        {/* Floating Glass Dock Container */}
        <div className="relative mx-auto max-w-2xl category-scroll backdrop-blur-sm border border-white/10 rounded-[35px] shadow-2xl overflow-hidden pointer-events-auto">
          
          {/* Header Label - Integrated */}
          <div className="absolute top-0 left-0 w-full text-center py-1 z-10">
            <span className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">
              {t('menuCategories')}
            </span>
          </div>



          {/* Scroll Container */}
          <div className="category-scroll w-full overflow-x-auto no-scrollbar px-6 pt-10 pb-4 touch-pan-x">
            <div className="flex gap-5 min-w-max items-start justify-center mx-auto">
              {categories.map((cat, index) => {
                const isActive = activeCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCatId(cat.id)}
                    className={`group flex flex-col items-center gap-3 transition-all duration-300 ease-out active:scale-95 w-[5.5rem] ${
                      isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Liquid Glass Icon */}
                    <div
                      className={`relative w-[4.5rem] h-[4.5rem] rounded-[22px] overflow-hidden transition-all duration-500 shrink-0 ${
                        isActive
                          ? "shadow-[0_8px_30px_rgba(234,124,105,0.5)] ring-1 ring-white/50 scale-110"
                          : "ring-1 ring-white/10 grayscale-[0.3]"
                      }`}
                    >
                      {/* Glossy Overlay (The Liquid Feel) */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent z-20 pointer-events-none mix-blend-overlay" />
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent z-20 pointer-events-none rounded-t-[22px]" />

                      {cat.image_url ? (
                        <Image
                          src={cat.image_url}
                          alt={content(cat.title)}
                          width={72}
                          height={72}
                          className="w-full h-full object-cover"
                          priority={index < 4}
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                          <span className="text-xl text-white">●</span>
                        </div>
                      )}
                      
                      {/* Active Color Tint */}
                       {isActive && <div className="absolute inset-0 bg-[#ea7c69]/20 mix-blend-overlay z-10" />}
                    </div>

                    {/* Label - Fixed Height & Larger */}
                    <div className="h-10 flex items-start justify-center w-full">
                      <span
                        className={`text-[13px] font-medium tracking-tight leading-4 text-center transition-colors duration-300 line-clamp-2 ${
                          isActive ? "text-white drop-shadow-md font-semibold" : "text-white/60"
                        }`}
                      >
                        {content(cat.title)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
