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

  // Auth Listener to trigger fetch on login/restore
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              fetchData();
          } else if (event === 'SIGNED_OUT') {
              setTables([]);
              setSessions([]);
              setRestaurant(null);
              setRestaurantId(null);
              setLoading(false);
          }
      });
      return () => subscription.unsubscribe();
  }, []);

  // 1a. Fetch Operational Data (Tables & Sessions) - Efficient re-fetcher
  const fetchOperationalData = useCallback(async (rId) => {
    try {
        // Fetch Tables
        const { data: tablesData } = await supabase
            .from("tables")
            .select("id, restaurant_id, table_number, qr_token, layout_data") 
            .eq("restaurant_id", rId)
            .order("table_number", { ascending: true });
        
        // Flatten layout_data to top-level properties (x, y, width, etc.)
        const formattedTables = (tablesData || []).map(table => ({
            ...table,
            ...(table.layout_data || {})
        }));

        setTables(formattedTables);

        // Fetch Sessions
        const { data: sessionsData, error } = await supabase
            .from("sessions")
            .select(`
            id, created_at, status, table_id, restaurant_id, note,
            bills (id, total_amount, paid_amount, remaining_amount, status, adjustments),
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
        console.error("Error fetching operational data:", error);
    }
  }, []);

  // 1b. Fetch All Data (Initial Setup)
  const fetchData = useCallback(async () => {
    try {
      // Fetching Data (Singleton Context)... 
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

      // Fetch operational data using the dedicated function
      await fetchOperationalData(rId);

    } catch (error) {
      console.error("Error fetching restaurant data:", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, fetchOperationalData]);

  // 2. Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. Setup Realtime Listener (High-Performance Version)
  useEffect(() => {
    if (!restaurantId) return;

     // Context: Subscribing to Restaurant Channel...
    const channel = supabase.channel(`restaurant-${restaurantId}`);

    const handleUpdate = () => {
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       timeoutRef.current = setTimeout(() => {
           fetchOperationalData(restaurantId);
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
             table: "order_items",
             filter: `restaurant_id=eq.${restaurantId}`
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
       // Context: Cleanup Unsubscribing
      setIsConnected(false);
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [restaurantId, fetchData, fetchOperationalData]); // Dependencies: only external IDs and stable fetch function

  // 4. Checkout Logic
  const handleCheckout = async (sessionId, type, data) => {
      try {
           const { cashierService } = await import("@/services/cashierService");
           const result = await cashierService.processPayment(sessionId, type, data);
           
           if (result.success) {
               // Efficiently update tables/sessions without touching restaurant profile
               fetchOperationalData(restaurantId);
               return { success: true };
           }
      } catch (error) {
          console.error("Checkout validation failed:", error);
          return { success: false, error };
      }
  };

  // 5. Calculate Features (Stable & Unique)
  // We use a Ref to ensure we don't return a new object (and trigger re-renders) 
  // if the features content hasn't actually changed.
  const prevFeaturesRef = useRef(null);
  
  const features = useMemo(() => {
        const defaults = {
            menu: true,
            waiter: true,
            cashier: true,
            kitchen: true,
            ordering_enabled: true
        };
        
        let newFeatures = defaults;

        // If we have restaurant data, merge it
        if (restaurant) {
            newFeatures = { ...defaults, ...(restaurant.features || {}) };
        }

        // Deep Check: Has it actually changed?
        const prevStr = JSON.stringify(prevFeaturesRef.current);
        const newStr = JSON.stringify(newFeatures);

        if (prevStr === newStr && prevFeaturesRef.current) {
            return prevFeaturesRef.current;
        }

        // It changed (or first run)
        // Features changed or first run
        prevFeaturesRef.current = newFeatures;
        return newFeatures;
  }, [restaurant]);

  const value = useMemo(() => ({ 
      tables, 
      sessions, 
      loading, 
      restaurantId, 
      restaurant, 
      features, // Exported to context
      refetch: fetchData, 
      handleCheckout, 
      isConnected 
  }), [tables, sessions, loading, restaurantId, restaurant, features, fetchData, isConnected]);

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
