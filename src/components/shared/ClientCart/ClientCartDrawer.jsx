"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import FeatureGuard from "@/components/shared/FeatureGuard";
import { updateSessionNote } from "@/services/sessionService";
import SwipeableCartItem from "./SwipeableCartItem";
import OrderedCartItem from "./OrderedCartItem";
import CartOrderNote from "./CartOrderNote";

export default function ClientCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onSubmit,
  session,
}) {
  const { content, t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (session?.note) {
      setNote(session.note);
    }
  }, [session?.note]);

  useEffect(() => {
    let timer;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setShouldRender(true);
      timer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      document.body.style.overflow = "";
      setIsAnimating(false);
      timer = setTimeout(() => {
        setShouldRender(false);
      }, 500);
    }

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const draftItems = cartItems.filter((item) => item.status === "draft");
  const orderedItems = cartItems.filter((item) => item.status !== "draft");

  // Group items that have already been sent to the kitchen so duplicates sum quantities together
  const groupedOrderedItems = Object.values(orderedItems.reduce((acc, item) => {
    const key = item.product_id || item.product?.id;
    if (!acc[key]) {
      acc[key] = { ...item, quantity: 0 };
    }
    acc[key].quantity += item.quantity;
    return acc;
  }, {}));

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.unit_price_at_order * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center">

      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm bg-black/20 transition-opacity duration-500 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Drawer Panel */}
      <div
        className={`relative w-full max-w-md bg-[#1F1D2B]/70 backdrop-blur-sm rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-transform duration-500 ease-out ${
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


        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm">{t("emptyCart")}</p>
            </div>
          ) : (
            <>
              {/* DRAFT ITEMS (Swipeable) */}
              {draftItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#ea7c69] animate-pulse" />
                    <span className="text-xs font-bold text-[#ea7c69] uppercase tracking-widest">
                      {t("newItems")}
                    </span>
                  </div>

                  {draftItems.map((item) => (
                    <SwipeableCartItem 
                      key={item.id} 
                      item={item} 
                      onRemove={onRemove}
                      t={t} 
                      content={content} 
                    />
                  ))}
                  

                  <div className="text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">
                       ← {t("swipeToDelete")}
                    </p>
                  </div>
                </div>
              )}
              
              {session && (
                 <CartOrderNote t={t} note={note} setNote={setNote} />
              )}

              {/* ORDERED ITEMS (Already Sent) */}
              {orderedItems.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/5 opacity-70 grayscale-[0.3]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                      {t("sentToKitchen")}
                    </span>
                  </div>

                  {groupedOrderedItems.map((item) => (
                    <OrderedCartItem key={item.id} item={item} content={content} />
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
            <FeatureGuard feature="ordering_enabled">
            <button
              onClick={async () => {
                 if (session?.id && note !== session.note) {
                   await updateSessionNote(session.id, note);
                 }
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
            </FeatureGuard>
          ) : (
             <>
               {session && note !== session.note ? (
                 <button
                 onClick={async () => {
                   await updateSessionNote(session.id, note);
                   onClose();
                 }}
                 className="w-full bg-white/10 hover:bg-white/20 text-white h-14 rounded-2xl font-bold text-lg active:scale-95 transition-all"
               >
                 {t("save")}
               </button>
               ) : (
                <div className="w-full h-14 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500 text-sm font-medium cursor-not-allowed">
                  {t("noNewItems")}
                </div>
               )}
             </>
          )}
        </div>
      </div>
    </div>
  );
}
