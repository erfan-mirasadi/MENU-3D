import { RiCloseLine, RiCheckLine, RiLoader4Line } from "react-icons/ri";
export default function AdjustmentModal({
  show,
  onClose,
  adjData,
  setAdjData,
  adjLoading,
  handleAddAdjustment,
  t,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-900 w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-dark-800/50">
          <h3 className="text-white font-bold">{t("addAdjTitle")}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <RiCloseLine size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type Switch */}
          <div className="flex bg-dark-900 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setAdjData({ ...adjData, type: "charge" })}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${adjData.type === "charge" ? "bg-red-500/20 text-red-500 shadow-sm" : "text-gray-400 hover:text-white"}`}
            >
              + {t("extraCharge")}
            </button>
            <button
              onClick={() => setAdjData({ ...adjData, type: "discount" })}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${adjData.type === "discount" ? "bg-green-500/20 text-green-500 shadow-sm" : "text-gray-400 hover:text-white"}`}
            >
              - {t("discount")}
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              {t("description")}
            </label>
            <input
              type="text"
              placeholder={
                adjData.type === "charge"
                  ? t("descPlaceholder")
                  : t("descPlaceholder")
              }
              value={adjData.title}
              onChange={(e) =>
                setAdjData({ ...adjData, title: e.target.value })
              }
              autoComplete="off"
              className="w-full bg-dark-900 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none transition-colors"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              {t("amountLabel")} (
              {adjData.type === "charge" ? t("extraCharge") : t("discount")})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                ₺
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={adjData.amount}
                onChange={(e) =>
                  setAdjData({ ...adjData, amount: e.target.value })
                }
                className="w-full bg-dark-900 border border-white/10 rounded-xl p-3 pl-8 text-white font-bold text-lg focus:border-accent outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleAddAdjustment}
            disabled={adjLoading}
            className="w-full bg-accent hover:bg-[#d96a56] text-white py-3 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {adjLoading ? (
              <RiLoader4Line className="animate-spin" />
            ) : (
              <RiCheckLine />
            )}
            {t("applyAdjustment")}
          </button>
        </div>
      </div>
    </div>
  );
}
