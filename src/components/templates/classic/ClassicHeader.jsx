"use client";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function ClassicHeader({
  restaurant,
  categories,
  activeCategory,
  setActiveCategory,
}) {
  const { content } = useLanguage();
  return (
    <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-[#D4AF37]/20 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-bold text-[#2C1810] tracking-wider">
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
        </div>
      </div>

      {/* Categories Scroller */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex px-6 gap-8 min-w-max">
          {categories?.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative py-3 transition-colors duration-300 ${
                  isActive
                    ? "text-[#2C1810]"
                    : "text-[#8A7E72] hover:text-[#2C1810]"
                }`}
              >
                <span
                  className={`text-lg font-serif ${
                    isActive ? "font-bold italic" : "font-medium"
                  }`}
                >
                  {content(cat.title)}
                </span>

                {/* Active Indicator (Underline) */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
