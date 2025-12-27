"use client";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function ImmersiveHeader({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  const { content } = useLanguage();
  return (
    <div className="sticky top-4 z-40 px-4">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex overflow-x-auto no-scrollbar gap-2 snap-x">
        {categories?.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`snap-start shrink-0 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-500 relative overflow-hidden ${
                isActive
                  ? "text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              {/* Active Background Gradient */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 -z-10"></div>
              )}
              {content(cat.title)}
            </button>
          );
        })}
      </div>
      {/* Language Switcher */}
      <div className="absolute top-18 right-6">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
