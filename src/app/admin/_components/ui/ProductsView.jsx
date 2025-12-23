"use client";
import { useState, useMemo } from "react";
import CategoryTabs from "./CategoryTabs";
import ProductCard from "./ProductCard";
import SlidePanel from "./SlidePanel";
import ProductForm from "./ProductForm";
import CategoryForm from "./CategoryForm"; // <--- Import CategoryForm
import { RiAddLine } from "react-icons/ri";

export default function ProductsView({
  categories,
  products,
  restaurantId,
  supportedLanguages,
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

  // --- Product Handlers ---
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

  // --- Category Handlers (New) ---
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
      <div className="px-4 sm:px-8 mt-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12 pt-6 pb-15">
          {/* Create New Product Button */}
          <button
            onClick={handleCreateClick}
            className="group h-full min-h-[320px] w-full rounded-2xl border-2 mt-9 border-dashed border-gray-700 bg-dark-800/30 flex flex-col items-center justify-center gap-4 hover:bg-dark-800 hover:border-primary transition-all cursor-pointer"
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
        />
      </SlidePanel>
    </div>
  );
}
