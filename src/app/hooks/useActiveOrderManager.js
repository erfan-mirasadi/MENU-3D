import { useRestaurantFeatures } from "./useRestaurantFeatures";
import { useLanguage } from "@/context/LanguageContext";
import { useOrderState } from "./ActiveOrder/useOrderState";
import { useCartOperations } from "./ActiveOrder/useCartOperations";
import { useTableOperations } from "./ActiveOrder/useTableOperations";
import { useOrderDispatch } from "./ActiveOrder/useOrderDispatch";
import { useGroupedItemEdits } from "./ActiveOrder/useGroupedItemEdits";

export const useActiveOrderManager = (
  session,
  table,
  onCheckout,
  role = "waiter",
  onCloseDrawer,
  onRefetch,
) => {
  const { features } = useRestaurantFeatures();
  const { t } = useLanguage();
  // Core State Ledger
  const stateManager = useOrderState(session);
  const {
    loadingOp,
    setLoadingOp,
    localItems,
    pendingItems,
    confirmedItems,
    activeItems,
    totalAmount,
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
    confirmedEdits,
    setConfirmedEdits,
  } = stateManager;

  // Draft & Cart Operations
  const cartOps = useCartOperations({ ...stateManager, t });

  // Table & Void Operations
  const tableOps = useTableOperations({
    session,
    table,
    localItems,
    setLoadingOp,
    setIsVoidModalOpen,
    setItemToVoid,
    itemToVoid,
    setSessionItems: stateManager.setSessionItems,
    onCloseDrawer,
    t,
  });

  // Grouped Edits
  const groupedEditOps = useGroupedItemEdits({ ...stateManager, t });

  // Checkout & Confirmation Logic
  const dispatchOps = useOrderDispatch({
    session,
    table,
    features,
    ...stateManager,
    t,
    onCheckout,
  });

  // Tie voiding back to the group edit manager if necessary
  const handleConfirmVoid = async (reason) => {
    if (!itemToVoid) return;
    if (itemToVoid.actionType === "GROUPED_SAVE") {
      return await groupedEditOps.executeGroupUpdate(reason);
    }
    return await tableOps.handleConfirmVoid(reason);
  };

  const handlePaymentRequest = async () => {
    if (onRefetch) {
      setLoadingOp("FETCHING_LATEST");
      try {
        await onRefetch();
      } catch (e) {
        console.error("Failed to refetch session", e);
      } finally {
        setLoadingOp(null);
      }
    }
    setIsPaymentModalOpen(true);
  };

  return {
    state: {
      loadingOp,
      loading: !!loadingOp,
      localItems,
      pendingItems,
      confirmedItems,
      activeItems,
      totalAmount,
      isMenuOpen,
      isPaymentModalOpen,
      isVoidModalOpen,
      itemToVoid,
      isEditingGroup,
      groupedItems,
    },
    setters: {
      setIsMenuOpen,
      setIsPaymentModalOpen,
      setIsVoidModalOpen,
      setGroupedItems,
    },
    actions: {
      // Table Ops
      handleStartSession: tableOps.handleStartSession,
      handleForceCloseTable: tableOps.handleForceCloseTable,

      // Cart Ops
      handleMenuAdd: cartOps.handleMenuAdd,
      handleMenuRemove: cartOps.handleMenuRemove,
      onUpdateQty: cartOps.onUpdateQty,
      onDeleteItem: cartOps.onDeleteItem,

      // Grouped Edit Ops
      handleStartGroupEdit: groupedEditOps.handleStartGroupEdit,
      handleCancelGroupEdit: groupedEditOps.handleCancelGroupEdit,
      handleSaveGroupEdit: groupedEditOps.handleSaveGroupEdit,
      handleConfirmVoid, // Overridden wrapper for both void & grouped edit

      // Checkout & Confirm Ops
      handleConfirmOrder: () =>
        dispatchOps.handleConfirmOrder(confirmedEdits, setConfirmedEdits),
      handleStartPreparing: () =>
        dispatchOps.handleStartPreparing(confirmedEdits, setConfirmedEdits),
      handleCashierInstantSend: dispatchOps.handleCashierInstantSend,
      handleCheckoutWrapper: dispatchOps.handleCheckoutWrapper,
      handlePaymentRequest,
    },
  };
};
