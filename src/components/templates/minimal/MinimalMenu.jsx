"use client";

import { useState } from "react";
import MinimalHeader from "./MinimalHeader";
import MinimalCard from "./MinimalCard";
import MinimalCartDrawer from "./MinimalCartDrawer";
import MinimalModal from "./MinimalModal";
import { useCart } from "@/app/hooks/useCart";

export default function MinimalMenu({ restaurant, categories, tableId }) {
  const { cartItems, addToCart, removeFromCart, submitOrder, isLoading } =
    useCart(tableId, restaurant.id);
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white pb-32">
      <MinimalHeader
        restaurant={restaurant}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <div className="px-6 mt-8 max-w-6xl mx-auto">
        {categories?.map((cat) => {
          if (activeCategory !== cat.id) return null;
          return (
            <div
              key={cat.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Category Header */}
              <div className="mb-8 flex items-end justify-between border-b-2 border-black pb-2 sticky top-[70px] z-30 bg-white/90 backdrop-blur-sm pt-2">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                  {typeof cat.title === "object" ? cat.title.en : cat.title}
                </h2>
                <span className="text-xs font-mono font-bold bg-black text-white px-2 py-1 rounded-sm">
                  {cat.products?.length}
                </span>
              </div>

              {/* Grid with STRETCH items */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 auto-rows-fr">
                {cat.products?.map((product) => (
                  <MinimalCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </div>

              <div className="h-10"></div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {totalCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 bg-black text-white w-16 h-16 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-white outline outline-2 outline-black flex flex-col items-center justify-center transition-all z-50"
        >
          <span className="text-xl font-black">{totalCount}</span>
          <span className="text-[8px] uppercase font-bold tracking-widest">
            BAG
          </span>
        </button>
      )}

      {/* Modal & Drawer */}
      <MinimalModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <MinimalCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onSubmit={submitOrder}
      />
    </div>
  );
}
