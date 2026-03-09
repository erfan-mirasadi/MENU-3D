import { MdOutlineMessage } from "react-icons/md";

export default function CartOrderNote({ t, note, setNote }) {
  return (
    <div className="pt-6 border-t border-white/10 mx-1">
      <label className="text-[#ea7c69] text-xs font-bold uppercase tracking-widest mb-3 block flex items-center gap-2">
        <MdOutlineMessage size={18} />
        {t("orderNote")}
      </label>
      <textarea
        className="w-full bg-[#252836] border border-white/20 rounded-xl p-4 text-white text-base focus:outline-none focus:border-[#ea7c69] focus:ring-1 focus:ring-[#ea7c69] placeholder:text-white/30 resize-none transition-all shadow-inner"
        rows={3}
        placeholder={t("notePlaceholder") || "Allergies, extra spicy, etc..."}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}
