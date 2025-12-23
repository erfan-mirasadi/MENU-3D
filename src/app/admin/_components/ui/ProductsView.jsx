"use client";
import { useState, useMemo } from "react";
import CategoryTabs from "./CategoryTabs";
import ProductCard from "./ProductCard";
import SlidePanel from "./SlidePanel";
import ProductForm from "./ProductForm";
import { RiAddLine } from "react-icons/ri";

export default function ProductsView({
  categories,
  products,
  restaurantId,
  supportedLanguages,
}) {
  const [activeTab, setActiveTab] = useState("all");

  // State to manage panel visibility and editing mode
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Filter products based on selected category tab
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    return products.filter((p) => p.category_id === activeTab);
  }, [activeTab, products]);

  const defaultLang =
    supportedLanguages && supportedLanguages.length > 0
      ? supportedLanguages[0]
      : "tr";

  // Handler to open panel for creating a new product
  const handleCreateClick = () => {
    setEditingProduct(null); // Clear editing data
    setIsPanelOpen(true);
  };

  // Handler to open panel for editing an existing product
  const handleEditClick = (product) => {
    setEditingProduct(product); // Set data to form
    setIsPanelOpen(true);
  };

  // Handler to close panel
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    // Delay clearing data to avoid UI flickering during close animation
    setTimeout(() => setEditingProduct(null), 300);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="px-4 sm:px-8 mt-6">
        <CategoryTabs
          categories={categories}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12 pt-8">
          {/* Create New Product Button */}
          <button
            onClick={handleCreateClick}
            className="group h-full min-h-[320px] w-full rounded-2xl border-2 border-dashed border-gray-700 bg-dark-800/30 flex flex-col items-center justify-center gap-4 hover:bg-dark-800 hover:border-primary transition-all cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-gray-800 group-hover:bg-primary flex items-center justify-center text-primary group-hover:text-white transition-colors duration-300 shadow-lg">
              <RiAddLine size={32} />
            </div>
            <span className="text-gray-400 group-hover:text-primary font-semibold transition-colors">
              Add new dish
            </span>
          </button>

          {/* Existing Products List */}
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditClick}
              defaultLang={defaultLang}
            />
          ))}
        </div>
      </div>

      {/* Slide Panel for Form */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title={editingProduct ? "Edit Product" : "Add New Product"} // Dynamic Title
      >
        <ProductForm
          onClose={handleClosePanel}
          categories={categories}
          restaurantId={restaurantId}
          supportedLanguages={supportedLanguages || ["en"]}
          defaultLang={defaultLang}
          initialData={editingProduct}
          key={editingProduct ? editingProduct.id : "new-product"}
          activeCategory={activeTab}
        />
      </SlidePanel>
    </div>
  );
}
