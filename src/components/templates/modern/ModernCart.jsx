"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function ModernCart({
  totalAmount,
  totalCount,
  isLoading,
  onClick,
}) {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-30">
      <button
        onClick={onClick}
        className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] text-white py-4 rounded-3xl shadow-[0_20px_40px_-10px_rgba(234,124,105,0.5)] flex items-center justify-between px-6 active:scale-95 transition-all border border-white/20 backdrop-blur-xl"
      >
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
            Total
          </span>
          <span className="text-lg font-black">
            {isLoading ? "..." : totalAmount.toLocaleString()} ₺
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">{t("viewCart")}</span>
          <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {totalCount}
          </div>
        </div>
      </button>
    </div>
  );
}
