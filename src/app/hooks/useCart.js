import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getTableByNumber } from "@/services/tableService";
import { getActiveSession, createSession } from "@/services/sessionService";
import {
  getOrderItems,
  addOrderItem,
  updateOrderItemQuantity,
  removeOrderItem,
  submitDraftOrders,
} from "@/services/orderService";

export const useCart = (tableNumberFromUrl) => {
  const [cartItems, setCartItems] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // استفاده از Ref برای جلوگیری از رندرهای تکراری در لاگ
  const sessionRef = useRef(null);

  // 1. Setup Session & Guest
  useEffect(() => {
    if (!tableNumberFromUrl) return;

    const initializeSession = async () => {
      try {
        let storedGuestId = localStorage.getItem("menu_guest_id");
        if (!storedGuestId) {
          storedGuestId =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          localStorage.setItem("menu_guest_id", storedGuestId);
        }
        setGuestId(storedGuestId);

        console.log("🔍 Checking Table:", tableNumberFromUrl);
        const tableData = await getTableByNumber(tableNumberFromUrl);

        if (!tableData) {
          console.error("❌ Table not found");
          return;
        }

        const realTableUuid = tableData.id;
        const realRestaurantId = tableData.restaurant_id;

        let session = await getActiveSession(realTableUuid);
        if (!session) {
          console.log("🆕 Creating new session...");
          session = await createSession(realTableUuid, realRestaurantId);
        } else {
          console.log("✅ Found active session:", session.id);
        }

        setSessionId(session?.id);
        sessionRef.current = session?.id;
      } catch (err) {
        console.error("❌ Error init session:", err);
      }
    };

    initializeSession();
  }, [tableNumberFromUrl]);

  // تابع فچ کردن با لاگ دقیق
  const fetchCartItems = useCallback(async (triggeredBy = "Manual") => {
    const currentSessionId = sessionRef.current;
    if (!currentSessionId) return;

    // console.log(`📥 Fetching Items [Trigger: ${triggeredBy}]...`);

    // یک تاخیر کوچک برای اطمینان از اینکه دیتابیس آپدیت شده
    if (triggeredBy === "Realtime") {
      await new Promise((r) => setTimeout(r, 200));
    }

    const data = await getOrderItems(currentSessionId);

    console.log(`📊 Cart Data Updated (${data.length} items):`, data);
    setCartItems(data);
    setIsLoading(false);
  }, []);

  // 2. Fetch Cart Items & REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!sessionId) return;

    // بار اول فچ کن
    fetchCartItems("Initial Load");

    console.log("🔌 Subscribing to Realtime channel for session:", sessionId);

    const channel = supabase
      .channel(`room-${sessionId}`) // اسم کانال ساده‌تر
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "order_items",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log(
            "🔔 Realtime Event:",
            payload.eventType,
            payload.new || payload.old
          );

          // اگر آیتم جدید اضافه شده، دستی به استیت اضافه کن تا منتظر فچ نمونی (برای تست)
          if (payload.eventType === "INSERT") {
            console.log("⚡ Fast Update: Fetching new data...");
            fetchCartItems("Realtime");
          } else {
            fetchCartItems("Realtime");
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription Status: ${status}`);
      });

    return () => {
      console.log("🔌 Unsubscribing...");
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchCartItems]);

  // --- ACTIONS ---

  const addToCart = async (product) => {
    if (!sessionId || !guestId) return;

    try {
      const existingItem = cartItems.find(
        (item) => item.product_id === product.id && item.status === "draft"
      );

      // Optimistic Update Log
      console.log("🚀 Optimistic Add:", product.title);

      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );

        if (existingItem.id.toString().startsWith("temp-")) return;

        await updateOrderItemQuantity(
          existingItem.id,
          existingItem.quantity + 1
        );
      } else {
        const tempId = `temp-${Date.now()}`;
        setCartItems((prev) => [
          ...prev,
          {
            id: tempId,
            product_id: product.id,
            quantity: 1,
            unit_price_at_order: product.price,
            status: "draft",
            product: {
              title: product.title,
              price: product.price,
              image_url: product.image_url,
            },
          },
        ]);

        await addOrderItem({
          session_id: sessionId,
          product_id: product.id,
          quantity: 1,
          unit_price_at_order: product.price,
          added_by_guest_id: guestId,
          status: "draft",
        });
      }
    } catch (error) {
      console.error("❌ Add Error:", error);
      fetchCartItems("Error Recovery");
    }
  };

  const decreaseFromCart = async (itemId) => {
    try {
      const existingItem = cartItems.find((item) => item.id === itemId);
      if (!existingItem) return;
      if (existingItem.id.toString().startsWith("temp-")) return;

      console.log("🔻 Optimistic Decrease");

      if (existingItem.quantity > 1) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
          )
        );
        await updateOrderItemQuantity(
          existingItem.id,
          existingItem.quantity - 1
        );
      } else {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        await removeOrderItem(itemId);
      }
    } catch (error) {
      console.error("❌ Decrease Error:", error);
      fetchCartItems("Error Recovery");
    }
  };

  const removeFromCart = async (itemId) => {
    if (itemId.toString().startsWith("temp-")) return;
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    await removeOrderItem(itemId);
  };

  const submitOrder = async () => {
    if (!sessionId) return;
    await submitDraftOrders(sessionId);
  };

  return {
    cartItems,
    addToCart,
    decreaseFromCart,
    removeFromCart,
    submitOrder,
    isLoading,
  };
};
