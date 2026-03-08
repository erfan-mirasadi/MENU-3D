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

export async function getOperationalTables(restaurantId) {
  const { data, error } = await supabase
    .from("tables")
    .select("id, restaurant_id, table_number, qr_token, layout_data")
    .eq("restaurant_id", restaurantId)
    .order("table_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getOperationalSessions(restaurantId) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id, created_at, status, table_id, restaurant_id, note,
      tables (id, table_number),
      bills (id, total_amount, paid_amount, remaining_amount, status, adjustments, transactions (paid_items)),
      order_items (
          id, status, quantity, unit_price_at_order, created_at, product_id, session_id, added_by_guest_id,
          product:products ( title, price, image_url ) 
      ),
      service_requests ( id, status, request_type )
    `)
    .eq("restaurant_id", restaurantId)
    .neq("status", "closed");

  if (error) throw error;
  return data;
}

export function getRestaurantRealtimeChannel(restaurantId) {
  return supabase.channel(`restaurant-${restaurantId}`);
}

export function cleanupRestaurantRealtimeChannel(channel) {
  supabase.removeChannel(channel);
}
