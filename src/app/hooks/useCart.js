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
import { ORDER_STATUS } from "@/lib/constants";
import { triggerStaffPushNotification } from "@/services/notificationService";

export const useCart = (tableNumberFromUrl, restaurantId) => {
  const [cartItems, setCartItems] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [isLoading, setIsLoading] = useState(
    () => !!(tableNumberFromUrl && restaurantId),
  );
  const sessionRef = useRef(null);
  // Track initialization to avoid loop
  const initializationRef = useRef({
    tableNumber: null,
    restaurantId: null,
    started: false,
  });

  //  Setup Session & Guest
  useEffect(() => {
    if (!tableNumberFromUrl || !restaurantId) {
      return;
    }

    // Prevent duplicate triggers for the exact same table & restaurant
    if (
      initializationRef.current.started &&
      initializationRef.current.tableNumber === tableNumberFromUrl &&
      initializationRef.current.restaurantId === restaurantId
    ) {
      return;
    }

    initializationRef.current = {
      tableNumber: tableNumberFromUrl,
      restaurantId: restaurantId,
      started: true,
    };

    const controller = new AbortController();
    const signal = controller.signal;
    let ignore = false;

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
        if (!ignore) setGuestId(storedGuestId);

        console.log("🔍 Checking Table:", tableNumberFromUrl);
        const tableData = await getTableByNumber(
          tableNumberFromUrl,
          restaurantId,
          signal,
        );

        if (ignore || signal.aborted) return;

        if (!tableData) {
          console.error("❌ Table not found");
          setIsLoading(false);
          return;
        }

        const realTableUuid = tableData.id;
        if (!ignore) setTableId(realTableUuid); // Store resolved UUID
        const realRestaurantId = tableData.restaurant_id;

        // Check for active session
        let session = await getActiveSession(realTableUuid, signal);
        if (ignore || signal.aborted) return;
        if (!session) {
          console.log("🆕 Creating new session...");
          session = await createSession(
            realTableUuid,
            realRestaurantId,
            signal,
          );
        } else {
          console.log("✅ Found active session:", session.id);
        }
        if (ignore || signal.aborted) return;
        setSessionId(session?.id);
        sessionRef.current = session?.id;
      } catch (err) {
        if (!ignore && !signal.aborted) {
          console.error("❌ Error init session:", err);
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      ignore = true;
      controller.abort();
      console.log(
        "🧹 Cleanup: Ignoring stale session initialization and aborting requests",
      );
      initializationRef.current.started = false; // Reset on cleanup
    };
  }, [tableNumberFromUrl, restaurantId]);

  const { orders: realtimeOrders, sessionData } = useClientSession(sessionId);

  // Sync realtime orders to local cartItems state (adjust during render)
  const [prevRealtimeOrders, setPrevRealtimeOrders] = useState(realtimeOrders);
  if (realtimeOrders !== prevRealtimeOrders) {
    setPrevRealtimeOrders(realtimeOrders);
    if (realtimeOrders) {
      setCartItems(realtimeOrders);
      setIsLoading(false);
    }
  }

  // (Removed manual fetchCartItems and manual subscription)
  const addToCart = async (product) => {
    if (!sessionId || !guestId) return;

    try {
      const existingItem = cartItems.find(
        (item) =>
          item.product_id === product.id && item.status === ORDER_STATUS.DRAFT,
      );

      console.log("🚀 Optimistic Add:", product.title);

      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );

        if (existingItem.id.toString().startsWith("temp-")) return;

        await updateOrderItemQuantity(
          existingItem.id,
          existingItem.quantity + 1,
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
            status: ORDER_STATUS.DRAFT,
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
          added_by_guest_id: guestId,
          status: ORDER_STATUS.DRAFT,
        });
      }
    } catch (error) {
      console.error("❌ Add Error:", error);
      console.log("Error, strictly relying on realtime to recover");
    }
  };

  const decreaseFromCart = async (itemId) => {
    if (!sessionId || !guestId) return;
    try {
      const existingItem = cartItems.find((item) => item.id === itemId);
      if (!existingItem) return;
      if (existingItem.id.toString().startsWith("temp-")) return;

      console.log("🔻 Optimistic Decrease");

      if (existingItem.quantity > 1) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          ),
        );
        await updateOrderItemQuantity(
          existingItem.id,
          existingItem.quantity - 1,
        );
      } else {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        try {
          await removeOrderItem(itemId);
        } catch (err) {
          console.error("❌ Database Delete Error", err);
          setCartItems((prev) => [...prev, existingItem]);
        }
      }
    } catch (error) {
      console.error("❌ Decrease Error:", error);
      console.log("Error, strictly relying on realtime to recover");
    }
  };

  const removeFromCart = async (itemId) => {
    if (!sessionId || !guestId) return;
    if (itemId.toString().startsWith("temp-")) return;
    const existingItem = cartItems.find((item) => item.id === itemId);
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    try {
      await removeOrderItem(itemId);
      console.log("✅ Item removed from database successfully.");
    } catch (err) {
      console.error("❌ Database Delete Error", err);
      if (existingItem) setCartItems((prev) => [...prev, existingItem]);
    }
  };

  const submitOrder = async () => {
    if (!sessionId) return;
    await submitDraftOrders(sessionId);
    // Fetch the table to get the table number for the notification
    const tableData = await getTableByNumber(tableNumberFromUrl, restaurantId);
    if (tableData) {
      triggerStaffPushNotification(
        "NEW_ORDER",
        restaurantId,
        tableData.table_number,
      );
    }
  };

  return {
    cartItems,
    addToCart,
    decreaseFromCart,
    removeFromCart,
    submitOrder,
    isLoading,
    sessionData,
    tableId: tableId,
  };
};
