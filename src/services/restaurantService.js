import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export async function getRestaurantBySlug(slug) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }

  return data;
}

export async function getRestaurantByOwnerId(ownerId) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }

  return data;
}

export async function getRestaurantById(id) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching restaurant by ID:", error);
    return null;
  }

  return data;
}

export async function createRestaurant(restaurantData) {
  const { data, error } = await supabase
    .from("restaurants")
    .insert([restaurantData])
    .select()
    .single();

  if (error) {
    console.error("Error creating restaurant:", error);
    toast.error("Failed to create restaurant");
    throw error;
  }

  return data;
}

export async function updateRestaurant(ownerId, restaurantData) {
  const { data, error } = await supabase
    .from("restaurants")
    .update(restaurantData)
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating restaurant:", error);
    toast.error("Failed to update restaurant");
    throw error;
  }

  return data;
}
// [NEW] Specialized update for Images (auto-save)
export async function updateRestaurantImage(ownerId, field, url) {
  const { data, error } = await supabase
    .from("restaurants")
    .update({ [field]: url })
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating restaurant ${field}:`, error);
    // Toast should be handled by caller or here - user prefers toast unified
    throw error;
  }

  return data;
}
