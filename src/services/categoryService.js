import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export async function getCategories(restaurantId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data;
}

export async function createCategory(categoryData) {
  const { data, error } = await supabase
    .from("categories")
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    toast.error("Failed to create category");
    throw error;
  }

  return data;
}

export async function updateCategory(categoryId, categoryData) {
  const { data, error } = await supabase
    .from("categories")
    .update(categoryData)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    toast.error("Failed to update category");
    throw error;
  }

  return data;
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("Error deleting category:", error);
    toast.error("Failed to delete category");
    throw error;
  }

  return true;
}

export async function updateCategorySortOrders(updates) {
  // updates: [{ id, sort_order }]
  for (const { id, sort_order } of updates) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order })
      .eq("id", id);

    if (error) {
      console.error("Error updating sort order for category:", id, error);
      toast.error("Failed to update category order");
      throw error;
    }
  }

  return true;
}

export async function archiveCategory(categoryId) {
  const { data, error } = await supabase
    .from("categories")
    .update({ is_deleted: true })
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    console.error("Error archiving category:", error);
    toast.error("Failed to archive category");
    throw error;
  }

  return data;
}
