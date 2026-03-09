"use client";
import { useState } from "react";
import Loader from "./Loader";
import SmartMedia from "@/components/ui/SmartMedia";

export default function ProductCard({ product, onEdit, defaultLang = "en" }) {
  const [isLoading, setIsLoading] = useState(false);
  const title =
    product.title?.[defaultLang] || product.title?.en || "Unnamed Product";

  const rawDesc =
    product.description?.[defaultLang] || product.description?.en || "";
  const shortDesc =
    rawDesc.split(" ").slice(0, 3).join(" ") +
    (rawDesc.split(" ").length > 3 ? "..." : "");

  const mediaFiles = {
    image_url: product.image_url || null,
    animation_url_ios: product.animation_url_ios || null,
    animation_url_android: product.animation_url_android || null,
  };

  const handleEditClick = () => {
    setIsLoading(true);
    onEdit(product);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="bg-dark-900 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative mt-10 border border-gray-800 hover:border-primary/50 transition-colors h-full group">
      <div className="absolute -top-13 w-38 h-38 rounded-full shadow-2xl shadow-black/50 overflow-hidden z-10 transition-transform group-hover:scale-105 duration-300">
        <SmartMedia
          files={mediaFiles}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-24 w-full flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-white font-bold text-xl leading-tight line-clamp-2 min-h-8">
          {title}
        </h3>

        {/* Short Description (3 Words) */}
        <p className="text-gray-500 text-xs min-h-8">{shortDesc}</p>

        {/* Price - Bigger & Bolder */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-primary font-extrabold text-3xl mt-2 -mb-1">
            {product.price} <span className="text-lg">₺</span>
          </span>

          {/* Original Price */}
          {product.original_price && (
            <span className="text-gray-600 line-through text-md decoration-gray-500">
              {product.original_price}
              <span className="text-xs">₺</span>
            </span>
          )}
        </div>
      </div>

      {/* Edit Button - Animated & With Loading */}
      <button
        onClick={handleEditClick}
        disabled={isLoading}
        className="mt-auto w-full py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-90 disabled:opacity-70 disabled:cursor-not-allowed border border-gray-700"
      >
        {isLoading ? (
          <Loader size="small" className="text-current" />
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </>
        )}
      </button>
    </div>
  );
}
