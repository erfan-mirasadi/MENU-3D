"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  RiTranslate2,
  RiMoneyDollarCircleLine,
  RiImageLine,
  RiSave3Line,
  RiPercentLine,
  RiErrorWarningLine,
  RiDeleteBin6Line,
  RiLock2Line,
} from "react-icons/ri";
import toast from "react-hot-toast";

export default function ProductForm({
  onClose,
  categories,
  restaurantId,
  supportedLanguages,
  defaultLang,
  initialData,
}) {
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Logic to toggle discount input
  const [hasDiscount, setHasDiscount] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category_id: "",
    title: {},
    description: {},
    price: "",
    original_price: "",
    is_available: true,
    image_url: "",
    model_url: "",
    animation_url_android: "",
    animation_url_ios: "",
  });

  // Populate form if initialData exists (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        category_id: initialData.category_id || "",
        title: initialData.title || {},
        description: initialData.description || {},
        price: initialData.price || "",
        original_price: initialData.original_price || "",
        is_available: initialData.is_available,
        image_url: initialData.image_url || "",
        model_url: initialData.model_url || "",
        animation_url_android: initialData.animation_url_android || "",
        animation_url_ios: initialData.animation_url_ios || "",
      });
      // Set discount toggle if original price exists
      if (initialData.original_price) {
        setHasDiscount(true);
      }
    }
  }, [initialData]);

  // Handle text changes for multi-language fields
  const handleLangChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [activeLang]: value },
    }));
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.category_id) return toast.error("Please select a category");
    if (!formData.price) return toast.error("Please enter the final price");

    const finalPrice = parseFloat(formData.price);
    if (hasDiscount) {
      const originalPrice = parseFloat(formData.original_price);
      if (!formData.original_price)
        return toast.error("Please enter the original price");
      if (originalPrice <= finalPrice) {
        return toast.error("Original price must be HIGHER than final price!");
      }
    }

    // Check all languages for title
    for (const lang of supportedLanguages) {
      if (!formData.title[lang] || formData.title[lang].trim() === "") {
        setActiveLang(lang);
        return toast.error(`Please enter title for ${lang.toUpperCase()}`);
      }
    }

    setLoading(true);

    const savePromise = new Promise(async (resolve, reject) => {
      const payload = {
        restaurant_id: restaurantId,
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        price: finalPrice,
        original_price: hasDiscount
          ? parseFloat(formData.original_price)
          : null,
        is_available: formData.is_available,
        image_url: formData.image_url || null,
        model_url: formData.model_url || null,
        animation_url_android: formData.animation_url_android || null,
        animation_url_ios: formData.animation_url_ios || null,
      };

      let error;

      if (initialData) {
        // UPDATE MODE
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", initialData.id);
        error = updateError;
      } else {
        // INSERT MODE
        const { error: insertError } = await supabase
          .from("products")
          .insert([payload]);
        error = insertError;
      }

      if (error) reject(error);
      else resolve();
    });

    toast
      .promise(savePromise, {
        loading: initialData ? "Updating product..." : "Adding product...",
        success: initialData ? "Product updated!" : "Product created!",
        error: "Operation failed.",
      })
      .then(() => {
        setLoading(false);
        onClose();
        window.location.reload();
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    setDeleting(true);
    const deletePromise = supabase
      .from("products")
      .delete()
      .eq("id", initialData.id);

    toast
      .promise(deletePromise, {
        loading: "Deleting product...",
        success: "Product deleted successfully",
        error: "Failed to delete product",
      })
      .then(() => {
        setDeleting(false);
        onClose();
        window.location.reload();
      })
      .catch(() => setDeleting(false));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Category Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.category_id}
          onChange={(e) =>
            setFormData({ ...formData, category_id: e.target.value })
          }
          className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
        >
          <option value="" disabled>
            Select a category...
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.title?.en || cat.title?.tr || "Unnamed Category"}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-gray-800" />

      {/* Language Switcher */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <RiTranslate2 /> Language Support
        </label>
        <div className="bg-dark-800 p-1.5 rounded-xl flex gap-2 border border-gray-700 overflow-x-auto no-scrollbar">
          {supportedLanguages.map((lang) => {
            const isFilled =
              formData.title[lang] && formData.title[lang].length > 0;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`flex-1 min-w-[70px] py-2.5 text-sm font-bold rounded-lg transition-all relative ${
                  activeLang === lang
                    ? "bg-primary text-white shadow-lg border-2 border-white scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-gray-700 border-2 border-transparent"
                }`}
              >
                {lang.toUpperCase()}
                {isFilled && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title & Description Inputs */}
      <div
        className="space-y-4 animate-in fade-in duration-300"
        key={activeLang}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold flex items-center gap-2">
            Details for{" "}
            <span className="text-primary">{activeLang.toUpperCase()}</span>
          </h3>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 ml-1">
            Product Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title[activeLang] || ""}
            onChange={(e) => handleLangChange("title", e.target.value)}
            placeholder={`e.g. Delicious Burger`}
            className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 ml-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description[activeLang] || ""}
            onChange={(e) => handleLangChange("description", e.target.value)}
            placeholder={`Ingredients, allergies...`}
            className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* Pricing Section */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <RiMoneyDollarCircleLine className="text-primary" /> Pricing
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">
              Final Price <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3 top-3 text-gray-500">₺</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 pl-8 text-white focus:border-primary focus:outline-none font-bold text-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-dark-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <RiPercentLine
                className={`text-xl ${
                  hasDiscount ? "text-primary" : "text-gray-500"
                }`}
              />
              <span>Apply Discount?</span>
            </div>
            <button
              type="button"
              onClick={() => setHasDiscount(!hasDiscount)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                hasDiscount ? "bg-primary" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                  hasDiscount ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {hasDiscount && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <label className="block text-xs text-primary mb-1 ml-1 font-bold">
                Original Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-primary/50 line-through">
                  ₺
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData({ ...formData, original_price: e.target.value })
                  }
                  className="w-full bg-dark-900 border border-primary/30 rounded-xl p-3 pl-8 text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-3 bg-dark-800 p-3 rounded-xl border border-gray-700 cursor-pointer select-none"
        onClick={() =>
          setFormData((p) => ({ ...p, is_available: !p.is_available }))
        }
      >
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            formData.is_available
              ? "bg-green-500 border-green-500"
              : "border-gray-500"
          }`}
        >
          {formData.is_available && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </div>
        <span className="text-sm text-gray-300">Available in Menu</span>
      </div>

      <hr className="border-gray-800" />

      {/* Media Links - Read Only for Editing */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <RiImageLine className="text-primary" /> Media Assets
        </h3>

        {/* If editing, show read-only message */}
        {initialData && (
          <div className="text-xs text-yellow-500 flex items-center gap-1 mb-2">
            <RiLock2Line /> Media editing is currently disabled.
          </div>
        )}

        <div className="relative group">
          <RiImageLine className="absolute left-3 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Image URL..."
            value={formData.image_url}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
            readOnly={!!initialData} // Read-only if editing
            className={`w-full bg-dark-800 border border-gray-700 rounded-xl p-3 pl-10 text-white focus:outline-none text-sm ${
              initialData
                ? "opacity-50 cursor-not-allowed"
                : "focus:border-primary"
            }`}
          />
        </div>
        {/* Additional media inputs follow same pattern... */}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex gap-4 pb-10 flex-col-reverse sm:flex-row">
        {/* Delete Button (Only in Edit Mode) */}
        {initialData && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="py-3 px-4 rounded-xl border border-red-500/50 text-red-500 hover:bg-red-500/10 transition font-medium active:scale-95 flex items-center justify-center gap-2"
          >
            {deleting ? (
              "Deleting..."
            ) : (
              <>
                <RiDeleteBin6Line /> Delete Product
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition font-medium active:scale-95"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-orange-600 transition font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <RiSave3Line size={20} />{" "}
              {initialData ? "Update Product" : "Create Product"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
