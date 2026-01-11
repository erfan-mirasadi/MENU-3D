"use client";

import { useState, useEffect, useMemo } from "react";
import { FaSearch, FaTimes, FaPlus, FaMinus } from "react-icons/fa";
import { getMenuProducts } from "@/services/waiterService";
import { getCategories } from "@/services/categoryService";
import SmartMedia from "@/components/ui/SmartMedia";
import toast from "react-hot-toast";

export default function WaiterMenuModal({
  isOpen,
  onClose,
  cartItems, // آیتم‌های فعلی سبد خرید برای نمایش تعداد (اختیاری ولی حرفه‌ای)
  onAdd, // تابع افزودن
  onRemove, // تابع کم کردن
  restaurantId, // شناسه رستوران برای فچ کردن دسته‌بندی‌ها
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch Logic
  useEffect(() => {
    if (isOpen && products.length === 0) {
      const fetchData = async () => {
        try {
          // فچ محصولات
          const productsData = await getMenuProducts(restaurantId);
          const validData =
            productsData?.filter((p) => p.title && p.price) || [];
          setProducts(validData);

          // فچ دسته‌بندی‌ها از دیتابیس
          if (restaurantId) {
            const categoriesData = await getCategories(restaurantId);
            setCategories(categoriesData || []);
          }
        } catch (error) {
          console.error(error);
          toast.error("Menu load failed");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, restaurantId]);

  // لیست دسته‌بندی‌ها برای نمایش (با All در ابتدا)
  const categoryOptions = useMemo(() => {
    const allOption = { id: "All", title: { tr: "Hepsi", en: "All" } };
    return [allOption, ...categories];
  }, [categories]);

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // سرچ در انگلیسی و ترکی
      const titleEn = p.title?.en?.toLowerCase() || "";
      const titleTr = p.title?.tr?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        titleEn.includes(search) || titleTr.includes(search);

      // مچ کردن دسته بندی
      const matchesCat =
        selectedCategory === "All" || p.category_id === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Helper to find quantity in cart
  const getQty = (productId) => {
    const item = cartItems.find(
      (i) => i.product_id === productId || i.product?.id === productId
    );
    return item ? item.quantity : 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#1F1D2B] animate-in slide-in-from-bottom duration-300">
      {/* HEADER */}
      <div className="p-4 bg-[#252836] border-b border-white/10 flex gap-3 items-center shadow-md shrink-0 safe-area-top">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="w-full bg-[#1F1D2B] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#ea7c69]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white active:scale-95 transition-all"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* CATEGORIES */}
      <div className="py-3 px-4 border-b border-white/5 overflow-x-auto whitespace-nowrap no-scrollbar bg-[#1F1D2B] shrink-0">
        <div className="flex gap-2">
          {categoryOptions.map((cat) => {
            const title =
              typeof cat.title === "object"
                ? cat.title?.tr || cat.title?.en
                : cat.title;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#ea7c69] text-white shadow-lg shadow-orange-900/20"
                    : "bg-[#252836] text-gray-400 border border-white/5"
                }`}
              >
                {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#1F1D2B]">
        {loading ? (
          <div className="flex justify-center mt-20 text-[#ea7c69] animate-pulse">
            Loading Menu...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-20">
            {filteredProducts.map((product) => {
              const qty = getQty(product.id);
              return (
                <div
                  key={product.id}
                  className={`bg-[#252836] rounded-2xl p-3 border transition-all flex flex-col ${
                    qty > 0 ? "border-[#ea7c69]/50" : "border-white/5"
                  }`}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square mb-3 bg-black/20 rounded-xl overflow-hidden">
                    <SmartMedia
                      files={product}
                      autoPlay={false}
                      className="object-contain"
                    />
                    {/* Badge if in cart */}
                    {qty > 0 && (
                      <div className="absolute top-2 right-2 bg-[#ea7c69] text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                        {qty}x
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 mb-3">
                    <h3 className="text-white font-bold text-sm truncate leading-tight">
                      {product.title?.en || product.title?.tr || "Unknown"}
                    </h3>
                    <p className="text-[#ea7c69] font-mono text-xs mt-1">
                      {product.price} ₺
                    </p>
                  </div>

                  {/* --- 2. CONTROLS (+ -) --- */}
                  <div className="flex items-center gap-2 h-10">
                    <button
                      onClick={() => onRemove(product)}
                      disabled={qty === 0}
                      className={`flex-1 h-full rounded-lg flex items-center justify-center transition-colors ${
                        qty > 0
                          ? "bg-[#1F1D2B] text-white border border-white/10 active:bg-red-500/20 active:text-red-400"
                          : "bg-[#1F1D2B]/50 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <FaMinus size={12} />
                    </button>

                    <button
                      onClick={() => onAdd(product)}
                      className="flex-1 h-full bg-[#ea7c69] hover:bg-[#d96b58] text-white rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
