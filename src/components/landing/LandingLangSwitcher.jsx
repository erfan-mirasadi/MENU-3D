"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiEarthLine, RiCheckLine } from "react-icons/ri";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
];

export default function LandingLangSwitcher({ currentLang }) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleChange = (code) => {
    setShowMenu(false);
    router.push(`/${code}`);
  };

  return (
    <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-full border border-white/10 text-text-dim hover:text-white transition-all shadow-lg"
        >
          <RiEarthLine size={18} className="text-accent" />
          <span className="font-medium text-sm">
            {LANGUAGES.find((l) => l.code === currentLang)?.label}
          </span>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-dark-800 border border-dark-600 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleChange(l.code)}
                className="w-full text-left px-4 py-3 text-sm text-text-dim hover:text-white hover:bg-dark-700 transition-colors flex items-center justify-between"
              >
                {l.label}
                {currentLang === l.code && (
                  <RiCheckLine className="text-accent" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
