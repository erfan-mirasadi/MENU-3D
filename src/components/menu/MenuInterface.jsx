"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import MenuHeader from "./MenuHeader";
import CartBar from "./CartBar";
import ProductModal from "./ProductModal";
import { useCart } from "@/app/hooks/useCart";

export default function MenuInterface({ restaurant, categories, tableId }) {
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Custom Hook Logic
  const { cartItems, addToCart, isLoading } = useCart(tableId);

  // Calculations
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + item.unit_price_at_order * item.quantity;
  }, 0);

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#1F1D2B] font-sans pb-24 text-gray-100 selection:bg-[#ea7c69] selection:text-white overflow-x-hidden">
      <MenuHeader
        restaurant={restaurant}
        tableId={tableId}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      <div className="p-4 pt-2 min-h-[60vh]">
        {categories?.map((cat) => (
          <div
            key={cat.id}
            className={`${
              activeCategory === cat.id ? "block" : "hidden"
            } animate-in fade-in zoom-in-95 duration-500`}
          >
            {/* Divider */}
            <div className="flex items-center gap-4 mb-6 opacity-50">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                Menu
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {cat.products?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Cart Bar Component */}
      <CartBar
        totalAmount={totalAmount}
        totalCount={totalCount}
        isLoading={isLoading}
        onClick={() => console.log("Open Cart Drawer Here...")}
      />

      {/* 4. Modal Component */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}
