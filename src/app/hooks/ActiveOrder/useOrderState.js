import { useState, useMemo } from "react";

export const useOrderState = (session) => {
  const [loadingOp, setLoadingOp] = useState(null);
  const [draftItems, setDraftItems] = useState([]);
  const [sessionItems, setSessionItems] = useState([]);
  const [optimisticLock, setOptimisticLock] = useState(null);
  const [confirmedEdits, setConfirmedEdits] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [itemToVoid, setItemToVoid] = useState(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupedItems, setGroupedItems] = useState([]);
  const [prevOrderItems, setPrevOrderItems] = useState(session?.order_items);
  const [blockedByLock, setBlockedByLock] = useState(false);

  if (
    session?.order_items !== prevOrderItems ||
    (blockedByLock && !optimisticLock)
  ) {
    setPrevOrderItems(session?.order_items);
    setBlockedByLock(false);

    if (session?.order_items) {
      const serverItems = session.order_items;

      if (optimisticLock) {
        const { targetStatus, count } = optimisticLock;
        const matchingItems = serverItems.filter(
          (i) =>
            i.status === targetStatus ||
            (targetStatus === "confirmed" &&
              ["preparing", "served"].includes(i.status)) ||
            (targetStatus === "preparing" && ["served"].includes(i.status)),
        );

        if (matchingItems.length < count) {
          console.log("Blocking stale update (State Lock Active)");
          setBlockedByLock(true);
        } else {
          setOptimisticLock(null);
          setLoadingOp(null);
          const sorted = [...serverItems].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at),
          );
          setSessionItems(sorted);
        }
      } else {
        const sorted = [...serverItems].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
        setSessionItems(sorted);
      }
    } else {
      setSessionItems([]);
    }
  }

  // Clear loading when session appears
  if (loadingOp === "START_SESSION" && session?.id) {
    setLoadingOp(null);
  }

  const localItems = useMemo(() => {
    const itemsWithEdits = sessionItems.map((item) => {
      if (
        (item.status === "confirmed" || item.status === "pending") &&
        confirmedEdits[item.id] !== undefined
      ) {
        return { ...item, quantity: confirmedEdits[item.id] };
      }
      return item;
    });
    return [...itemsWithEdits, ...draftItems];
  }, [sessionItems, draftItems, confirmedEdits]);

  // Derived lists
  const pendingItems = localItems.filter((i) => i.status === "pending");
  const confirmedItems = localItems.filter((i) => i.status === "confirmed");
  const activeItems = localItems.filter((i) =>
    ["preparing", "ready", "served"].includes(i.status),
  );

  const totalAmount = localItems
    .filter((item) =>
      ["confirmed", "preparing", "ready", "served"].includes(item.status),
    )
    .reduce(
      (sum, item) => sum + (item.unit_price_at_order || 0) * item.quantity,
      0,
    );

  return {
    loadingOp,
    setLoadingOp,
    draftItems,
    setDraftItems,
    sessionItems,
    setSessionItems,
    localItems,
    optimisticLock,
    setOptimisticLock,
    confirmedEdits,
    setConfirmedEdits,
    isMenuOpen,
    setIsMenuOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoidModalOpen,
    setIsVoidModalOpen,
    itemToVoid,
    setItemToVoid,
    isEditingGroup,
    setIsEditingGroup,
    groupedItems,
    setGroupedItems,
    pendingItems,
    confirmedItems,
    activeItems,
    totalAmount,
  };
};
