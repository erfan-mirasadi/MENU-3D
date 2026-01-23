"use client";

import { useState } from "react";
import ModernCard from "./ModernCard";
import ModernHeader from "./ModernHeader";
import ModernCart from "./ModernCart";
import ModernModal from "./ModernModal";
import ModernCartDrawer from "./ModernCartDrawer";
import { useCart } from "@/app/hooks/useCart";

export default function ModernMenu({ restaurant, categories, tableId }) {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    submitOrder,
    isLoading: isLoadingCart,
    sessionData,
  } = useCart(tableId, restaurant.id);

  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + item.unit_price_at_order * item.quantity;
  }, 0);

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#1F1D2B] font-sans pb-24 text-gray-100 selection:bg-[#ea7c69] selection:text-white overflow-x-hidden">
      <ModernHeader
        restaurant={restaurant}
        tableId={tableId}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <div className="p-4 pt-2 min-h-[60vh]">
        {categories?.map((cat) => {
          if (activeCategory !== cat.id) return null;
          return (
            <div
              key={cat.id}
              className="animate-in fade-in zoom-in-95 duration-500"
            >
              <div className="flex items-center gap-4 mb-6 opacity-50">
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                  Menu
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                {cat.products?.map((product) => (
                  <ModernCard
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

      {/* دکمه شناور پایین */}
      <ModernCart
        totalAmount={totalAmount}
        totalCount={totalCount}
        isLoading={isLoadingCart}
        onClick={() => setIsCartOpen(true)} // <--- 3. Open Modal
      />

      {/* مودال دیتیل محصول */}
      <ModernModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      {/* مودال سبد خرید (جدید) */}
      <ModernCartDrawer
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
