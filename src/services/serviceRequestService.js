import { supabase } from "@/lib/supabase";

export const serviceRequestService = {
  async createRequest(restaurantId, tableId, sessionId, type) {
    if (!restaurantId || !tableId) {
      console.error("Missing required fields for service request");
      return { error: "Missing required fields" };
    }

    const { data, error } = await supabase
      .from("service_requests")
      .insert([
        {
          restaurant_id: restaurantId,
          table_id: tableId,
          session_id: sessionId,
          request_type: type,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating service request:", error);
      return { error };
    }

    return { data };
  },

  async getPendingRequests(restaurantId) {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending requests:", error);
      return [];
    }
    return data;
  },

  async resolveRequest(requestId) {
    const { data, error } = await supabase
      .from("service_requests")
      .update({ status: "resolved" })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("Error resolving request:", error);
      return { error };
    }
    return { data };
  },
};
