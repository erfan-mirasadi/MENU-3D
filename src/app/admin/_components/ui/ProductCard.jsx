"use client";
import { useState } from "react";
import Loader from "./Loader"; // Importing the reusable Loader component
import SmartMedia from "@/components/ui/SmartMedia";

export default function ProductCard({ product, onEdit, defaultLang = "en" }) {
  const [isLoading, setIsLoading] = useState(false);

  // 1. Language Logic: Prioritize defaultLang, fallback to 'en'
  const title =
    product.title?.[defaultLang] || product.title?.en || "Unnamed Product";

  // 2. Description Logic: Get text -> split to words -> take first 3 -> join back
  const rawDesc =
    product.description?.[defaultLang] || product.description?.en || "";
  const shortDesc =
    rawDesc.split(" ").slice(0, 3).join(" ") +
    (rawDesc.split(" ").length > 3 ? "..." : "");

  // Prepare media files
  const mediaFiles = {
    image_url: product.image_url || "/placeholder-food.png",
    animation_url_ios: product.animation_url_ios || null,
    animation_url_android: product.animation_url_android || null,
  };

  const handleEditClick = () => {
    setIsLoading(true);
    onEdit(product);
    // Reset loading after a delay (failsafe) or let parent handle unmount
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="bg-dark-900 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative mt-10 border border-gray-800 hover:border-primary/50 transition-colors h-full group">
      {/* Media Display - Cleaner Look (No heavy borders/bg) */}
      <div className="absolute -top-12 w-32 h-32 rounded-full shadow-2xl shadow-black/50 overflow-hidden z-10 transition-transform group-hover:scale-105 duration-300">
        <SmartMedia
          files={mediaFiles}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-20 w-full flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-white font-bold text-xl leading-tight mb-2 line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>

        {/* Short Description (3 Words) */}
        <p className="text-gray-500 text-xs mb-3 min-h-[1.5rem]">{shortDesc}</p>

        {/* Price - Bigger & Bolder */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-primary font-extrabold text-2xl">
            {product.price} <span className="text-lg">₺</span>
          </span>

          {/* Original Price */}
          {product.original_price && (
            <span className="text-gray-600 line-through text-sm decoration-gray-500">
              {product.original_price}
            </span>
          )}
        </div>
      </div>

      {/* Edit Button - Animated & With Loading */}
      <button
        onClick={handleEditClick}
        disabled={isLoading}
        className="mt-auto w-full py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
