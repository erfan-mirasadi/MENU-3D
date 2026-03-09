import { useState } from "react";
import Image from "next/image";
import { useDrag } from "@use-gesture/react";
import { MdDeleteOutline } from "react-icons/md";

export default function SwipeableCartItem({ item, onRemove, t, content }) {
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
        <div className="relative w-22 h-22 rounded-2xl overflow-hidden shrink-0 pointer-events-none shadow-md bg-[#1F1D2B] flex items-center justify-center">
          {item.product?.image_url ? (
            <Image
              src={item.product?.image_url}
              alt={content(item.product?.title) || "Product image"}
              fill
              sizes="120px"
              className="object-cover"
            />
          ) : (
             <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest text-center px-1 leading-tight">No Img</span>
          )}
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
