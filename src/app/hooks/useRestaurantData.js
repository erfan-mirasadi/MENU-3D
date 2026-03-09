"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { playNotificationSound } from "@/lib/sound";
import { getCurrentUser, subscribeToAuthState, getCurrentUserProfile } from "@/services/authService";
import { getRestaurantById, getRestaurantByOwnerId, getOperationalTables, getOperationalSessions, getRestaurantRealtimeChannel, cleanupRestaurantRealtimeChannel } from "@/services/restaurantService";
import toast from "react-hot-toast";
import { RiNotification3Line, RiCheckDoubleLine } from "react-icons/ri";
import { processPaymentLogic } from "@/services/paymentService";

const RestaurantContext = createContext(null);

// This acts as a Singleton for data fetching.
// It should be wrapped around the root of the application (e.g. layout.js)
export default function RestaurantProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use a Ref to access the latest sessions inside the realtime callback without re-subscribing
  const sessionsRef = useRef(sessions);
  const timeoutRef = useRef(null);
  const lastNotificationTimeRef = useRef(0);

  // Keep Ref updated
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Auth Listener — handles both initial session and post-login navigation
  useEffect(() => {
      const subscription = subscribeToAuthState((event, session) => {  
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              if (session?.user) {
                  fetchData();
              } else {
                  setLoading(false);
              }
          }

          if (event === 'SIGNED_OUT') {
              setTables([]);
              setSessions([]);
              setRestaurant(null);
              setRestaurantId(null);
              setLoading(false);
          }
      });
      return () => subscription.unsubscribe();
  }, []);

  // Fetch Operational Data (Tables & Sessions) - Efficient re-fetcher
  const fetchOperationalData = useCallback(async (rId) => {


    try {
        console.log(`📡 [useRestaurantData] Fetching Operational Data for Restaurant ID: ${rId} ...`);
        
        // Fetch Tables and Sessions concurrently
        const [tablesData, sessionsData] = await Promise.all([
            getOperationalTables(rId).catch(err => {
                console.error("❌ Table Fetch Error:", err);
                return [];
            }),
            getOperationalSessions(rId).catch(err => {
                console.error("❌ Session fetch error:", err);
                return [];
            })
        ]);
        
        console.log(`✅ [useRestaurantData] Data Loaded. Tables: ${tablesData?.length || 0}, Sessions: ${sessionsData?.length || 0}`);
        
        // Flatten layout_data to top-level properties (x, y, width, etc.)
        const formattedTables = (tablesData || []).map(table => ({
            ...table,
            ...(table.layout_data || {})
        }));

        setTables(formattedTables);
        setSessions(sessionsData || []);
    } catch (error) {
        console.error("Error fetching operational data:", error);
    }
  }, []);

  // Fetch All Data (Initial Setup)
  const fetchData = useCallback(async () => {
    try {
      // Fetching Data (Singleton Context)... 
      const user = await getCurrentUser();
      if (!user) return;

      // Ensure we have the restaurant ID
      let rId = restaurantId;
      if (!rId) {
        const profile = await getCurrentUserProfile(user.id);
        rId = profile?.restaurant_id;
        
        if (rId) {
            setRestaurantId(rId);
            const restaurantData = await getRestaurantById(rId);
            setRestaurant(restaurantData);
        } else {
            // Fallback: Check if user owns a restaurant directly
            const ownedRestaurant = await getRestaurantByOwnerId(user.id);
            if (ownedRestaurant) {
                rId = ownedRestaurant.id;
                setRestaurantId(rId);
                setRestaurant(ownedRestaurant);
            }
        }
      }

      if (!rId) {
          if (!window.location.pathname.includes('/onboarding')) {
              console.error("❌ No restaurant ID found");
          }
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

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Setup Realtime Listener (High-Performance Version)
  useEffect(() => {
    if (!restaurantId) return;

    // OPTIMIZATION Disable Realtime for Admin Panel
    // Admin pages (Dashboard, Tables, etc.) do not need live order updates.
    // They rely on manual refetching (swr-style) or page reloads.
    if (window.location.pathname.includes('/admin')) return;
    const channel = getRestaurantRealtimeChannel(restaurantId);

    const handleUpdate = () => {
       // Disable Realtime for Admin
       if (window.location.pathname.includes('/admin')) return;

       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       timeoutRef.current = setTimeout(() => {
           console.log("⏱️ Debounce Trigger: Fetching Data...");
           fetchOperationalData(restaurantId);
       }, 500);
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
             // Disable Realtime for Admin
             if (window.location.pathname.includes('/admin')) return;

             const currentSessions = sessionsRef.current;
             const sessionId = payload.new?.session_id || payload.old?.session_id;

             // Notification Logic
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
                const isStaff = pathname.includes('/chef') || pathname.includes('/waiter') || pathname.includes('/cashier');
                
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


                // Cashier Notification ONLY: Waiter Confirms Order (Pending -> Confirmed)
                if (
                    pathname.includes('/cashier') &&
                    newStatus === 'confirmed'
                ) {
                     shouldPlay = true;
                }

                // Chef Notification: Order Status changes to Preparing
                if (
                    pathname.includes('/chef') &&
                    newStatus === 'preparing'
                ) {
                     shouldPlay = true;
                }

                // Cashier Notification: Order Served
                // Removed Waiter from here as PWA handles native notifications now
                if (
                    pathname.includes('/cashier') && 
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
                    const getTableNumber = (sId) => {
                         const session = sessionsRef.current.find(s => s.id === sId);
                         return session?.tables?.table_number || "?";
                    };
                    const sessionID = payload.new?.session_id || payload.old?.session_id;
                    const tableNum = getTableNumber(sessionID)
                    // Chef Toast: New Order (Preparing)
                    if (pathname.includes('/chef') && newStatus === 'preparing') {
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
                    // Cashier Toast: Order Served
                    // Removed Waiter here too.
                    if (pathname.includes('/cashier') && newStatus === 'served') {
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
      cleanupRestaurantRealtimeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [restaurantId, fetchOperationalData]); // Dependencies: only external IDs and stable fetch function

  // Checkout Logic
  const handleCheckout = async (sessionId, type, data) => {
      try {
           const result = await processPaymentLogic(sessionId, type, data);
           
           if (result.success) {
               // Await refetch so callers get fresh data
               await fetchOperationalData(restaurantId);
               return { success: true, fullyPaid: result.fullyPaid };
           }
      } catch (error) {
          console.error("Checkout validation failed:", error);
          return { success: false, error };
      }
  };

  // Calculate Features (Stable & Unique)
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
      features,
      refetch: fetchData, 
      handleCheckout, 
      isConnected 
  }), [tables, sessions, loading, restaurantId, restaurant, features, fetchData, isConnected]);

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};


export function useRestaurantData() {
    const context = useContext(RestaurantContext);
    if (!context) {
        // Fallback for pages that might not be wrapped yet or during migration
        console.warn("useRestaurantData used outside of Provider");
        return { loading: true, tables: [], sessions: [] }; 
    }
    return context;
}
