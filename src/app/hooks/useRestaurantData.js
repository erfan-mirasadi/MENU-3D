import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/userService";
import { getRestaurantById } from "@/services/restaurantService";
// We can import specific services if needed, or just keep the logic here for simplicity/unification

export const useRestaurantData = () => {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);

  const [restaurant, setRestaurant] = useState(null);

  // To prevent rapid duplicate fetches
  const timeoutRef = useRef(null);

  // 1. Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 0. Get Restaurant ID from Profile
      const profile = await getUserProfile(supabase, user.id);
      
      const rId = profile?.restaurant_id;
      setRestaurantId(rId);

      if (!rId) {
          console.error("No restaurant ID found for user");
          // Optionally handle this state (e.g. empty tables)
          return;
      }

      // 0.5 Fetch Restaurant Details (Using Service)
      const restaurantData = await getRestaurantById(rId);
      setRestaurant(restaurantData);

      // 1. Fetch Tables
      const { data: tablesData } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", rId)
        .order("table_number", { ascending: true });

      setTables(tablesData || []);

      // 2. Fetch Sessions & Orders (Active sessions only -> not closed)
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select(
          `
          *,
          bills (*),
          order_items (
            id,
            status,
            quantity,
            unit_price_at_order,
            created_at,
            product_id,
            product:products ( title, price, image_url ) 
          ),
          service_requests (
            id,
            status,
            request_type
          )
        `
        )
        .eq("restaurant_id", rId)
        .neq("status", "closed");

      if (error) console.error("Session fetch error:", error);

      setSessions(sessionsData || []);
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Setup Realtime Listener with DELAY
  useEffect(() => {
    fetchData();

    // Helper function to debounce fetch
    const handleRealtimeUpdate = (payload) => {
      // console.log(`🔔 Realtime Signal (${payload.eventType})`);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        // console.log("⏳ Fetching new data...");
        fetchData();
      }, 500);
    };

    const channel = supabase
      .channel("restaurant-dashboard-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        handleRealtimeUpdate
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        handleRealtimeUpdate
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests" },
        handleRealtimeUpdate
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bills" },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchData]);

  // 3. Checkout Logic (Shared)
  const handleCheckout = async (sessionId, type, data) => {
      try {
           // Dynamic import to avoid cycles or heavy loads if unnecessary
           const { cashierService } = await import("@/services/cashierService");
           const result = await cashierService.processPayment(sessionId, type, data);
           
           if (result.success) {
               // Optimistic or Refetch
               fetchData();
               return { success: true };
           }
      } catch (error) {
          console.error("Checkout validation failed:", error);
          return { success: false, error };
      }
  };

  return { tables, sessions, loading, restaurantId, restaurant, refetch: fetchData, handleCheckout };
};
