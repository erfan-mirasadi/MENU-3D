"use client";
import { useState, useCallback, useRef } from "react";
import { RiAddLine, RiFireFill } from "react-icons/ri";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { updateCategorySortOrders } from "@/services/categoryService";
import toast from "react-hot-toast";
import {
  SortableCategoryTab,
  CategoryOverlayItem,
} from "./SortableCategoryTab";

export default function CategoryTabs({
  categories,
  activeTab,
  onTabChange,
  onEditCategory,
  onAddCategory,
  defaultLang = "en",
}) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [activeId, setActiveId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDraggingRef = useRef(false);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 6 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const activeCategory = activeId
    ? localCategories.find((c) => c.id === activeId)
    : null;

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    async (event) => {
      setActiveId(null);
      const didDrag = isDraggingRef.current;
      isDraggingRef.current = false;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localCategories.findIndex((c) => c.id === active.id);
      const newIndex = localCategories.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(reordered);

      // Save immediately
      setIsSaving(true);
      try {
        const updates = reordered.map((c, i) => ({
          id: c.id,
          sort_order: i + 1,
        }));
        await updateCategorySortOrders(updates);
        toast.success("Category order saved!");
      } catch {
        // Revert on error
        setLocalCategories(categories);
        toast.error("Failed to save category order");
      } finally {
        setIsSaving(false);
      }
    },
    [localCategories, categories],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    isDraggingRef.current = false;
  }, []);

  return (
    <div className="w-full relative">
      {isSaving && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-dark-900/50 rounded-lg">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={localCategories.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar pl-4 pr-4 sm:px-0 snap-x snap-mandatory scroll-pl-4">
            {/* 'All' Tab */}
            <button
              onClick={() => onTabChange("all")}
              className={`shrink-0 snap-start flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 font-bold text-sm border-2 ${
                activeTab === "all"
                  ? "bg-dark-800 border-white text-white shadow-lg shadow-white/5"
                  : "bg-dark-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              <RiFireFill
                size={18}
                className={activeTab === "all" ? "text-white" : "text-gray-500"}
              />
              All Items
            </button>

            {/* Sortable Categories */}
            {localCategories.map((cat) => (
              <SortableCategoryTab
                key={cat.id}
                cat={cat}
                isActive={activeTab === cat.id}
                onTabChange={onTabChange}
                onEditCategory={onEditCategory}
                defaultLang={defaultLang}
              />
            ))}

            {/* Add Category Button */}
            <button
              onClick={onAddCategory}
              className="shrink-0 snap-start w-11 h-11 rounded-full border border-dashed border-gray-600 bg-dark-800/30 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary hover:bg-dark-800 transition-all active:scale-95 ml-1"
              title="Add New Category"
            >
              <RiAddLine size={22} />
            </button>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeCategory ? (
            <CategoryOverlayItem
              cat={activeCategory}
              defaultLang={defaultLang}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
