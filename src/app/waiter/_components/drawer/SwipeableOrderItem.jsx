"use client";
import { useState, useRef } from "react";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import SmartMedia from "@/components/ui/SmartMedia";

export default function SwipeableOrderItem({
  item,
  isPending,
  onUpdateQty,
  onDelete,
  readOnly = false
}) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const rowRef = useRef(null);

  // Helper for title extraction
  const title =
    typeof item.product?.title === "object"
      ? item.product.title.tr || item.product.title.en
      : item.product?.title || "Unknown";

  // --- Touch Logic ---
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (rowRef.current) rowRef.current.style.transition = "none";
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff < 0) setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (rowRef.current)
      rowRef.current.style.transition = "transform 0.3s ease-out";

    // Swipe Thresholds
    if (translateX < -200) {
      if (confirm("Confirm Delete?")) onDelete(item.id);
      setTranslateX(0);
    } else if (translateX < -70) {
      setTranslateX(-80); // Keep open slightly
    } else {
      setTranslateX(0); // Close
    }
  };

  return (
    <div className="relative h-24 w-full select-none overflow-hidden rounded-xl bg-[#252836]">
      {/* Background Action (Delete) */}
      <div className="absolute inset-y-0 right-0 w-full bg-red-600 flex items-center justify-end px-6 rounded-xl">
        <FaTrash className="text-white text-2xl animate-pulse" />
      </div>

      {/* Foreground Content */}
      <div
        ref={rowRef}
        className="absolute inset-0 bg-[#252836] flex items-center justify-between p-3 rounded-xl border border-white/5 z-10"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Info & Image */}
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className="w-16 h-16 shrink-0 bg-black/30 rounded-lg overflow-hidden border border-white/5">
            <SmartMedia files={item.product} alt={title} autoPlay={false} />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`font-bold text-lg truncate ${
                isPending ? "text-white" : "text-gray-300"
              }`}
            >
              {title}
            </span>
            <span className="text-[#ea7c69] font-mono text-sm">
              {item.unit_price_at_order} ₺
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 pl-2">
          {!readOnly && (
              <button
                onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                className="w-10 h-10 bg-[#1F1D2B] border border-white/10 rounded-lg flex items-center justify-center text-gray-400 active:scale-90 transition-all"
              >
                <FaMinus />
              </button>
          )}
          
          <div className="w-10 text-center font-black text-xl text-white">
            {item.quantity}
          </div>

          {!readOnly && (
              <button
                onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                className="w-10 h-10 bg-[#1F1D2B] border border-white/10 rounded-lg flex items-center justify-center text-gray-400 active:scale-90 transition-all"
              >
                <FaPlus />
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
