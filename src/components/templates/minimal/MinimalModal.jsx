"use client";
import ARViewer from "@/components/ui/ARViewer";
import { useLanguage } from "@/context/LanguageContext";

export default function MinimalModal({ product, onClose, onAddToCart }) {
  const { content, t } = useLanguage();

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-white/80 backdrop-grayscale transition-opacity duration-500"
      ></div>

      {/* Panel */}
      <div className="relative w-full md:w-[600px] h-full bg-white border-l-2 border-black shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 flex flex-col">
        {/* Close Btn */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 z-50 bg-black text-white w-16 h-16 flex items-center justify-center text-xl hover:bg-gray-800"
        >
          ✕
        </button>

        {/* Media */}
        <div className="w-full aspect-square bg-gray-50 border-b-2 border-black relative">
          {product.model_url || product.model_lowpoly_url ? (
            <ARViewer
              modelUrl={product.model_url || product.model_lowpoly_url}
              posterUrl={product.image_url}
              alt={content(product.title)}
            >
              <button
                slot="ar-button"
                className="absolute bottom-6 left-6 bg-black text-white px-6 py-3 font-bold uppercase text-sm border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-colors"
              >
                View in AR
              </button>
            </ARViewer>
          ) : (
            <img
              src={product.image_url}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 flex-1 flex flex-col">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-4xl font-black uppercase leading-none w-3/4">
              {content(product.title)}
            </h2>
            <span className="text-2xl font-mono font-bold">
              {Number(product.price).toLocaleString()} ₺
            </span>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed mb-12 flex-1">
            {content(product.description)}
          </p>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="w-full bg-black text-white py-6 text-xl font-bold uppercase hover:bg-white hover:text-black border-2 border-black transition-all"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
