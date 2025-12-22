"use client";
import { useState, useMemo } from "react";
import CategoryTabs from "./CategoryTabs";
import ProductCard from "./ProductCard";
import AddCard from "./AddCart";

export default function ProductsView({ categories, products }) {
  const [activeTab, setActiveTab] = useState("all");
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    return products.filter((p) => p.category_id === activeTab);
  }, [activeTab, products]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-8 mt-6">
        <CategoryTabs
          categories={categories}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12 pt-8">
          <AddCard />
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center text-text-dim py-10">
              No products found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
