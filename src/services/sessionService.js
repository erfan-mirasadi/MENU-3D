import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export async function getActiveSession(tableId, signal) {
  let query = supabase
    .from("sessions")
    .select("*")
    .eq("table_id", tableId)
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== "PGRST116") {
    if (error.name === "AbortError" || error.message?.includes("AbortError")) {
       console.log("getActiveSession aborted");
    } else {
       console.error("Error fetching session:", error);
    }
  }

  return data;
}

export async function createSession(tableId, restaurantId, signal) {
  let query = supabase
    .from("sessions")
    .insert([
      {
        table_id: tableId,
        restaurant_id: restaurantId,
        status: "ordering",
      },
    ])
    .select();

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.name === "AbortError" || error.message?.includes("AbortError")) {
      console.log("createSession aborted");
      return null;
    }
    console.error("Error creating session:", error);
    toast.error("Failed to create session");
    throw error;
  }

  return data;
}

export async function updateSessionStatus(sessionId, status) {
  const { data, error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating session:", error);
    toast.error("Failed to update session");
    throw error;
  }

  return data;
}

export async function updateSessionNote(sessionId, noteText) {
  const { data, error } = await supabase
    .from("sessions")
    .update({ note: noteText })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating session note:", error);
    toast.error("Failed to update note");
    throw error;
  }

  return data;
}

export async function getSessionWithOrders(sessionId) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      order_items(*, product:products(*))
    `)
    .eq("id", sessionId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching session with orders:", error);
    }
    return null;
  }
  return data;
}

export function subscribeToClientSession(sessionId, onSessionUpdate, onOrderUpdate) {
  const channel = supabase
    .channel(`client_session_${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
      (payload) => { onSessionUpdate(payload.new); }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items", filter: `session_id=eq.${sessionId}` },
      () => { onOrderUpdate(); }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
