import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/userService";

export const useCashierData = () => {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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
       
      const restaurantId = profile?.restaurant_id;

      if (!restaurantId) {
           console.error("No restaurant ID found for cashier");
           return;
      }

      // 1. Fetch Tables
      const { data: tablesData } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number", { ascending: true });

      setTables(tablesData || []);

      // 2. Fetch Sessions & Orders (Active sessions only)
      // Cashier likely needs to see active sessions to take payment or manage orders.
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select(
          `
          *,
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
        .eq("restaurant_id", restaurantId)
        .neq("status", "closed");

      if (error) console.error("Session fetch error:", error);

      setSessions(sessionsData || []);
    } catch (error) {
      console.error("Error fetching cashier data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Setup Realtime Listener with DELAY
  useEffect(() => {
    fetchData();

    // Helper function to debounce fetch
    const handleRealtimeUpdate = (payload) => {
      console.log(`🔔 Realtime Signal (${payload.eventType})`);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        console.log("⏳ Fetching new data...");
        fetchData();
      }, 500);
    };

    const channel = supabase
      .channel("cashier-dashboard-global")
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchData]);

  // 3. Checkout Logic
  const handleCheckout = async (sessionId, paymentMethod, amount) => {
      try {
           const { cashierService } = await import("@/services/cashierService");
           const result = await cashierService.processPayment(sessionId, paymentMethod, amount);
           
           if (result.success) {
               // Optimistic update or just let realtime handle it?
               // Realtime will catch the 'closed' session status and remove it from list.
               // We can manually refetch to be sure instant feedback.
               fetchData();
               return { success: true };
           }
      } catch (error) {
          console.error("Checkout validation failed:", error);
          return { success: false, error };
      }
  };

  return { tables, sessions, loading, restaurantId: tables[0]?.restaurant_id, refetch: fetchData, handleCheckout };
};
