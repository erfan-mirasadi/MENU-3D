"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { updateSessionNote } from "@/services/sessionService";

export default function ImmersiveCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onSubmit,
  session,
}) {
  const { content, t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (session?.note) {
      setNote(session.note);
    }
  }, [session?.note]);

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

  const total = cartItems.reduce(
    (a, b) => a + b.unit_price_at_order * b.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        className={`relative w-full max-w-sm bg-[#1a1a1a]/90 backdrop-blur-2xl border-l border-white/10 h-full flex flex-col transition-transform duration-500 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <h2 className="text-2xl font-bold text-white">Your Selection</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 bg-white/5 p-3 rounded-2xl border border-white/5"
            >
              <div className="relative w-16 h-16 bg-white/5 rounded-xl shrink-0">
                <Image
                  src={item.product?.image_url}
                  alt=""
                  fill
                  className="object-cover opacity-80"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">
                  {content(item.product?.title)}
                </h4>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-purple-300 font-mono text-sm">
                    {Number(item.unit_price_at_order).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">
                      x{item.quantity}
                    </span>
                    {item.status === "draft" && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-red-400 text-xs"
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-black/40 border-t border-white/10">
          <div className="mb-4">
            <label className="text-white/60 text-xs mb-2 block uppercase tracking-wider font-bold">
              Chef Instructions / Special Requests
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500/50 placeholder:text-white/20 resize-none"
              rows={3}
              placeholder="Allergies, birthday surprises, etc..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-between text-white mb-6">
            <span>Total</span>
            <span className="font-black text-2xl">
              {total.toLocaleString()} ₺
            </span>
          </div>
          <button
            onClick={async () => {
              if (session?.id && note !== session.note) {
                await updateSessionNote(session.id, note);
              }
              onSubmit();
              onClose();
            }}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-purple-900/40"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}
