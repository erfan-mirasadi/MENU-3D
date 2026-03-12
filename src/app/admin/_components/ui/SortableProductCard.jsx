"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDraggable } from "react-icons/ri";
import ProductCard from "./ProductCard";

export default function SortableProductCard({
  product,
  onEdit,
  defaultLang,
  isReorderMode,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled: !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isReorderMode ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
      {...(isReorderMode ? { ...attributes, ...listeners } : {})}
    >
      {isReorderMode && (
        <div className="absolute -top-1 right-2 z-20 w-9 h-9 rounded-xl bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/30 pointer-events-none">
          <RiDraggable size={20} />
        </div>
      )}

      {isReorderMode && (
        <div className="absolute -top-1 left-2 z-20 w-7 h-7 rounded-lg bg-dark-800 border border-gray-600 text-gray-300 flex items-center justify-center text-xs font-bold pointer-events-none">
          {product._sortIndex}
        </div>
      )}

      <div className={isReorderMode ? "pointer-events-none select-none" : ""}>
        <ProductCard
          product={product}
          onEdit={onEdit}
          defaultLang={defaultLang}
          hideActions={isReorderMode}
        />
      </div>
    </div>
  );
}
