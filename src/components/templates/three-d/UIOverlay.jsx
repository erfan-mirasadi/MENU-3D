"use client";

import { useState, useEffect, useRef } from "react";
import { useProgress } from "@react-three/drei";
import Image from "next/image";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { MdViewInAr, MdTouchApp } from "react-icons/md";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import Loader from "@/components/ui/Loader";

import CartControls from "./CartControls";
import ModernCartDrawer from "../modern/ModernCartDrawer";

const styles = `
  @keyframes handSwipe {
    0% { transform: translateX(10px) rotate(15deg) scale(0.8); opacity: 0; }
    15% { transform: translateX(10px) rotate(15deg) scale(1); opacity: 1; }
    85% { transform: translateX(-25px) rotate(15deg) scale(1); opacity: 1; }
    100% { transform: translateX(-35px) rotate(15deg) scale(0.8); opacity: 0; }
  }
  .animate-hand-swipe {
    animation: handSwipe 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
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
  return (
    <div
      className="absolute bottom-56 left-0 w-full flex justify-center items-center pointer-events-none z-40 animate-in fade-in zoom-in duration-1000"
    >
      <div className="relative flex items-center justify-center">
         {/* Touch Ripple Effect */}
         <div className="absolute top-2 left-2 w-8 h-8 bg-white/30 rounded-full animate-ping" />
         
         {/* Hand Icon - Larger & Shadowed */}
         <MdTouchApp size={56} className="text-white/90 animate-hand-swipe drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] filter" />
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
  // State lifted from ThreeDLayout
  isCartOpen,
  setIsCartOpen,
}) {
  const { content, t } = useLanguage();
  const { active } = useProgress();
  const [showHint, setShowHint] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    // If loading, or already shown, do nothing
    if (active || hasShownRef.current) return;

    // Start timer to show hint after 1s of stable "loaded" state
    const timer = setTimeout(() => {
      hasShownRef.current = true;
      setShowHint(true);
      
      // Auto-hide after 3s
      setTimeout(() => setShowHint(false), 3000);
    }, 1000);

    // Cleanup: If 'active' changes (e.g. becomes true) or unmount, clear timer
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <>
      <style>{styles}</style>
      <Loader active={active} />
      {/* Run only when loading finishes (!active) and cart is closed */}
      {!isCartOpen && !active && showHint && <SwipeHint />}

      {/* --- CONTROLS (Hidden when cart is open) --- */}
      <div className={`transition-opacity duration-300 ${isCartOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <CartControls
          focusedProduct={focusedProduct}
          cartItems={cartItems || []}
          onAdd={addToCart}
          onDecrease={decreaseFromCart}
          onRemove={removeFromCart}
          onOpenCart={() => setIsCartOpen(true)}
        />
      </div>

      {/* --- DRAWER --- */}
      <ModernCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems || []}
        onRemove={removeFromCart}
        onSubmit={submitOrder}
      />

      {/* --- LIQUID GLASS NAVIGATION ARROWS (CENTERED) --- */}
      {!isCartOpen && activeIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((prev) => prev - 1);
          }}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full backdrop-blur-md border border-white/14 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white active:scale-90 transition-all duration-300 group overflow-hidden"
          aria-label="Previous Item"
        >
          {/* Liquid Gloss Overlay */}
          <div className="absolute inset-0.5 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none rounded-full" />
          <IoChevronBack size={22} className="relative z-10 drop-shadow-md text-white/60" />
        </button>
      )}

      {!isCartOpen && activeIndex < productCount - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((prev) => prev + 1);
          }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full backdrop-blur-md border border-white/14 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white active:scale-80 transition-all duration-300 group overflow-hidden"
          aria-label="Next Item"
        >
          {/* Liquid Gloss Overlay */}
          <div className="absolute inset-0.5 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none rounded-full" />
          <IoChevronForward size={22} className="relative z-10 drop-shadow-md text-white/60" />
        </button>
      )}

      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 w-full z-10 p-6 pt-3 text-center pointer-events-none">
        
        <div className="absolute top-2 right-2 pointer-events-auto">
          <LanguageSwitcher />
        </div>

        {/* Fixed Height Flex Container for Header Info */}
        <div className="flex flex-col items-center justify-start gap-0 w-full max-w-md mx-auto h-[35vh]">
          {/* Restaurant Name */}
          <h3 className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase mb-0 shrink-0 z-50">
            {content(restaurant.name)}
          </h3>

          {focusedProduct && categoryMounted && (
            <div key={focusedProduct.id} className="contents">
              {/* Product Title - Fixed Height Container (Balanced) */}
              <div className="w-full h-22 flex items-center justify-center px-4 shrink-0 animate-text-change">
                <h1 className="text-white text-4xl font-black uppercase tracking-tighter drop-shadow-2xl leading-none max-w-xs mx-auto text-wrap text-center line-clamp-2">
                   {content(focusedProduct.title)}
                </h1>
              </div>

              {/* Price Section - Fixed Height Container (Balanced) */}
              <div
                className="h-16 w-full flex flex-col items-center justify-center shrink-0 animate-text-change"
                style={{ animationDelay: "0.1s" }}
              >
                {(() => {
                  const price = Number(focusedProduct.price);
                  const originalPrice = focusedProduct.original_price ? Number(focusedProduct.original_price) : null;
                  const hasDiscount = originalPrice && originalPrice > price;
                  
                  if (hasDiscount) {
                    const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
                    
                    return (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white/40 text-sm font-bold line-through decoration-white/40">
                            {originalPrice.toLocaleString()}₺
                          </span>
                          <div className="bg-[#ea7c69] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(234,124,105,0.6)]">
                            {discountPercent}% {t('off')}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-1">
                           <p className="text-white text-4xl font-black font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(234,124,105,0.8)]">
                            {price.toLocaleString()}
                          </p>
                          <span className="text-[#ea7c69] text-xl font-bold">₺</span>
                        </div>
                      </div>
                    );
                  }

                  // Standard Price
                  return (
                    <div className="flex items-baseline gap-1">
                       <p className="text-[#ea7c69] text-4xl font-bold font-mono">
                        {price.toLocaleString()}
                      </p>
                      <span className="text-[#ea7c69] text-xl">₺</span>
                    </div>
                  );
                })()}
              </div>

              {/* Description - Fixed Height Container (Balanced) */}
              <div className="h-12 w-full flex items-start justify-center overflow-hidden shrink-0 ">
                <p
                  className="text-white/60 text-xs max-w-[280px] leading-relaxed animate-text-change text-center line-clamp-2"
                  style={{ animationDelay: "0.2s" }}
                >
                  {content(focusedProduct.description) || ""}
                </p>
              </div>

              {/* AR Button - Fixed Position via Container Flow */}
              <div 
                className="h- w-full flex items-center justify-center animate-text-change shrink-0" 
                style={{ animationDelay: "0.3s" }}
              >
                {focusedProduct?.model_url && (
                  <button
                    onClick={() => onLaunchAR()}
                    className="pointer-events-auto relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-300 active:scale-95 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none" />
                    <MdViewInAr className="text-white text-lg relative z-10" />
                    <span className="text-white text-[9px] font-bold uppercase tracking-widest relative z-10">
                      {t('showOnTable')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- BOTTOM CATEGORY NAV --- */}
      <div className="absolute bottom-0 left-0 w-full z-50 pointer-events-none px-0">
        
        {/* Floating Glass Dock Container */}
        <div className="relative mx-auto max-w-2xl backdrop-blur-sm border-t border-white/10 rounded-t-[35px] shadow-2xl overflow-hidden pointer-events-auto bg-black/20 group/nav">
          
          {/* Header Label - Integrated */}
          <div className="absolute top-0 left-0 w-full text-center z-10">
            <span className="text-white/50 text-[8px] font-semibold tracking-[0.2em] uppercase">
              {t('menuCategories')}
            </span>
          </div>

          {/* Logic for Arrows */}
          {(() => {
             const scrollRef = useRef(null);
             const [showLeft, setShowLeft] = useState(false);
             const [showRight, setShowRight] = useState(true);

             const checkScroll = () => {
               if (!scrollRef.current) return;
               const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
               setShowLeft(scrollLeft > 10);
               setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
             };

             useEffect(() => {
               checkScroll();
               window.addEventListener('resize', checkScroll);
               return () => window.removeEventListener('resize', checkScroll);
             }, []);

             const scroll = (direction) => {
               if (scrollRef.current) {
                 scrollRef.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
               }
             };

             return (
               <>
                 {/* Left Arrow */}
                 <div className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center z-20 transition-opacity duration-300 ${showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                   <button 
                     onClick={() => scroll(-1)}
                     className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/70 transition-all active:scale-90"
                   >
                     <IoChevronBack size={18} />
                   </button>
                   {/* Gradient Mask */}
                   <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/20 to-transparent -z-10 pointer-events-none" />
                 </div>

                 {/* Right Arrow */}
                 <div className={`absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center z-20 transition-opacity duration-300 ${showRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                   <button 
                     onClick={() => scroll(1)}
                     className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/70  transition-all active:scale-90"
                   >
                     <IoChevronForward size={18} />
                   </button>
                   {/* Gradient Mask */}
                   <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-black/20 to-transparent -z-10 pointer-events-none" />
                 </div>

                 {/* Scroll Container */}
                 <div 
                   ref={scrollRef}
                   onScroll={checkScroll}
                   className="category-scroll w-full overflow-x-auto no-scrollbar px-5 pt-8 pb-0 touch-pan-x scroll-smooth"
                 >
                   <div className="flex gap-4 min-w-max items-start justify-center mx-auto">
              {categories.map((cat, index) => {
                const isActive = activeCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCatId(cat.id)}
                    className={`group flex flex-col items-center gap-2 transition-all duration-300 ease-out active:scale-95 w-[5.5rem] ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    {/* Liquid Glass Icon - Rectangular  */}
                    <div
                      className={`relative w-[5rem] h-[3.3rem] rounded-[18px] overflow-hidden transition-all duration-500 shrink-0 ${
                        isActive
                          ? "shadow-[0_5px_20px_rgba(234,124,105,0.45)] ring-1 ring-white/50 scale-105"
                          : "ring-1 ring-white/10 grayscale-[0.3]"
                      }`}
                    >
                      {/* Glossy Overlay (The Liquid Feel) */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent z-20 pointer-events-none mix-blend-overlay" />
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent z-20 pointer-events-none rounded-t-[18px]" />

                      {cat.image_url ? (
                        <Image
                          src={cat.image_url}
                          alt={content(cat.title)}
                          width={80}
                          height={53}
                          className="w-full h-full object-cover"
                          priority={index < 4}
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                          <span className="text-lg text-white">●</span>
                        </div>
                      )}
                      
                      {/* Active Color Tint */}
                       {isActive && <div className="absolute inset-0 bg-[#ea7c69]/20 mix-blend-overlay z-10" />}
                    </div>

                    {/* Label - Fixed Height & Medium Text */}
                    <div className="h-8 flex items-start justify-center w-full">
                      <span
                        className={`text-[11px] font-medium tracking-tight leading-3.5 text-center transition-colors duration-300 line-clamp-2 ${
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
               </>
             );
          })()}
        </div>
      </div>
    </>
  );
}
