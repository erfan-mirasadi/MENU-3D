import { supabase } from "@/lib/supabase";

export async function getProducts(restaurantId) {
  if (!restaurantId) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data;
}
