"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

import CategorySelect from "./product-form/CategorySelect";
import LanguageTabs from "./product-form/LanguageTabs";
import ProductDetails from "./product-form/ProductDetails";
import PricingSection from "./product-form/PricingSection";
import MediaSection from "./product-form/MediaSection";
import FormActions from "./product-form/FormActions";

export default function ProductForm({
  onClose,
  categories,
  restaurantId,
  supportedLanguages,
  defaultLang,
  initialData,
  activeCategory,
}) {
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // به جای useEffect، مقدار اولیه را همینجا محاسبه می‌کنیم.
  // این کار باعث می‌شود در اولین رندر، فرم پر باشد و نیازی به رندر مجدد نباشد.

  const [hasDiscount, setHasDiscount] = useState(() => {
    return initialData && initialData.original_price ? true : false;
  });

  // 2. Update the Lazy Initialization logic
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
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
      };
    }

    // CREATE MODE
    return {
      category_id:
        activeCategory && activeCategory !== "all" ? activeCategory : "",

      title: {},
      description: {},
      price: "",
      original_price: "",
      is_available: true,
      image_url: "",
      model_url: "",
      animation_url_android: "",
      animation_url_ios: "",
    };
  });
  // ----------------------------------------------------

  const handleLangChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [activeLang]: value },
    }));
  };

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
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", initialData.id);
        error = updateError;
      } else {
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
      <CategorySelect
        categories={categories}
        value={formData.category_id}
        onChange={(val) => setFormData({ ...formData, category_id: val })}
      />

      <hr className="border-gray-800" />
      <LanguageTabs
        supportedLanguages={supportedLanguages}
        activeLang={activeLang}
        setActiveLang={setActiveLang}
        formData={formData}
      />
      <ProductDetails
        activeLang={activeLang}
        formData={formData}
        onLangChange={handleLangChange}
      />

      <hr className="border-gray-800" />
      <PricingSection
        formData={formData}
        setFormData={setFormData}
        hasDiscount={hasDiscount}
        setHasDiscount={setHasDiscount}
      />

      <hr className="border-gray-800" />

      <MediaSection
        formData={formData}
        setFormData={setFormData}
        isEditing={!!initialData}
      />

      <FormActions
        onClose={onClose}
        loading={loading}
        deleting={deleting}
        isEditing={!!initialData}
        onDelete={handleDelete}
      />
    </form>
  );
}
