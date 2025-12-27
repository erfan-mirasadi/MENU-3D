"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const current = availableLanguages.find((l) => l.code === language);
  if (availableLanguages.length <= 1) return null;

  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-white text-sm hover:bg-white/10 transition-all shadow-lg"
      >
        <span className="text-lg">{current?.flag}</span>
        <span className="uppercase font-bold tracking-wider">
          {current?.code}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-36 bg-[#252836] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] py-1 animate-in fade-in zoom-in-95 duration-200">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                  language === lang.code
                    ? "bg-white/5 text-[#ea7c69]"
                    : "text-gray-300"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-bold uppercase">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
