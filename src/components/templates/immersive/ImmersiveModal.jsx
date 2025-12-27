"use client";
import ARViewer from "@/components/ui/ARViewer";
import { useLanguage } from "@/context/LanguageContext";

export default function ImmersiveModal({ product, onClose, onAddToCart }) {
  const { content, t } = useLanguage();

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0f0f0f]/80 backdrop-blur-xl transition-opacity duration-500"
      ></div>

      {/* Content */}
      <div className="relative w-full max-w-md z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
        {/* Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/30 rounded-full blur-[80px] animate-pulse"></div>

        {/* 3D Viewer */}
        <div className="w-full h-80 relative mb-8">
          {product.model_url || product.model_lowpoly_url ? (
            <ARViewer
              modelUrl={product.model_url || product.model_lowpoly_url}
              posterUrl={product.image_url}
              alt={content(product.title)}
            >
              <button
                slot="ar-button"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                {t("viewInAR")}
              </button>
            </ARViewer>
          ) : (
            <img
              src={product.image_url}
              className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
          )}
        </div>

        {/* Info Card */}
        <div className="w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 text-center">
          <h2 className="text-3xl font-black text-white mb-2">
            {content(product.title)}
          </h2>
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-6">
            {Number(product.price).toLocaleString()} {t("currency")}
          </div>

          <p className="text-white/70 font-light leading-relaxed mb-8">
            {content(product.description)}
          </p>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="w-full py-4 bg-white text-black font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
          >
            Add to Cart
          </button>

          <button
            onClick={onClose}
            className="mt-4 text-white/30 text-sm hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
