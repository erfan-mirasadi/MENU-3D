"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { playNotificationSound } from "@/lib/sound";
import { getUserProfile } from "@/services/userService";
import { getRestaurantById } from "@/services/restaurantService";
import toast from "react-hot-toast";
import { RiNotification3Line, RiCheckDoubleLine } from "react-icons/ri";

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
  const lastNotificationTimeRef = useRef(0); // [NEW] Debounce Ref

  // Keep Ref updated
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // 1. Initial Session Check (Runs ONCE on mount)
  useEffect(() => {
      async function checkSession() {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              console.log("� [Init] Session found, starting initial fetch...");
              fetchData();
          }
      }
      checkSession();
  }, []);

  // 2. Auth Listener (Only for Logout or unexpected state changes)
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          //console.log(` [Auth Listener] Event captured: ${event}`);
          
          if (event === 'SIGNED_OUT') {
              console.log("👋 User Signed Out. Clearing Data.");
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
        console.log(`📡 [useRestaurantData] Fetching Operational Data for Restaurant ID: ${rId} ...`);
        
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
            tables (id, table_number),
            bills (id, total_amount, paid_amount, remaining_amount, status, adjustments),
            order_items (
                id, status, quantity, unit_price_at_order, created_at, product_id, session_id, added_by_guest_id,
                product:products ( title, price, image_url ) 
            ),
            service_requests ( id, status, request_type )
            `)
            .eq("restaurant_id", rId)
            .neq("status", "closed");

        if (error) console.error("❌ Session fetch error:", error);

        console.log(`✅ [useRestaurantData] Data Loaded. Tables: ${formattedTables.length}, Sessions: ${sessionsData?.length || 0}`);
        
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
           console.log("⏱️ Debounce Trigger: Fetching Data...");
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

             // [NEW] Notification Logic
             if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newStatus = payload.new?.status;
                const pathname = window.location.pathname;
                
                // Ignore Drafts Globally (Prevent "Leak")
                if (newStatus === 'draft') return;

                // Strict Filter for Chef (Performance Optimization)
                // User Request: Chef should only react when status is 'preparing' (or other kitchen statuses)
                if (pathname.includes('/chef')) {
                    const relevantKitchenStatuses = ['preparing', 'ready', 'served', 'cancelled'];
                    if (!relevantKitchenStatuses.includes(newStatus)) {
                        return; // Completely ignore this event for Chef
                    }
                }

                // Client App Filter: Only listen to updates for the CURRENT Table
                const isStaff = pathname.includes('/chef') || pathname.includes('/waiter') || pathname.includes('/cashier') || pathname.includes('/admin');
                
                if (!isStaff) {
                    // Try to find the session to see which table it belongs to
                    const eventSession = currentSessions.find(s => s.id === sessionId);
                    
                    if (eventSession) {
                        // Check if the URL contains this session's table ID
                        // This is a robust way to ensure we are looking at the right table page
                        // URL pattern: /slug/tableId
                        const tableId = eventSession.table_id;
                         
                        // If the URL doesn't contain the tableId, we ignore this update
                        // (User is viewing Table A, but update is for Table B)
                        if (!pathname.includes(tableId)) {
                             console.log(`🔇 [Filtered] Realtime Update for Table ${tableId} (User on different table)`);
                             return; 
                        }
                    }
                }

                console.log("🔔 [Realtime] Processing Update:", { event: payload.eventType, table: payload.table, status: newStatus }); 

                // Conditions to Notify & Select Sound
                let shouldPlay = false;
                let soundParams = {}; // Default to standard sound

                // Waiter: Pending (Draft -> Pending)
                if (
                    (pathname.includes('/waiter') || pathname.includes('/admin')) &&
                    newStatus === 'pending'
                ) {
                    shouldPlay = true;
                }

                // B) Cashier Notification ONLY: Waiter Confirms Order (Pending -> Confirmed)
                if (
                    (pathname.includes('/cashier') || pathname.includes('/admin')) &&
                    newStatus === 'confirmed'
                ) {
                     shouldPlay = true;
                }

                // C) Chef Notification: Order Status changes to Preparing
                if (
                    (pathname.includes('/chef') || pathname.includes('/admin')) &&
                    newStatus === 'preparing'
                ) {
                     shouldPlay = true;
                }

                // D) Waiter/Cashier Notification: Order Served
                // User Request: ONLY 'served' status, and use 'bell.mp3'
                if (
                    (pathname.includes('/waiter') || pathname.includes('/cashier') || pathname.includes('/admin')) && 
                    newStatus === 'served'
                ) {
                    shouldPlay = true;
                    soundParams = { sound: '/sounds/bell.mp3' };
                }

                // Debounce Sound & Toasts (Batching)
                const now = Date.now();
                if (shouldPlay && (now - lastNotificationTimeRef.current > 2000)) {
                    // Play specific sound if defined, otherwise default
                    playNotificationSound(soundParams.sound);
                    // --- TOAST LOGIC ---
                    const getTableNumber = (sId) => {
                         const session = sessionsRef.current.find(s => s.id === sId);
                         return session?.tables?.table_number || "?";
                    };
                    const sessionID = payload.new?.session_id || payload.old?.session_id;
                    const tableNum = getTableNumber(sessionID)
                    // Chef Toast: New Order (Preparing)
                    if ((pathname.includes('/chef') || pathname.includes('/admin')) && newStatus === 'preparing') {
                        toast(`Kitchen Order: Table ${tableNum}`, {
                             icon: <RiNotification3Line className="text-orange-500" />,
                             duration: 5000,
                             style: {
                                 border: '1px solid #f97316',
                                 background: '#fff7ed',
                                 color: '#c2410c'
                             }
                        });
                    }
                    // Waiter/Cashier Toast: Order Served
                    if ((pathname.includes('/waiter') || pathname.includes('/cashier') || pathname.includes('/admin')) && 
                        newStatus === 'served') {
                        // "Hazer mishe" -> Food Ready (mapped to served status)
                        toast.success(`Table ${tableNum}: Food Ready!`, {
                            icon: <RiCheckDoubleLine className="text-green-500" />,
                            duration: 5000
                        });
                    }
                    lastNotificationTimeRef.current = now;
                }
             }
             
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
