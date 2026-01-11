"use client";

import { useState } from "react";
import ClassicHeader from "./ClassicHeader";
import ClassicRow from "./ClassicRow";
import ClassicModal from "./ClassicModal";
import ClassicCartButton from "./ClassicCartButton";
import ClassicCartDrawer from "./ClassicCartDrawer";
import { useCart } from "@/app/hooks/useCart";

export default function ClassicMenu({ restaurant, categories, tableId }) {
  const { cartItems, addToCart, removeFromCart, submitOrder, isLoading } =
    useCart(tableId, restaurant.id);
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.unit_price_at_order * item.quantity,
    0
  );

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative h-full">
      {/* Header */}
      <ClassicHeader
        restaurant={restaurant}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto pb-32 pt-4 px-6">
        <div className="max-w-3xl mx-auto">
          {categories?.map((cat) => {
            if (activeCategory !== cat.id) return null;
            return (
              <div
                key={cat.id}
                className="animate-in slide-in-from-bottom-8 duration-700 fade-in"
              >
                {/* Category Header Decor */}
                <div className="text-center py-8">
                  <span className="text-4xl text-[#D4AF37] opacity-50">❦</span>
                  <h2 className="text-3xl font-bold italic text-[#2C1810] mt-2">
                    {typeof cat.title === "object" ? cat.title.en : cat.title}
                  </h2>
                  <div className="w-16 h-px bg-[#D4AF37] mx-auto mt-4 opacity-50"></div>
                </div>

                {/* Products List */}
                <div className="space-y-6">
                  {cat.products?.map((product) => (
                    <ClassicRow
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
      </div>

      {/* Floating Cart Button */}
      <ClassicCartButton
        totalCount={totalCount}
        totalAmount={totalAmount}
        onClick={() => setIsCartOpen(true)}
      />

      {/* Modal Details */}
      <ClassicModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Cart Drawer */}
      <ClassicCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onSubmit={submitOrder}
      />
    </div>
  );
}
