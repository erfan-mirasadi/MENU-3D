"use client";
import { useState } from "react";
import CategoryTabs from "./CategoryTabs";
import SlidePanel from "./SlidePanel";
import ProductForm from "./ProductForm";
import CategoryForm from "./CategoryForm";
import AddCard from "./AddCart";
import Loader from "./Loader";
import SortableProductGrid from "./SortableProductGrid";

export default function ProductsView({
  categories,
  products,
  restaurantId,
  supportedLanguages,
  restaurantSlug,
}) {
  const [isRefreshingProducts, setIsRefreshingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Product Panel States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  //  Category Panel States
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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

  const refreshProducts = () => {
    setIsRefreshingProducts(true);

    window.setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  const handleProductMutationComplete = () => {
    handleClosePanel();
    refreshProducts();
  };

  return (
    <div className="relative flex flex-col h-full">
      {isRefreshingProducts && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/75 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      <div className=" mt-3">
        <CategoryTabs
          categories={categories}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEditCategory={handleCategoryEdit}
          onAddCategory={handleCategoryCreate}
          defaultLang={defaultLang}
        />
      </div>

      {/* Product Grid with Drag & Drop */}
      <SortableProductGrid
        products={products}
        activeTab={activeTab}
        onEdit={handleEditClick}
        defaultLang={defaultLang}
      >
        <AddCard
          onClick={handleCreateClick}
          label="Add new dish"
          className="mt-9 min-h-80 bg-dark-800/30 border-gray-700 hover:bg-dark-800"
        />
      </SortableProductGrid>

      <SlidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <ProductForm
          onClose={handleClosePanel}
          onMutationComplete={handleProductMutationComplete}
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
