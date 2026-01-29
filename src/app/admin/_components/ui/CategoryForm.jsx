"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  archiveCategory,
} from "@/services/categoryService";
import toast from "react-hot-toast";
import {
  RiTranslate2,
  RiImageLine,
  RiSave3Line,
  RiDeleteBin6Line,
  RiLock2Line,
} from "react-icons/ri";
import R2FileUploader from "./product-form/R2FileUploader";

export default function CategoryForm({
  onClose,
  restaurantId,
  supportedLanguages,
  defaultLang,
  initialData,
  restaurantSlug,
}) {
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: {},
    image_url: "",
    sort_order: 0,
  });

  // Populate form (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || {},
        image_url: initialData.image_url || "",
        sort_order: initialData.sort_order || 0,
      });
    }
  }, [initialData]);

  // Handle text changes for multi-language fields
  const handleLangChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      title: { ...prev.title, [activeLang]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check all languages for title
    for (const lang of supportedLanguages) {
      if (!formData.title[lang] || formData.title[lang].trim() === "") {
        setActiveLang(lang);
        return toast.error(
          `Please enter category name for ${lang.toUpperCase()}`
        );
      }
    }

    setLoading(true);

    const savePromise = new Promise(async (resolve, reject) => {
      const payload = {
        restaurant_id: restaurantId,
        title: formData.title,
        image_url: formData.image_url || null,
        sort_order: formData.sort_order,
      };

      try {
        if (initialData) {
          await updateCategory(initialData.id, payload);
        } else {
          await createCategory(payload);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast
      .promise(savePromise, {
        loading: initialData ? "Updating category..." : "Creating category...",
        success: initialData ? "Category updated!" : "Category created!",
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    setDeleting(true);

    try {
      // 1. Attempt Hard Delete first
      await deleteCategory(initialData.id);

      // 2. Success (No dependencies found)
      toast.success("Category deleted permanently");
      setDeleting(false);
      onClose();
      window.location.reload();
    } catch (deleteError) {
      // 3. Foreign Key Constraint Error (Category has products)
      if (deleteError.code === "23503") {
        const confirmArchive = window.confirm(
          "This category contains products and cannot be fully deleted. Do you want to archive it instead?"
        );

        if (confirmArchive) {
          try {
            await archiveCategory(initialData.id);
            toast.success("Category archived successfully");
            setDeleting(false);
            onClose();
            window.location.reload();
          } catch (archiveError) {
            console.error("Archive exception:", archiveError);
            toast.error("Could not archive category.");
            setDeleting(false);
          }
        } else {
          setDeleting(false);
        }
      } else {
        console.error("Delete exception:", deleteError);
        toast.error("Could not delete category.");
        setDeleting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Language Tabs */}
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

      {/* Title Input */}
      <div
        className="space-y-4 animate-in fade-in duration-300"
        key={activeLang}
      >
        <div>
          <label className="block text-xs text-gray-500 mb-1 ml-1">
            Category Name ({activeLang.toUpperCase()}){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title[activeLang] || ""}
            onChange={(e) => handleLangChange(e.target.value)}
            placeholder={`e.g. Desserts`}
            className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* Image Input */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <RiImageLine className="text-primary" /> Category Icon / Image
        </h3>

        <R2FileUploader
          label="Category Icon / Image (WEBP, JPG, PNG)"
          accept="image/webp, image/jpeg, image/png"
          maxSize={2}
          value={formData.image_url}
          onChange={(url) => setFormData({ ...formData, image_url: url })}
          restaurantSlug={restaurantSlug}
          subfolder="category"
        />
      </div>

      {/* Actions */}
      <div className="pt-4 flex gap-4 pb-10 flex-col-reverse sm:flex-row">
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
                <RiDeleteBin6Line /> Delete
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
          className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-orange-600 transition font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 border-2 border-green-900"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <RiSave3Line size={20} /> {initialData ? "Update" : "Create"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
