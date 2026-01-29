import { supabase } from "@/lib/supabase";
import { ORDER_STATUS, SESSION_STATUS } from "@/lib/constants";

// 1. Confirm Orders (Convert Pending -> Confirmed)
export async function confirmOrderItems(sessionId, destinationStatus = ORDER_STATUS.CONFIRMED) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ status: destinationStatus })
    .eq("session_id", sessionId)
    .eq("status", ORDER_STATUS.PENDING)
    .select();

  if (error) throw error;
  return data;
}

// 1.5. Prepare Orders (Convert Confirmed -> Served/Kitchen) 
// NOTE: DB Constraint only allows 'pending', 'confirmed', 'served'. 
// We use 'served' to represent "Active/In Progress" after confirmation.
export async function startPreparingOrder(sessionId) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ status: ORDER_STATUS.PREPARING })
    .eq("session_id", sessionId)
    .eq("status", ORDER_STATUS.CONFIRMED)
    .select();

  if (error) throw error;
  return data;
}

// 1.6 Serve Confirmed Orders (Directly Serve from Confirmed, skipping Preparing)
// Used when Kitchen module is disabled but we want to clear the queue
export async function serveConfirmedOrders(sessionId) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ status: ORDER_STATUS.SERVED })
    .eq("session_id", sessionId)
    // We update 'confirmed' items. 
    // If we also want to catch 'preparing' items (in case they got there somehow), we could use IN operator, but usually it's just confirmed.
    .eq("status", ORDER_STATUS.CONFIRMED) 
    .select();

  if (error) throw error;
  return data;
}

// 2. Close Table & Session (Convert Active -> Closed)
export async function closeTableSession(sessionId) {
  // Close the session
  const { error: sessionError } = await supabase
    .from("sessions")
    .update({ status: SESSION_STATUS.CLOSED })
    .eq("id", sessionId);

  if (sessionError) throw sessionError;



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
      status: SESSION_STATUS.ACTIVE, // or 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 6. Move Session (Transfer)
export const moveSession = async (sessionId, newTableId) => {
  // Update the session's table_id reference
  const { data, error } = await supabase
    .from('sessions')
    .update({ table_id: newTableId })
    .eq('id', sessionId)
    .select();
  if (error) throw error;
  return data;
};

// 7. Merge Sessions (Combine)
export const mergeSessions = async (sourceSessionId, targetSessionId) => {
  // 1. Move all order_items from Source to Target
  const { error: itemError } = await supabase
    .from('order_items')
    .update({ session_id: targetSessionId })
    .eq('session_id', sourceSessionId);
  if (itemError) throw itemError;

  // 2. Close the Source Session (mark as merged)
  const { error: sessionError } = await supabase
    .from('sessions')
    .update({ 
        status: SESSION_STATUS.CLOSED, 
    })
    .eq('id', sourceSessionId);
    
  if (sessionError) throw sessionError;
  return true;
};
