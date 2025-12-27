"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function ModernCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onSubmit,
}) {
  const { content, t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setShouldRender(true);
      // شروع انیمیشن بعد از یک تیک
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      document.body.style.overflow = "";
      setIsAnimating(false);
      // صبر برای اتمام انیمیشن قبل از unmount
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  // جدا کردن آیتم‌های جدید (Draft) از آیتم‌های قبلی (Pending)
  const draftItems = cartItems.filter((item) => item.status === "draft");
  const orderedItems = cartItems.filter((item) => item.status !== "draft");

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.unit_price_at_order * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center">
      {/* Backdrop (Back click closes) */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Drawer Panel */}
      <div
        className={`relative w-full max-w-md bg-[#1F1D2B] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-transform duration-500 ease-out ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* --- HEADER --- */}
        <div className="shrink-0 p-6 pb-2 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t("yourOrder")}
            </h2>
            <p className="text-gray-400 text-xs font-mono mt-1">
              {t("table")} <span className="text-[#ea7c69]">{t("active")}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#252836] flex items-center justify-center text-white hover:bg-[#ea7c69] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* --- SCROLLABLE LIST --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm">{t("emptyCart")}</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: DRAFT ITEMS (New) */}
              {draftItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#ea7c69] animate-pulse" />
                    <span className="text-xs font-bold text-[#ea7c69] uppercase tracking-widest">
                      {t("newItems")}
                    </span>
                  </div>

                  {draftItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-[#252836] p-3 rounded-2xl border border-white/5 relative overflow-hidden group"
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/20 shrink-0">
                        <Image
                          src={item.product?.image_url}
                          alt={content(item.product?.title)}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">
                          {content(item.product?.title)}
                        </h4>
                        <p className="text-[#ea7c69] text-xs font-bold mt-1">
                          {Number(item.unit_price_at_order).toLocaleString()}{" "}
                          {t("currency")}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-white/10 px-2 py-1 rounded-md text-xs font-mono text-white">
                          x{item.quantity}
                        </span>

                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-red-400 text-[10px] hover:text-red-200 underline decoration-red-400/30"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 2: ORDERED ITEMS (Already Sent) */}
              {orderedItems.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/5 opacity-70 grayscale-[0.3]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                      {t("sentToKitchen")}
                    </span>
                  </div>

                  {orderedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-2 rounded-xl"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 grayscale">
                        <Image
                          src={item.product?.image_url}
                          alt={content(item.product?.title)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-300 font-medium text-xs truncate">
                          {content(item.product?.title)}
                        </h4>
                      </div>
                      <span className="text-gray-500 text-xs font-mono">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="shrink-0 bg-[#252836] p-6 border-t border-white/5">
          <div className="flex justify-between items-end mb-6">
            <span className="text-gray-400 text-sm">{t("totalAmount")}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">
                {totalAmount.toLocaleString()}
              </span>
              <span className="text-[#ea7c69] font-bold">{t("currency")}</span>
            </div>
          </div>

          {draftItems.length > 0 ? (
            <button
              onClick={() => {
                onSubmit();
                onClose();
              }}
              className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] text-white h-14 rounded-2xl font-bold text-lg shadow-[0_10px_30px_-5px_rgba(234,124,105,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{t("confirmOrder")}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                {draftItems.reduce((a, b) => a + b.quantity, 0)} {t("items")}
              </span>
            </button>
          ) : (
            <div className="w-full h-14 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500 text-sm font-medium cursor-not-allowed">
              {t("noNewItems")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
