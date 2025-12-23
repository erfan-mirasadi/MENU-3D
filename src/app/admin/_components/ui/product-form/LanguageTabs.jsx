// src/app/admin/_components/ui/product-form/LanguageTabs.jsx
import { RiTranslate2 } from "react-icons/ri";

export default function LanguageTabs({
  supportedLanguages,
  activeLang,
  setActiveLang,
  formData,
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <RiTranslate2 /> Language Support
      </label>
      <div className="bg-dark-800 p-1.5 rounded-xl flex gap-2 border border-gray-700 overflow-x-auto no-scrollbar">
        {supportedLanguages.map((lang) => {
          const isFilled =
            formData.title[lang] && formData.title[lang].length > 0;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`flex-1 min-w-[70px] py-2.5 text-sm font-bold rounded-lg transition-all relative ${
                activeLang === lang
                  ? "bg-primary text-white shadow-lg border-2 border-white scale-[1.02]"
                  : "text-gray-400 hover:text-white hover:bg-gray-700 border-2 border-transparent"
              }`}
            >
              {lang.toUpperCase()}
              {isFilled && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
