import { FaMoneyBillWave } from "react-icons/fa";

export default function DrawerFooter({ totalAmount, onCloseTable, loading }) {
  return (
    <div className="p-4 bg-[#252836] border-t border-white/5 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] safe-area-bottom shrink-0">
      <div className="flex justify-between items-end mb-3">
        <span className="text-gray-400 text-sm font-medium">Total Bill</span>
        <span className="text-3xl font-black text-white tracking-tighter">
          {totalAmount.toLocaleString()}{" "}
          <span className="text-[#ea7c69] text-xl">₺</span>
        </span>
      </div>

      {/* دکمه اصلی بستن میز */}
      <button
        onClick={onCloseTable}
        disabled={loading}
        className="w-full py-4 bg-[#252836] border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <FaMoneyBillWave /> FINISH & CHECKOUT
      </button>
    </div>
  );
}
