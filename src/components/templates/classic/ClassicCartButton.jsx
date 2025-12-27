"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function ClassicCartButton({
  totalCount,
  totalAmount,
  onClick,
}) {
  const { t } = useLanguage();
  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
      <button
        onClick={onClick}
        className="w-full bg-[#2C1810] text-[#FDFBF7] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(44,24,16,0.3)] border border-[#D4AF37]/30 hover:bg-[#3E2419] transition-all"
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
            {t("total")}
          </span>
          <span className="text-xl font-serif font-bold">
            {totalAmount.toLocaleString()} ₺
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm uppercase tracking-widest font-bold">
            {t("viewCart")}
          </span>
          <div className="w-8 h-8 bg-[#D4AF37] text-[#2C1810] flex items-center justify-center font-bold rounded-full">
            {totalCount}
          </div>
        </div>
      </button>
    </div>
  );
}
