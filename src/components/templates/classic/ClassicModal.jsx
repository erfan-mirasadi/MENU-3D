"use client";
import ARViewer from "@/components/ui/ARViewer";
import { useLanguage } from "@/context/LanguageContext";

export default function ClassicModal({ product, onClose, onAddToCart }) {
  const { content, t } = useLanguage();

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#2C1810]/60 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Card */}
      <div className="relative w-full max-w-lg bg-[#FDFBF7] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[#D4AF37]/20">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-[#2C1810] hover:text-red-500 transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Top: 3D/Media Area */}
          <div className="h-72 w-full bg-[#F0EEE6] relative border-b border-[#D4AF37]/20">
            {product.model_url || product.model_lowpoly_url ? (
              <ARViewer
                modelUrl={product.model_url || product.model_lowpoly_url}
                posterUrl={product.image_url}
                alt={content(product.title)}
              >
                <button
                  slot="ar-button"
                  className="absolute bottom-4 right-4 bg-[#D4AF37] text-white px-4 py-2 text-sm font-bold shadow-lg tracking-wider"
                >
                  VIEW IN AR
                </button>
              </ARViewer>
            ) : (
              <img
                src={product.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Bottom: Info */}
          <div className="p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-serif font-bold text-[#2C1810]">
                {content(product.title)}
              </h2>
              <span className="text-xl font-sans font-bold text-[#D4AF37]">
                {Number(product.price).toLocaleString()} ₺
              </span>
            </div>

            <div className="w-12 h-0.5 bg-[#D4AF37] mb-6"></div>

            <p className="text-[#5C504A] leading-loose font-serif italic mb-8">
              {content(product.description)}
            </p>

            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full py-4 bg-[#2C1810] text-[#D4AF37] text-lg font-bold uppercase tracking-widest hover:bg-[#3E2419] transition-colors shadow-lg"
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
