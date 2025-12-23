// src/app/admin/_components/ui/CategoryTabs.jsx
"use client";
import Image from "next/image";
import { RiAddLine, RiFireFill } from "react-icons/ri";
import { MdEditSquare } from "react-icons/md";

export default function CategoryTabs({
  categories,
  activeTab,
  onTabChange,
  onEditCategory,
  onAddCategory,
  defaultLang = "en",
}) {
  return (
    <div className="w-full mb-2">
      {/* 1. pl-4: فاصله از سمت چپ برای شروع لیست
         2. pr-4: فاصله از سمت راست برای پایان لیست
      */}
      <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar pl-4 pr-4 sm:px-0 snap-x snap-mandatory scroll-pl-4">
        {/* 'All' Tab - Styled like the screenshot (Outline) */}
        <button
          onClick={() => onTabChange("all")}
          className={`shrink-0 snap-start flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 font-bold text-sm border-2 ${
            activeTab === "all"
              ? "bg-dark-800 border-white text-white shadow-lg shadow-white/5" // Active: Dark bg + White Border
              : "bg-dark-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white" // Inactive
          }`}
        >
          <RiFireFill
            size={18}
            className={activeTab === "all" ? "text-white" : "text-gray-500"}
          />
          All Items
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isActive = activeTab === cat.id;
          const title = cat.title?.[defaultLang] || cat.title?.en || "Category";

          return (
            <div
              key={cat.id}
              onClick={() => onTabChange(cat.id)}
              className={`group shrink-0 snap-start relative flex items-center gap-3 py-1.5 pl-1.5 pr-5 rounded-full border transition-all duration-300 select-none ${
                isActive
                  ? "bg-dark-800 border-gray-500 text-white shadow-md pr-3"
                  : "bg-dark-800/50 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
              }`}
            >
              {/* Category Image */}
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700 text-[10px] text-gray-500">
                    N/A
                  </div>
                )}
              </div>

              {/* Title */}
              <span className="text-sm font-bold whitespace-nowrap">
                {title}
              </span>

              {/* Edit Button */}
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(cat);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 text-gray-300 hover:bg-white hover:text-black transition-all ml-1 active:scale-90 cursor-pointer"
                  title="Edit Category"
                >
                  <MdEditSquare size={16} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Category Button */}
        <button
          onClick={onAddCategory}
          className="shrink-0 snap-start w-11 h-11 rounded-full border border-dashed border-gray-600 bg-dark-800/30 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary hover:bg-dark-800 transition-all active:scale-95 ml-1"
          title="Add New Category"
        >
          <RiAddLine size={22} />
        </button>
      </div>
    </div>
  );
}
