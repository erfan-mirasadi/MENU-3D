"use client";

import { useState } from "react";
import ImmersiveHeader from "./ImmersiveHeader";
import ImmersiveCard from "./ImmersiveCard";
import ImmersiveCartBar from "./ImmersiveCartBar";
import ImmersiveModal from "./ImmersiveModal";
import ImmersiveCartDrawer from "./ImmersiveCartDrawer";
import { useCart } from "@/app/hooks/useCart";

export default function ImmersiveMenu({ restaurant, categories, tableId }) {
  const { cartItems, addToCart, removeFromCart, submitOrder, isLoading, sessionData } =
    useCart(tableId, restaurant.id);
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.unit_price_at_order * item.quantity,
    0
  );

  return (
    <div className="min-h-screen pb-32 bg-[#050505]">
      <ImmersiveHeader
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <div className="px-5 max-w-5xl mx-auto space-y-8 mt-2">
        {categories?.map((cat) => {
          if (activeCategory !== cat.id) return null;
          return (
            <div
              key={cat.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Category Title - Added padding top so it doesn't stick to header */}
              <div className="flex items-end gap-4 mb-6 px-2 pt-20 -mt-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40 tracking-tighter">
                  {typeof cat.title === "object" ? cat.title.en : cat.title}
                </h2>
                <div className="h-px bg-white/10 flex-1 mb-2"></div>
              </div>

              {/* Grid - Reduced Gap */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                {cat.products?.map((product) => (
                  <ImmersiveCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Bar - Fixed Position */}
      {totalCount > 0 && (
        <ImmersiveCartBar
          totalCount={totalCount}
          totalAmount={totalAmount}
          onClick={() => setIsCartOpen(true)}
        />
      )}

      <ImmersiveModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <ImmersiveCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onSubmit={submitOrder}
        session={sessionData}
      />
    </div>
  );
}
