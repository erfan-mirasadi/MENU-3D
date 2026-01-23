import { useEffect, useState, useRef } from "react";
import { getTableByNumber } from "@/services/tableService";
import { getActiveSession, createSession } from "@/services/sessionService";
import {
  addOrderItem,
  updateOrderItemQuantity,
  removeOrderItem,
  submitDraftOrders,
} from "@/services/orderService";
import { useClientSession } from "./useClientSession";

export const useCart = (tableNumberFromUrl, restaurantId) => {
  const [cartItems, setCartItems] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // استفاده از Ref برای جلوگیری از رندرهای تکراری در لاگ
  const sessionRef = useRef(null);

  // 1. Setup Session & Guest
  useEffect(() => {
    if (!tableNumberFromUrl || !restaurantId) return;

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
        const tableData = await getTableByNumber(tableNumberFromUrl, restaurantId);

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
  }, [tableNumberFromUrl, restaurantId]);



  // 2. Use Optimized Client Session Hook
  const { orders: realtimeOrders, sessionData } = useClientSession(sessionId);

  // Sync realtime orders to local cartItems state (handling optimistic updates is tricky, 
  // but usually we let server state override local state when it arrives)
  useEffect(() => {
      if (realtimeOrders) {
          setCartItems(realtimeOrders);
          setIsLoading(false);
      }
  }, [realtimeOrders]);

  // (Removed manual fetchCartItems and manual subscription)


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
      console.log("Error, strictly relying on realtime to recover");
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
      console.log("Error, strictly relying on realtime to recover");
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
    sessionData,
  };
};

