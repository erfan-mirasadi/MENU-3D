"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function ImmersiveCartBar({ totalCount, totalAmount, onClick }) {
  const { t } = useLanguage();
  return (
    // Fixed position with high z-index
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-[90%] max-w-md pointer-events-auto">
      <button
        onClick={onClick}
        className="w-full bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/20 p-2 pr-6 rounded-[2.5rem] flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] transition-transform active:scale-95"
      >
        {/* Circle Icon */}
        <div className="bg-gradient-to-tr from-purple-600 to-blue-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-white/20 animate-[spin_6s_linear_infinite] opacity-50"></div>
          <span className="relative font-black text-xl text-white">
            {totalCount}
          </span>
        </div>

        <div className="flex flex-col items-end pl-4">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-0.5">
            {t("totalOrder")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">
              {totalAmount.toLocaleString()}
            </span>
            <span className="text-sm text-white/60">₺</span>
          </div>
        </div>
      </button>
    </div>
  );
}
