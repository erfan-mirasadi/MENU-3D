"use client";

import { useEffect, useRef } from "react";
import { useRestaurantData } from "@/app/hooks/useRestaurantData";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { RiNotification3Line, RiCheckDoubleLine } from "react-icons/ri";

const NotificationManager = ({ role }) => {
  const { restaurantId, sessions } = useRestaurantData();
  
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Debounce Refs
  const lastToastRef = useRef({});

  useEffect(() => {
    if (!restaurantId) return;

    // Helper: Throttled Toast
    const safeToast = (key, callback) => {
        const now = Date.now();
        if (lastToastRef.current[key] && now - lastToastRef.current[key] < 2000) {
            return; // Too soon
        }
        lastToastRef.current[key] = now;
        callback();
    };

    // Async Table Lookup (Cache First -> DB Fallback)
    const getTableNumber = async (sessionId) => {
        // 1. Try Cache
        const session = sessionsRef.current.find(s => s.id === sessionId);
        if (session?.tables?.table_number) return session.tables.table_number;

        // 2. Fetch from DB
        try {
            const { data } = await supabase
                .from('sessions')
                .select('*, tables(table_number)')
                .eq('id', sessionId)
                .single();
            return data?.tables?.table_number || "?";
        } catch (err) {
            console.error("Error fetching table number:", err);
            return "?";
        }
    };

    const channel = supabase
      .channel(`notifications-${restaurantId}-${role}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          // 1. KITCHEN NOTIFICATION: New Order
          if (role === 'chef') {
             if (payload.new.status === 'confirmed') {
                 const tableNum = await getTableNumber(payload.new.session_id);
                 safeToast(`new-order-${payload.new.session_id}`, () => {
                     toast(`New Order: Table ${tableNum}`, {
                         icon: <RiNotification3Line className="text-orange-500" />,
                         duration: 5000,
                         style: {
                             border: '1px solid #f97316',
                             background: '#fff7ed',
                             color: '#c2410c'
                         }
                     });
                 });
             }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          // 2. WAITER/CASHIER NOTIFICATION: Food Ready/Served
          if (role === 'waiter' || role === 'cashier') {
              const { _old, new: newItem } = payload;
              
              if (newItem.status === 'served') { 
                  const tableNum = await getTableNumber(newItem.session_id);
                  const title = role === 'waiter' ? "Order Ready to Serve" : "Order Ready";
                  
                  safeToast(`ready-${newItem.session_id}`, () => {
                      toast.success(`Table ${tableNum}: Food Ready!`, {
                          icon: <RiCheckDoubleLine className="text-green-500" />,
                          duration: 5000
                      });
                  });
              }
          }
          
          // Kitchen: New Order via Update (Draft -> Confirmed)
          if (role === 'chef') {
              if (payload.new.status === 'confirmed' && payload.old.status !== 'confirmed') {
                  const tableNum = await getTableNumber(payload.new.session_id);
                   safeToast(`new-order-${payload.new.session_id}`, () => {
                     toast(`New Order: Table ${tableNum}`, {
                         icon: <RiNotification3Line className="text-orange-500" />,
                         duration: 5000,
                         style: {
                             border: '1px solid #f97316',
                             background: '#fff7ed',
                             color: '#c2410c'
                         }
                     });
                 });
              }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, role]);

  return null;
};

export default NotificationManager;
