import { useEffect, useState, useCallback } from "react";
import {
  getSessionWithOrders,
  subscribeToClientSession,
} from "@/services/sessionService";

export const useClientSession = (sessionId) => {
  const [sessionData, setSessionData] = useState(null);
  const [orders, setOrders] = useState([]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    const data = await getSessionWithOrders(sessionId);

    if (data) {
      setSessionData(data);
      setOrders(data.order_items || []);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();

    if (!sessionId) return;

    const unsubscribe = subscribeToClientSession(
      sessionId,
      (newSession) => {
        setSessionData((prev) => ({ ...prev, ...newSession }));
      },
      () => {
        fetchSession();
      },
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId, fetchSession]);

  return { sessionData, orders };
};
