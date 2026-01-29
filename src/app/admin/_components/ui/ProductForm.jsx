"use client";
import { useState } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
} from "@/services/productService";
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
  restaurantSlug,
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

      try {
        if (initialData) {
          await updateProduct(initialData.id, payload);
        } else {
          await createProduct(payload);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
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

    try {
      await deleteProduct(initialData.id);

      toast.success("Product deleted permanently");
      setDeleting(false);
      onClose();
      window.location.reload();
    } catch (deleteError) {
      // 3. اگر ارور داشت، بررسی می‌کنیم که آیا به خاطر محدودیت کلید خارجی است یا نه
      if (deleteError.code === "23503") {
        const confirmArchive = window.confirm(
          "This product has order history and cannot be fully deleted. Do you want to archive it instead?"
        );

        if (confirmArchive) {
          try {
            await archiveProduct(initialData.id);
            toast.success("Product archived successfully");
            setDeleting(false);
            onClose();
            window.location.reload();
          } catch (archiveError) {
            console.error("Archive exception:", archiveError);
            toast.error("Could not archive product.");
            setDeleting(false);
          }
        } else {
          setDeleting(false);
        }
      } else {
        console.error("Delete exception:", deleteError);
        toast.error("Could not delete product.");
        setDeleting(false);
      }
    }
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
        restaurantSlug={restaurantSlug}
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
