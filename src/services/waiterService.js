import { supabase } from "@/lib/supabase";

// 1. Confirm Orders (Convert Pending -> Confirmed)
export async function confirmOrderItems(sessionId) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ status: "confirmed" })
    .eq("session_id", sessionId)
    .eq("status", "pending")
    .select();

  if (error) throw error;
  return data;
  if (error) throw error;
  return data;
}

// 1.5. Prepare Orders (Convert Confirmed -> Served/Kitchen) 
// NOTE: DB Constraint only allows 'pending', 'confirmed', 'served'. 
// We use 'served' to represent "Active/In Progress" after confirmation.
export async function startPreparingOrder(sessionId) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ status: "served" })
    .eq("session_id", sessionId)
    .eq("status", "confirmed")
    .select();

  if (error) throw error;
  return data;
}

// 2. Close Table & Session (Convert Active -> Closed)
export async function closeTableSession(sessionId) {
  // Close the session
  const { error: sessionError } = await supabase
    .from("sessions")
    .update({ status: "closed" })
    .eq("id", sessionId);

  if (sessionError) throw sessionError;

  // Optional: Close items for data cleanliness
  await supabase
    .from("order_items")
    .update({ status: "closed" })
    .eq("session_id", sessionId);

  // Resolve pending service requests
  await supabase
    .from("service_requests")
    .update({ status: "resolved" })
    .eq("session_id", sessionId);

  return true;
}

// 3. Update Item (e.g., Change Quantity)
export async function updateOrderItem(itemId, updates) {
  const { data, error } = await supabase
    .from("order_items")
    .update(updates)
    .eq("id", itemId)
    .select();

  if (error) throw error;
  return data;
}

// 4. Delete Item (Remove from order)
export async function deleteOrderItem(itemId) {
  const { error } = await supabase
    .from("order_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
  return true;
}

// 5. Add Item (Add to order)
export async function addOrderItem(item) {
  const { data, error } = await supabase
    .from("order_items")
    .insert(item)
    .select();

  if (error) throw error;
  return data;
}

export async function getMenuProducts(restaurantId) {
      if (!restaurantId) {
            console.error("getMenuProducts called without restaurantId");
            return [];
      }
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, title, sort_order)
    `
    )
    .eq("restaurant_id", restaurantId)
    .eq("is_deleted", false)
    .order("category_id", { ascending: true });

  if (error) throw error;
  return data;
}

// Create a new session for an empty table (Open Table)
export async function startTableSession(tableId, restaurantId) {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      table_id: tableId,
      restaurant_id: restaurantId,
      status: "ordering", // or 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
