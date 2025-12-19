"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

// Load 3D viewer dynamically
const ThreeDViewer = dynamic(() => import("@/components/ui/ThreeDViewer"), {
  ssr: false,
});

const getTitle = (obj) => {
  if (!obj) return "";
  return typeof obj === "object"
    ? obj["en"] || obj["tr"] || Object.values(obj)[0]
    : obj;
};

export default function ProductModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-[#252836] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] relative z-10 border-t border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Media Section */}
        <div className="h-80 relative group bg-[#1a1c25] w-full">
          {product.model_url ? (
            <div className="w-full h-full">
              {/* REUSABLE COMPONENT */}
              <ThreeDViewer
                src={product.model_url || product.model_lowpoly_url}
                poster={product.image_url}
                alt={getTitle(product.title)}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="auto"
                ar-placement="floor"
              >
                <button
                  slot="ar-button"
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#ea7c69] text-white h-12 px-8 rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95 transition-all z-50 cursor-pointer border border-white/20"
                >
                  <span className="text-xl">📦</span>
                  <span className="whitespace-nowrap text-sm font-bold tracking-wide">
                    Show on Table
                  </span>
                </button>
              </ThreeDViewer>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={product.image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-cover"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#252836] via-transparent to-transparent pointer-events-none"></div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 bg-black/40 text-white w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center hover:bg-[#ea7c69] transition-colors border border-white/10 z-50 shadow-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Section (بدون تغییر) */}
        <div className="p-8 -mt-12 relative pointer-events-none">
          <div className="pointer-events-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-3xl font-black leading-tight w-3/4">
                {getTitle(product.title)}
              </h3>
              <div className="bg-[#ea7c69] px-3 py-1.5 rounded-xl shadow-lg shadow-orange-900/30">
                <p className="text-white font-bold text-lg">
                  {Number(product.price).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-10 leading-relaxed font-light">
              {getTitle(product.description)}
            </p>

            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full bg-[#ea7c69] hover:bg-[#ff8f7d] py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-orange-900/40 active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
