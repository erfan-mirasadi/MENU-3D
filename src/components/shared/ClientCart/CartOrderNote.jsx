import { MdOutlineMessage } from "react-icons/md";

export default function CartOrderNote({ t, note, setNote }) {
  return (
    <div className="pt-6 border-t border-white/10 mx-1">
      <label className="text-accent text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
        <MdOutlineMessage size={18} />
        {t("orderNote")}
      </label>
      <textarea
        className="w-full bg-dark-800 border border-white/20 rounded-xl p-4 text-white text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-white/30 resize-none transition-all shadow-inner"
        rows={3}
        placeholder={t("notePlaceholder") || "Allergies, extra spicy, etc..."}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}
