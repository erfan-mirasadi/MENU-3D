"use client";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function MinimalHeader({
  restaurant,
  categories,
  activeCategory,
  setActiveCategory,
}) {
  const { content } = useLanguage();
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 pt-4 pb-2 px-3">
      {/* Brand - Mobile Only */}
      <div className="px-6 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Categories - Pill Design */}
      <div className="relative w-full">
        {/* Scrollable Area - Added 'px-6' to container so items don't stick to edge */}
        <div className="flex overflow-x-auto gap-3 px-6 pb-2 no-scrollbar snap-x items-center">
          {categories?.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`snap-start shrink-0 px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 border ${
                  isActive
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black"
                }`}
              >
                {content(cat.title)}
              </button>
            );
          })}
          {/* Spacer to ensure last item has breathing room */}
          <div className="w-2 shrink-0" />
        </div>

        {/* Fade Indicator (Right side) */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-linear-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
