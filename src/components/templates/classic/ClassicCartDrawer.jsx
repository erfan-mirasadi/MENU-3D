"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function ClassicCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onSubmit,
}) {
  const { content, t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const t = setTimeout(() => setVisible(false), 500);
      document.body.style.overflow = "";
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  const draftItems = cartItems.filter((i) => i.status === "draft");
  const orderedItems = cartItems.filter((i) => i.status !== "draft");
  const total = cartItems.reduce(
    (a, b) => a + b.unit_price_at_order * b.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[70] flex justify-end font-serif">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#2C1810]/40 backdrop-blur-[2px] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#D4AF37]/20 flex justify-between items-center bg-[#F9F7F2]">
          <h2 className="text-2xl font-bold text-[#2C1810] italic">
            Your Selection
          </h2>
          <button
            onClick={onClose}
            className="text-[#2C1810] hover:text-[#D4AF37] text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* New Items */}
          {draftItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] border-b border-[#D4AF37] pb-2">
                Ready to Order
              </h3>
              {draftItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 border border-[#E5E0D8]">
                    <Image
                      src={item.product?.image_url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#2C1810] font-bold">
                      {content(item.product?.title)}
                    </h4>
                    <p className="text-[#8A7E72] text-sm">
                      x{item.quantity} —{" "}
                      {Number(item.unit_price_at_order).toLocaleString()} ₺
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-800 text-sm hover:underline self-start"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Old Items */}
          {orderedItems.length > 0 && (
            <div className="space-y-4 opacity-60">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[#5C504A] border-b border-[#5C504A] pb-2">
                Kitchen Preparing
              </h3>
              {orderedItems.map((item) => (
                <div key={item.id} className="flex gap-4 grayscale">
                  <div className="relative w-12 h-12 border border-[#E5E0D8]">
                    <Image
                      src={item.product?.image_url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#2C1810] font-bold text-sm">
                      {content(item.product?.title)}
                    </h4>
                    <p className="text-[#8A7E72] text-xs">x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#2C1810] text-[#FDFBF7]">
          <div className="flex justify-between items-end mb-6">
            <span className="text-[#D4AF37] uppercase tracking-widest text-sm">
              Grand Total
            </span>
            <span className="text-3xl font-bold">
              {total.toLocaleString()} ₺
            </span>
          </div>

          {draftItems.length > 0 ? (
            <button
              onClick={() => {
                onSubmit();
                onClose();
              }}
              className="w-full py-4 bg-[#FDFBF7] text-[#2C1810] font-bold uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-colors"
            >
              Confirm Order
            </button>
          ) : (
            <div className="text-center text-sm text-gray-400 italic">
              No new items to submit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
