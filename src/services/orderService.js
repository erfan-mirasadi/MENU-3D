import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export async function getOrderItems(sessionId) {
  if (!sessionId) return [];

  // 1. Gereftan hameye order ha baraye in session (miz)
  const { data, error } = await supabase
    .from("order_items")
    .select(`*, product:products (title, price, image_url)`)
    .eq("session_id", sessionId)
    .neq("status", "closed")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching order items:", error);
    return [];
  }

  return data || [];
}

export async function addOrderItem(orderItem) {
  const { data, error } = await supabase
    .from("order_items")
    .insert([orderItem])
    .select()
    .single();

  if (error) {
    console.error("Error adding order item:", error);
    toast.error("Failed to add item to cart");
    throw error;
  }

  return data;
}

export async function updateOrderItemQuantity(itemId, quantity) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ quantity })
    .eq("id", itemId)
    .select();

  if (error) {
    console.error("Error updating order item:", error);
    toast.error("Failed to update quantity");
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

export async function removeOrderItem(itemId) {
  const { error } = await supabase
    .from("order_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error removing order item:", error);
    toast.error("Failed to remove item");
    throw error;
  }

  return true;
}

export async function submitDraftOrders(sessionId) {
  const { error } = await supabase
    .from("order_items")
    .update({ status: "pending" })
    .eq("session_id", sessionId)
    .eq("status", "draft");

  if (error) {
    console.error("Error submitting orders:", error);
    toast.error("Failed to submit order");
    throw error;
  }

  return true;
}

// Helper to get IP
async function getClientIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) {
        console.warn("Failed to get IP", e);
        return null;
    }
}

export async function voidOrderItem(itemId, reason) {
    // 1. Get User ID (Assuming authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Fetch current item details (Snapshot) + Restaurant ID via Session
    const { data: item, error: fetchError } = await supabase
        .from("order_items")
        .select(`
            *,
            products (title),
            session:sessions (restaurant_id)
        `)
        .eq("id", itemId)
        .single();
    
    if (fetchError || !item) {
        throw new Error("Item not found");
    }

    const restaurantId = item.session?.restaurant_id;
    const ipAddress = await getClientIP();

    // 3. Log Activity
    const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
            action: "VOID_ITEM",
            resource: "order_items",
            resource_id: itemId,
            user_id: user?.id,
            restaurant_id: restaurantId,
            ip_address: ipAddress,
            details: {
                reason,
                voided_at: new Date().toISOString(),
                snapshot: {
                    product_title: item.products?.title,
                    quantity: item.quantity,
                    price: item.unit_price_at_order,
                    status_at_void: item.status
                }
            }
        });
    
    if (logError) {
        console.error("Failed to log activity", logError);
        // We might choose to proceed or block. Blocking is safer for audit.
        throw new Error("Audit log failed. Cannot void.");
    }

    // 4. Cancel Item
    const { error } = await supabase
        .from("order_items")
        .update({ status: "cancelled" })
        .eq("id", itemId);

    if (error) {
        throw error;
    }
    
    return true;
}


// Secure Update Function
export async function updateOrderItemSecurely(itemId, newQty, oldQty, reason) {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. If logic determines this is a "Void" (Reduction), Log it.
    if (newQty < oldQty) {
        // Fetch snapshot for detail
         const { data: item } = await supabase
            .from("order_items")
            .select('products(title), unit_price_at_order, session:sessions(restaurant_id)')
            .eq("id", itemId)
            .single();

         const restaurantId = item?.session?.restaurant_id;
         const ipAddress = await getClientIP();

         const { error: logError } = await supabase
            .from("activity_logs")
            .insert({
                action: "PARTIAL_VOID",
                resource: "order_items",
                resource_id: itemId,
                user_id: user?.id,
                restaurant_id: restaurantId,
                ip_address: ipAddress,
                details: {
                    reason,
                    voided_quantity: oldQty - newQty,
                    new_quantity: newQty,
                    timestamp: new Date().toISOString(),
                    snapshot: {
                        product: item?.products?.title,
                        price: item?.unit_price_at_order
                    }
                }
            });
         
         if (logError) throw new Error("Audit log failed");
    }

    // 2. Perform Update
    const { data, error } = await supabase
        .from("order_items")
        .update({ quantity: newQty })
        .eq("id", itemId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// Chef Dashboard Logic
export async function getKitchenOrders(restaurantId) {
    if (!restaurantId) return [];

    const { data, error } = await supabase
        .from("order_items")
        .select(`
            id,
            session_id,
            status,
            quantity,
            created_at,
            product_id,
            products (title, image_url, price),
            session:sessions!inner (
                id,
                restaurant_id,
                table_id, 
                tables (table_number)
            )
        `)
        .eq("session.restaurant_id", restaurantId)
        .in("status", ["pending", "confirmed", "preparing", "ready", "served"])
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching kitchen orders:", error);
        return [];
    }
    return data;
}

export async function updateOrderItemStatus(itemId, newStatus) {
    const validStatuses = ["preparing", "ready", "served", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
    }

    const { data, error } = await supabase
        .from("order_items")
        .update({ status: newStatus })
        .eq("id", itemId)
        .select()
        .single();

    if (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update status");
        throw error;
    }

    return data;
}
