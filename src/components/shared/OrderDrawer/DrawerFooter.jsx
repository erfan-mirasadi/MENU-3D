import { FaMoneyBillWave } from "react-icons/fa";
import Loader from "@/components/ui/Loader";
import { useLanguage } from "@/context/LanguageContext";

export default function DrawerFooter({ totalAmount, onCloseTable, loading }) {
  const { t } = useLanguage();

  return (
    <div className="p-4 bg-[#252836] border-t border-white/5 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] safe-area-bottom shrink-0">
      <div className="flex justify-between items-end mb-3">
        <span className="text-gray-400 text-sm font-medium">{t('totalBill')}</span>
        <span className="text-3xl font-black text-white tracking-tighter">
          {totalAmount.toLocaleString()}{" "}
          <span className="text-[#ea7c69] text-xl">{t('currency')}</span>
        </span>
      </div>

      {/* دکمه اصلی بستن میز */}
      <button
        onClick={onCloseTable}
        disabled={loading}
        className="w-full py-4 bg-[#252836] border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
      >
        {loading ? (
           <Loader variant="inline" className="w-5 h-5 text-current" />
        ) : (
           <FaMoneyBillWave />
        )}
        {loading ? t('processing') : t('finishCheckout')}
      </button>
    </div>
  );
}
