"use client";
import SmartMedia from "@/components/ui/SmartMedia";
import { useLanguage } from "@/context/LanguageContext";

export default function ClassicRow({ product, onClick, onAdd }) {
  const { content, t } = useLanguage();
  return (
    <div className="group relative flex items-center justify-between py-6 border-b border-[#E5E0D8] last:border-0">
      {/* Click Area for Details */}
      <div
        onClick={onClick}
        className="flex-1 flex items-start gap-4 cursor-pointer pr-4"
      >
        {/* Left: Text */}
        <div className="flex-1">
          <div className="flex flex-col mb-2">
            <h3 className="text-xl font-bold text-[#2C1810] group-hover:text-[#D4AF37] transition-colors duration-300">
              {content(product.title)}
            </h3>
            <span className="text-[#D4AF37] font-bold font-sans mt-1">
              {Number(product.price).toLocaleString()} {t("currency")}
            </span>
          </div>
          <p className="text-sm text-[#8A7E72] line-clamp-2 leading-relaxed font-light italic">
            {content(product.description)}
          </p>
        </div>

        {/* Right: Image/Video in Circle */}
        <div className="relative w-24 h-24 shrink-0">
          {/* Gold Ring */}
          <div className="absolute -inset-1 border border-[#D4AF37]/30 rounded-full scale-90 group-hover:scale-100 transition-transform duration-500"></div>

          <div className="relative w-full h-full rounded-full overflow-hidden shadow-md bg-[#F0EEE6]">
            <SmartMedia
              files={{
                image_url: product.image_url,
                animation_url_ios: product.animation_url_ios,
                animation_url_android: product.animation_url_android,
              }}
              alt={content(product.title)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Add Button (Minimal) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="absolute bottom-6 right-28 bg-[#2C1810] text-[#D4AF37] w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg z-10"
      >
        +
      </button>
    </div>
  );
}
