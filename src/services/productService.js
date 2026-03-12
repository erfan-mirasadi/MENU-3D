import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export async function getProducts(restaurantId) {
  if (!restaurantId) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data;
}

export async function createProduct(productData) {
  const { data, error } = await supabase
    .from("products")
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    toast.error("Failed to create product");
    throw error;
  }

  return data;
}

export async function updateProduct(productId, productData) {
  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    toast.error("Failed to update product");
    throw error;
  }

  return data;
}

export async function deleteProduct(productId) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    toast.error("Failed to delete product");
    throw error;
  }

  return true;
}

export async function updateProductSortOrders(updates) {
  // updates: [{ id, sort_order }] — sequential updates to avoid connection issues
  for (const { id, sort_order } of updates) {
    const { error } = await supabase
      .from("products")
      .update({ sort_order })
      .eq("id", id);

    if (error) {
      console.error("Error updating sort order for product:", id, error);
      toast.error("Failed to update product order");
      throw error;
    }
  }

  return true;
}

export async function archiveProduct(productId) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_deleted: true })
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    console.error("Error archiving product:", error);
    toast.error("Failed to archive product");
    throw error;
  }

  return data;
}
