"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/userService";
import { getRestaurantById } from "@/services/restaurantService";

// --- CONTEXT DEFINITION ---
const RestaurantContext = createContext(null);

// --- PROVIDER COMPONENT ---
// This acts as a Singleton for data fetching.
// It should be wrapped around the root of the application (e.g. layout.js)
export const RestaurantProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use a Ref to access the latest sessions inside the realtime callback without re-subscribing
  const sessionsRef = useRef(sessions);
  const timeoutRef = useRef(null);

  // Keep Ref updated
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // 1. Fetch Data
  const fetchData = useCallback(async () => {
    try {
      console.log("🔄 Fetching Data (Singleton Context)..."); 
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure we have the restaurant ID
      let rId = restaurantId;
      if (!rId) {
        const profile = await getUserProfile(supabase, user.id);
        rId = profile?.restaurant_id;
        setRestaurantId(rId);

        if (rId) {
            const restaurantData = await getRestaurantById(rId);
            setRestaurant(restaurantData);
        }
      }

      if (!rId) {
          console.error("❌ No restaurant ID found");
          return;
      }

      // Fetch Tables
      const { data: tablesData } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", rId)
        .order("table_number", { ascending: true });

      setTables(tablesData || []);

      // Fetch Sessions
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select(`
          *,
          bills (*),
          order_items (
            id, status, quantity, unit_price_at_order, created_at, product_id, session_id, added_by_guest_id,
            product:products ( title, price, image_url ) 
          ),
          service_requests ( id, status, request_type )
        `)
        .eq("restaurant_id", rId)
        .neq("status", "closed");

      if (error) console.error("Session fetch error:", error);

      setSessions(sessionsData || []);

    } catch (error) {
      console.error("Error fetching restaurant data:", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // 2. Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. Setup Realtime Listener (High-Performance Version)
  useEffect(() => {
    if (!restaurantId) return;

     console.log("🔌 Context: Subscribing to Restaurant Channel...");
    const channel = supabase.channel(`restaurant-${restaurantId}`);

    const handleUpdate = () => {
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       timeoutRef.current = setTimeout(() => {
           fetchData();
       }, 500); // 500ms debounce
    };

    channel
      // Subscription 1 (Table Activity): Only INSERT and UPDATE for this restaurant
      .on(
        "postgres_changes",
        { 
            event: "INSERT", 
            schema: "public", 
            table: "sessions", 
            filter: `restaurant_id=eq.${restaurantId}` 
        },
        handleUpdate
      )
      .on(
        "postgres_changes",
        { 
            event: "UPDATE", 
            schema: "public", 
            table: "sessions", 
            filter: `restaurant_id=eq.${restaurantId}` 
        },
        handleUpdate
      )
      
      // Subscription 2 (Requests): Only New Requests (INSERT)
      .on(
        "postgres_changes",
        { 
            event: "INSERT", 
            schema: "public", 
            table: "service_requests", 
            filter: `restaurant_id=eq.${restaurantId}` 
        },
        handleUpdate
      )

      // Subscription 3 (Orders): INSERT, UPDATE, and DELETE
      .on(
        "postgres_changes",
        { 
             event: "*", // Listen to all changes (including DELETE)
             schema: "public", 
             table: "order_items" 
        },
        (payload) => {
             const currentSessions = sessionsRef.current;
             const sessionId = payload.new?.session_id || payload.old?.session_id;
             
             const relevantSession = currentSessions.find(s => s.id === sessionId);
             if (relevantSession) handleUpdate();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
       console.log("🧹 Context: Cleanup Unsubscribing");
      setIsConnected(false);
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [restaurantId, fetchData]); // Dependencies: only external IDs and stable fetch function

  // 4. Checkout Logic
  const handleCheckout = async (sessionId, type, data) => {
      try {
           const { cashierService } = await import("@/services/cashierService");
           const result = await cashierService.processPayment(sessionId, type, data);
           
           if (result.success) {
               fetchData();
               return { success: true };
           }
      } catch (error) {
          console.error("Checkout validation failed:", error);
          return { success: false, error };
      }
  };

  const value = useMemo(() => ({ 
      tables, 
      sessions, 
      loading, 
      restaurantId, 
      restaurant, 
      refetch: fetchData, 
      handleCheckout, 
      isConnected 
  }), [tables, sessions, loading, restaurantId, restaurant, fetchData, isConnected]);

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};

// --- SINGLETON HOOK ---
export const useRestaurantData = () => {
    const context = useContext(RestaurantContext);
    if (!context) {
        // Fallback for pages that might not be wrapped yet or during migration
        console.warn("useRestaurantData used outside of Provider");
        return { loading: true, tables: [], sessions: [] }; 
    }
    return context;
};
