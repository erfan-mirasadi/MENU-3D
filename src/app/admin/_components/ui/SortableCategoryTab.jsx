"use client";
import Image from "next/image";
import { MdEditSquare } from "react-icons/md";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function CategoryImage({ url, title }) {
  return (
    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
      {url ? (
        <Image
          src={url}
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
  );
}

export function SortableCategoryTab({
  cat,
  isActive,
  onTabChange,
  onEditCategory,
  defaultLang,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const title = cat.title?.[defaultLang] || cat.title?.en || "Category";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTabChange(cat.id)}
      className={`group shrink-0 snap-start relative flex items-center gap-3 py-1.5 pl-1.5 pr-5 rounded-full border transition-all duration-300 select-none cursor-grab active:cursor-grabbing touch-none ${
        isActive
          ? "bg-dark-800 border-gray-500 text-white shadow-md pr-3"
          : "bg-dark-800/50 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
      }`}
    >
      <CategoryImage url={cat.image_url} title={title} />

      <span className="text-sm font-bold whitespace-nowrap">{title}</span>

      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(cat);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 text-gray-300 hover:bg-white hover:text-black transition-all ml-1 active:scale-90 cursor-pointer"
          title="Edit Category"
        >
          <MdEditSquare size={16} />
        </button>
      )}
    </div>
  );
}

export function CategoryOverlayItem({ cat, defaultLang }) {
  const title = cat.title?.[defaultLang] || cat.title?.en || "Category";

  return (
    <div className="shrink-0 flex items-center gap-3 py-1.5 pl-1.5 pr-5 rounded-full border bg-dark-800 border-primary text-white shadow-xl shadow-primary/20 opacity-90 scale-105 rotate-1">
      <CategoryImage url={cat.image_url} title={title} />
      <span className="text-sm font-bold whitespace-nowrap">{title}</span>
    </div>
  );
}
