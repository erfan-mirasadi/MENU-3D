"use client";
import { useState, useMemo } from "react";
import CategoryTabs from "./CategoryTabs";
import ProductCard from "./ProductCard";
import SlidePanel from "./SlidePanel";
import ProductForm from "./ProductForm";
import CategoryForm from "./CategoryForm";
import AddCard from "./AddCart";

export default function ProductsView({
  categories,
  products,
  restaurantId,
  supportedLanguages,
  restaurantSlug,
}) {
  const [activeTab, setActiveTab] = useState("all");

  // --- Product Panel States ---
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // --- Category Panel States (New) ---
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Filter products based on selected category tab
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    return products.filter((p) => p.category_id === activeTab);
  }, [activeTab, products]);

  const defaultLang =
    supportedLanguages && supportedLanguages.length > 0
      ? supportedLanguages[0]
      : "tr";

  const handleCreateClick = () => {
    setEditingProduct(null);
    setIsPanelOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setEditingProduct(null), 300);
  };

  const handleCategoryCreate = () => {
    setEditingCategory(null);
    setIsCategoryPanelOpen(true);
  };

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setIsCategoryPanelOpen(true);
  };

  const closeCategoryPanel = () => {
    setIsCategoryPanelOpen(false);
    setTimeout(() => setEditingCategory(null), 300);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className=" mt-3">
        <CategoryTabs
          categories={categories}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          // Added props for category management
          onEditCategory={handleCategoryEdit}
          onAddCategory={handleCategoryCreate}
          defaultLang={defaultLang}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-18 pt-3 pb-15">
          {/* Create New Product Button */}
          <AddCard 
            onClick={handleCreateClick} 
            label="Add new dish" 
            className="mt-9 min-h-[320px] bg-dark-800/30 border-gray-700 hover:bg-dark-800"
          />

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

      {/* --- PANEL 1: PRODUCT FORM --- */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title={editingProduct ? "Edit Product" : "Add New Product"}
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
          restaurantSlug={restaurantSlug}
        />
      </SlidePanel>

      {/* --- PANEL 2: CATEGORY FORM (New) --- */}
      <SlidePanel
        isOpen={isCategoryPanelOpen}
        onClose={closeCategoryPanel}
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <CategoryForm
          key={editingCategory ? editingCategory.id : "new-category"}
          onClose={closeCategoryPanel}
          restaurantId={restaurantId}
          supportedLanguages={supportedLanguages || ["en"]}
          defaultLang={defaultLang}
          initialData={editingCategory}
          restaurantSlug={restaurantSlug}
        />
      </SlidePanel>
    </div>
  );
}
