import { supabase } from "@/lib/supabase";

export const getCollections = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        collection_items (
          products (
            id,
            title,
            description,
            price,
            original_price,
            image_url,
            animation_url_android, 
            is_available
          )
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (error) throw error;

    const cleanCollections = data.map((collection) => ({
      ...collection,
      products: collection.collection_items
        .map((item) => item.products)
        .filter((product) => product && product.is_available),
    }));

    return cleanCollections;
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
};
