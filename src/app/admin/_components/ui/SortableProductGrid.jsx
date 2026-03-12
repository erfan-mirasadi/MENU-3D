"use client";
import { useState, useCallback, useMemo, useRef } from "react";
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
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableProductCard from "./SortableProductCard";
import ProductCard from "./ProductCard";
import { updateProductSortOrders } from "@/services/productService";
import toast from "react-hot-toast";
import { RiArrowGoBackLine, RiCheckLine, RiDraggable } from "react-icons/ri";
import Loader from "./Loader";

export default function SortableProductGrid({
  products,
  activeTab,
  onEdit,
  defaultLang,
  children,
}) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const originalOrderRef = useRef([]);

  // Filter products by active category
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    return products.filter((p) => p.category_id === activeTab);
  }, [activeTab, products]);

  // The displayed items: either reorder-mode state or normal
  const displayedProducts = useMemo(() => {
    if (!isReorderMode) return filteredProducts;
    return orderedProducts.map((p, i) => ({ ...p, _sortIndex: i + 1 }));
  }, [isReorderMode, orderedProducts, filteredProducts]);

  const activeProduct = useMemo(
    () => displayedProducts.find((p) => p.id === activeId),
    [activeId, displayedProducts],
  );

  // Sensors with activation constraints to prevent accidental drags
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 6 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const enterReorderMode = useCallback(() => {
    const sorted = [...filteredProducts].sort((a, b) => {
      const aOrder = a.sort_order ?? Infinity;
      const bOrder = b.sort_order ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    setOrderedProducts(sorted);
    originalOrderRef.current = sorted.map((p) => p.id);
    setIsReorderMode(true);
  }, [filteredProducts]);

  const cancelReorder = useCallback(() => {
    setIsReorderMode(false);
    setOrderedProducts([]);
    setActiveId(null);
  }, []);

  const saveOrder = useCallback(async () => {
    setIsSaving(true);
    try {
      const updates = orderedProducts.map((p, index) => ({
        id: p.id,
        sort_order: index + 1,
      }));

      await updateProductSortOrders(updates);
      toast.success("Product order saved!");
      // Soft reload to get fresh data
      window.location.reload();
    } catch {
      toast.error("Failed to save order");
    } finally {
      setIsSaving(false);
    }
  }, [orderedProducts]);

  const hasChanges = useMemo(() => {
    if (!isReorderMode) return false;
    const currentIds = orderedProducts.map((p) => p.id);
    return (
      JSON.stringify(currentIds) !== JSON.stringify(originalOrderRef.current)
    );
  }, [isReorderMode, orderedProducts]);

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedProducts((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Reorder mode disabled when "all" tab is selected
  const canReorder = activeTab !== "all" && filteredProducts.length > 1;

  return (
    <div className="flex flex-col h-full relative">
      {/* Full-screen saving overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/75 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      {/* Reorder Controls Bar */}
      {canReorder && (
        <div className="px-4 sm:px-8 pb-2 flex items-center justify-end gap-2">
          {!isReorderMode ? (
            <button
              onClick={enterReorderMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 border border-gray-700 text-gray-300 text-sm font-medium hover:border-primary hover:text-primary transition-all active:scale-95"
            >
              <RiDraggable size={16} />
              Reorder
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelReorder}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 border border-gray-700 text-gray-400 text-sm font-medium hover:text-white hover:border-gray-500 transition-all active:scale-95 disabled:opacity-50"
              >
                <RiArrowGoBackLine size={15} />
                Cancel
              </button>
              <button
                onClick={saveOrder}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RiCheckLine size={16} />
                )}
                {isSaving ? "Saving..." : "Save Order"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-20">
        {isReorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={displayedProducts.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-18 pt-3 pb-15">
                {displayedProducts.map((product) => (
                  <SortableProductCard
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    defaultLang={defaultLang}
                    isReorderMode={true}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay adjustScale={false} dropAnimation={null}>
              {activeProduct ? (
                <div className="opacity-90 scale-105 rotate-2 pointer-events-none">
                  <ProductCard
                    product={activeProduct}
                    onEdit={() => {}}
                    defaultLang={defaultLang}
                    hideActions={true}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-18 pt-3 pb-15">
            {/* Add Card - only in normal mode */}
            {children}

            {/* Products */}
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={onEdit}
                defaultLang={defaultLang}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
