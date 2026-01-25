import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaPowerOff, FaPen, FaSave } from "react-icons/fa";
import { LuArrowRightLeft } from "react-icons/lu";
import Loader from "@/components/ui/Loader";
import { updateSessionNote } from "@/services/sessionService";
import { useLanguage } from "@/context/LanguageContext";

export default function DrawerHeader({
  table,
  session,
  onClose,
  onOpenMenu,
  onCloseTable,
  onTransfer,
  loading,
  loadingOp
}) {
  const { t } = useLanguage();

  return (
    <div className="p-4 bg-[#252836] border-b border-white/5 flex flex-col gap-4 shadow-md z-10 shrink-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {t('table')} <span className="text-[#ea7c69]">{table.table_number}</span>
          </h2>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              session
                ? "bg-green-500/10 text-green-400"
                : "bg-gray-500/10 text-gray-400"
            }`}
          >
            {session ? t('active') : t('closed')}
          </span>
        </div>

        <div className="flex gap-2">
          {session && (
            <>
              {/* ADD ITEM BUTTON */}
              <button
                onClick={onOpenMenu}
                disabled={loading}
                className="h-10 px-4 bg-[#ea7c69] text-white rounded-lg flex items-center gap-2 font-bold text-sm shadow-lg shadow-orange-900/20 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <FaPlus /> {t('add')}
              </button>

              {/* TRANSFER BUTTON */}
              <button
                 onClick={onTransfer}
                 disabled={loading}
                 className="w-10 h-10 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:text-white cursor-pointer active:scale-90 transition-all disabled:opacity-50 disabled:pointer-events-none"
                 title={t('transferTable')}
              >
                 <LuArrowRightLeft />
              </button>

              {/* CLOSE TABLE BUTTON */}
              <button
                onClick={onCloseTable}
                disabled={loading}
                className="w-10 h-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white cursor-pointer active:scale-90 transition-all disabled:opacity-50 disabled:pointer-events-none"
                title={t('closeTable')}
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

      {/* SESSION NOTE SECTION */}
      {session && (
        <NoteSection session={session} />
      )}
    </div>
  );
}

function NoteSection({ session }) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setNoteText(session?.note || "");
  }, [session?.note]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSessionNote(session.id, noteText);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-yellow-500 text-xs font-bold uppercase tracking-wider">{t('editingNote')}</span>
          <div className="flex gap-2">
             <button 
               onClick={() => setIsEditing(false)}
               className="text-xs text-white/40 hover:text-white"
             >
               {t('cancel')}
             </button>
             <button 
               onClick={handleSave}
               disabled={saving}
               className="flex items-center gap-1 text-xs bg-yellow-500 text-black px-2 py-1 rounded font-bold hover:bg-yellow-400 disabled:opacity-50"
             >
               {saving ? t('saving') : <><FaSave /> {t('save')}</>}
             </button>
          </div>
        </div>
        <textarea
          autoFocus
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none"
          rows={3}
          placeholder={t('addNotePlaceholder')}
        />
      </div>
    );
  }

  return (
    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3 relative group">
       <div className="flex justify-between items-start">
          <div>
            <span className="text-yellow-500/50 text-[10px] font-bold uppercase tracking-wider block mb-1">
              {t('tableNote')}
            </span>
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {session.note || <span className="text-white/20 italic">{t('noNotes')}</span>}
            </p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-white/30 hover:text-yellow-500 transition-colors p-1"
          >
            <FaPen size={12} />
          </button>
       </div>
    </div>
  );
}
