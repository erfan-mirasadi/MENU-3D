import { FaTimes, FaPlus, FaPowerOff } from "react-icons/fa";
import Loader from "@/components/ui/Loader";

export default function DrawerHeader({
  table,
  session,
  onClose,
  onOpenMenu,
  onCloseTable,
  loading,
  loadingOp
}) {
  return (
    <div className="p-4 bg-[#252836] border-b border-white/5 flex justify-between items-center shadow-md z-10 shrink-0">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Table <span className="text-[#ea7c69]">{table.table_number}</span>
        </h2>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            session
              ? "bg-green-500/10 text-green-400"
              : "bg-gray-500/10 text-gray-400"
          }`}
        >
          {session ? "Active" : "Closed"}
        </span>
      </div>

      <div className="flex gap-2">
        {session && (
          <>
            {/* ADD ITEM BUTTON (No loader needed for modal open, but disable while busy) */}
            <button
              onClick={onOpenMenu}
              disabled={loading}
              className="h-10 px-4 bg-[#ea7c69] text-white rounded-lg flex items-center gap-2 font-bold text-sm shadow-lg shadow-orange-900/20 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <FaPlus /> ADD
            </button>

            {/* CLOSE TABLE BUTTON (Specific Loader) */}
            <button
              onClick={onCloseTable}
              disabled={loading}
              className="w-10 h-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white cursor-pointer active:scale-90 transition-all disabled:opacity-50 disabled:pointer-events-none"
              title="Close Table"
            >
              {loadingOp === 'CLOSE_TABLE' ? <Loader variant="inline" className="w-4 h-4" /> : <FaPowerOff />}
            </button>
          </>
        )}

        {/* CLOSE DRAWER BUTTON */}
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/10 active:scale-90 transition-all"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
