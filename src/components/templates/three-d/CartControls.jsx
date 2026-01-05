"use client";

import { useMemo } from "react";
import { FaShoppingBasket, FaPlus, FaMinus } from "react-icons/fa";

export default function CartControls({
  focusedProduct,
  cartItems,
  onAdd,
  onDecrease,
  onOpenCart,
}) {
  // پیدا کردن آیتم درفت
  const draftItem = useMemo(() => {
    if (!focusedProduct || !cartItems) return null;
    return cartItems.find(
      (item) => item.product_id === focusedProduct.id && item.status === "draft"
    );
  }, [focusedProduct, cartItems]);

  const currentQty = draftItem ? draftItem.quantity : 0;

  const totalCartCount = useMemo(
    () =>
      cartItems
        .filter((item) => item.status === "draft")
        .reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  if (!focusedProduct) return null;

  return (
    <>
      {/* --- LEFT ACTIONS (ADD / QUANTITY) --- */}
      {/* پوزیشن رفت بالاتر: bottom-48 */}
      <div className="absolute bottom-52 left-10 z-40 flex flex-col items-center pointer-events-auto">
        {currentQty > 0 ? (
          // --- ACTIVE STATE: VERTICAL CAPSULE (DARK & GLASS) ---
          <div className="flex flex-col items-center p-1.5 gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-2 fade-in duration-300">
            {/* دکمه مثبت */}
            <button
              onClick={() => onAdd(focusedProduct)}
              className="w-10 h-10 bg-[#ea7c69] text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,124,105,0.4)] active:scale-90 transition-all duration-200"
            >
              <FaPlus size={14} />
            </button>

            {/* نمایش عدد */}
            <div className="flex items-center justify-center w-8 h-6">
              <span className="text-white font-black font-mono text-sm tracking-wider drop-shadow-md">
                {currentQty}
              </span>
            </div>

            {/* دکمه منفی */}
            <button
              onClick={() => onDecrease(draftItem.id)}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white/70 rounded-full flex items-center justify-center border border-white/5 active:scale-90 transition-all duration-200"
            >
              <FaMinus size={12} />
            </button>
          </div>
        ) : (
          // --- IDLE STATE: FLOATING MYSTERIOUS BUTTON ---
          // کلاس animate-float باعث میشه آروم بالا پایین بره
          <button
            onClick={() => onAdd(focusedProduct)}
            className="animate-float group w-16 h-16 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90 transition-all duration-500 hover:bg-black/60 hover:border-white/40 hover:shadow-[0_0_25px_rgba(234,124,105,0.3)]"
          >
            {/* دایره داخلی برای افکت عمق */}
            <div className="absolute inset-2 rounded-full border border-white/5 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <FaPlus
              size={20}
              className="text-white/90 group-hover:text-[#ea7c69] transition-colors duration-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
            />
          </button>
        )}
      </div>

      {/* --- RIGHT ACTION (CART) --- */}
      {/* فقط اگر آیتمی هست نشون بده - پوزیشن رفت بالاتر: bottom-48 */}
      {totalCartCount > 0 && (
        <div className="absolute bottom-56 right-6 z-40 pointer-events-auto animate-in zoom-in-50 duration-300">
          <button
            onClick={onOpenCart}
            className="relative w-14 h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[20px] flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 hover:bg-black/80 hover:border-white/20 group"
          >
            <div className="relative">
              <FaShoppingBasket
                size={22}
                className="text-white/80 group-hover:text-[#ea7c69] transition-colors duration-300"
              />
            </div>

            {/* بج تعداد */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ea7c69] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_10px_#ea7c69] animate-pulse">
              {totalCartCount}
            </div>
          </button>
        </div>
      )}
    </>
  );
}
