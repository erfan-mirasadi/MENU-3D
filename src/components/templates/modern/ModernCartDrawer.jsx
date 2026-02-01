"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import FeatureGuard from "@/components/shared/FeatureGuard";
import { updateSessionNote } from "@/services/sessionService";

import { useDrag } from "@use-gesture/react";
import { MdDeleteOutline, MdAdd, MdRemove } from "react-icons/md";

function SwipeableItem({ item, onRemove, t, content }) {
  const [x, setX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  // Threshold increased to roughly 80% of width (assuming ~350px width -> -280)
  const threshold = -250; 

  const bind = useDrag(
    ({ movement: [mx], down, cancel }) => {
      if (isDeleting) return;
      
      // Allow swipe up to -310px
      const newX = Math.min(0, Math.max(-310, mx));
      
      if (down) {
        setX(newX);
      } else {
        if (mx < threshold) {
          // Trigger delete
          setIsDeleting(true);
          setX(-400); 
          setTimeout(() => onRemove(item.id), 300);
        } else {
          // Snap back
          setX(0);
        }
      }
    },
    { axis: "x", filterTaps: true }
  );

  if (isDeleting) return null;

  return (
    <div className="relative group touch-pan-y select-none mb-3">
      {/* BACKGROUND (DELETE ACTION) - PEEKING */}
      <div className="absolute inset-y-1 right-0 w-full bg-red-500/20 rounded-2xl flex items-center justify-end pr-4 overflow-hidden border border-red-500/30 z-0">
         <div className="flex flex-col items-center justify-center text-red-500 gap-1 animate-pulse scale-125 origin-right">
           <MdDeleteOutline size={28} />
           <span className="text-[10px] font-bold uppercase tracking-wider">{t("remove")}</span>
        </div>
      </div>

      {/* FOREGROUND (CARD) */}
      <div
        {...bind()}
        style={{ transform: `translateX(${x}px)`, touchAction: "pan-y" }}
        className="relative flex items-center gap-3 bg-[#252836] backdrop-blur-xl p-3 rounded-2xl border border-white/5 z-10 transition-transform duration-100 ease-out active:cursor-grabbing cursor-grab shadow-lg mr-2 " 
      >
        
        {/* Image - No Frame, Larger */}
        <div className="relative w-22 h-22 rounded-2xl overflow-hidden shrink-0 pointer-events-none shadow-md">
          <Image
            src={item.product?.image_url}
            alt={content(item.product?.title)}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pointer-events-none pr-2">
          <h4 className="text-white font-black text-md truncate leading-tight">
            {content(item.product?.title)}
          </h4>
          <p className="text-[#ea7c69] text-md font-bold mt-1">
            {Number(item.unit_price_at_order).toLocaleString()}{" "}
            {t("currency")}
          </p>
        </div>

        {/* Actions (Static Quantity - Premium Pill Style) */}
        <div className="shrink-0 pointer-events-none flex flex-col items-center justify-center pl-3">
          <div className="flex items-baseline gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-2 py-1 shadow-md">
             <span className="text-sm text-[#ea7c69] font-bold">x</span>
             <span className="text-white/90 font-mono font-black text-xl leading-none tracking-tighter">
              {item.quantity}
             </span>
          </div>
        </div>
        
        {/* Red Peek Indicator Strip (Visual Cue) */}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-red-500/50 rounded-l-md pointer-events-none" />
      </div>
    </div>
  );
}

export default function ModernCartDrawer({
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
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
      setIsAnimating(false);
      // Wait for animation to finish
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

  // Separate Items
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

        {/* --- SCROLLABLE LIST --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm">{t("emptyCart")}</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: DRAFT ITEMS (Swipeable) */}
              {draftItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#ea7c69] animate-pulse" />
                    <span className="text-xs font-bold text-[#ea7c69] uppercase tracking-widest">
                      {t("newItems")}
                    </span>
                  </div>

                  {draftItems.map((item) => (
                    <SwipeableItem 
                      key={item.id} 
                      item={item} 
                      onRemove={onRemove}
                      t={t} 
                      content={content} 
                    />
                  ))}
                  
                  {/* Hint Text */}
                  <div className="text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">
                       ← {t("swipeToDelete")}
                    </p>
                  </div>
                </div>
              )}

              {/* --- NOTE SECTION (Always visible if session exists) --- */}
              {session && (
               <div className="pt-4 border-t border-white/5 mx-1">
                 <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                   Chef Instructions / Special Requests
                 </label>
                 <textarea
                   className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#ea7c69]/50 placeholder:text-white/20 resize-none transition-colors"
                   rows={3}
                   placeholder="Allergies, extra spicy, etc..."
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                 />
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
                          sizes="50px"
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
               {/* If no new items but note changed, allow saving note? */}
               {session && note !== session.note ? (
                 <button
                 onClick={async () => {
                   await updateSessionNote(session.id, note);
                   onClose();
                 }}
                 className="w-full bg-white/10 hover:bg-white/20 text-white h-14 rounded-2xl font-bold text-lg active:scale-95 transition-all"
               >
                 Save Note
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

