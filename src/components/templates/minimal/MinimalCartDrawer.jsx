"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function MinimalCartDrawer({
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
  const total = cartItems.reduce(
    (a, b) => a + b.unit_price_at_order * b.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      {/* Minimal Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/20" />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-md bg-white h-full border-l-2 border-black flex flex-col transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-8 border-b-2 border-black flex justify-between items-center bg-black text-white">
          <h2 className="text-3xl font-black uppercase">Your Bag</h2>
          <button onClick={onClose} className="text-2xl hover:text-gray-400">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {cartItems.length === 0 && (
            <div className="text-center text-gray-400 mt-20 uppercase tracking-widest">
              Empty Bag
            </div>
          )}

          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 group">
              <div className="relative w-20 h-20 bg-gray-100 shrink-0">
                <Image
                  src={item.product?.image_url}
                  alt=""
                  fill
                  className="object-cover grayscale"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold uppercase text-sm leading-tight pr-2">
                    {content(item.product?.title)}
                  </h4>
                  <span className="font-mono text-sm">
                    {Number(item.unit_price_at_order).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-500 uppercase">
                    Qty: {item.quantity}
                  </span>
                  {item.status === "draft" && (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-[10px] uppercase font-bold text-red-600 border-b border-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t-2 border-black bg-gray-50">
          <div className="flex justify-between items-end mb-8 font-mono text-2xl">
            <span>TOTAL</span>
            <span className="font-bold">{total.toLocaleString()} ₺</span>
          </div>

          <button
            disabled={draftItems.length === 0}
            onClick={() => {
              onSubmit();
              onClose();
            }}
            className="w-full bg-black text-white py-5 text-lg font-bold uppercase hover:bg-white hover:text-black border-2 border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout ({draftItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
