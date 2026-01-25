import { FaPowerOff } from "react-icons/fa";
import Loader from "@/components/ui/Loader";
import { useLanguage } from "@/context/LanguageContext";

export default function DrawerEmptyState({ onStartSession, loading }) {
  const { t } = useLanguage();

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6">
      <div className="w-32 h-32 rounded-full bg-[#252836] flex items-center justify-center animate-pulse">
        <FaPowerOff className="text-4xl text-gray-500" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-white">{t('tableEmpty')}</h3>
        <p className="text-gray-500">{t('noActiveSession')}</p>
      </div>
      <button
        onClick={onStartSession}
        disabled={loading}
        className="px-8 py-4 bg-[#ea7c69] hover:bg-[#d96b58] text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 active:scale-95 transition-transform flex items-center justify-center min-w-[200px] cursor-pointer"
      >
        {loading ? <Loader variant="inline" className="w-6 h-6" /> : t('startSession')}
      </button>
    </div>
  );
}
