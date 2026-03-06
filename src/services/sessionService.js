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

