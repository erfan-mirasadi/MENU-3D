import toast from "react-hot-toast";
import { startTableSession, closeTableSession } from "@/services/staffService";
import { voidOrderItem } from "@/services/orderService";

export const useTableOperations = ({
  session,
  table,
  localItems,
  setLoadingOp,
  setIsVoidModalOpen,
  setItemToVoid,
  itemToVoid,
  setSessionItems,
  onCloseDrawer,
  groupedEditManager,
  t
}) => {
  const handleStartSession = async () => {
    setLoadingOp('START_SESSION');
    try {
      await startTableSession(table.id, table.restaurant_id);
      toast.success(t('tableStarted'));
    } catch (error) {
      toast.error(t('failedToStart'));
      setLoadingOp(null);
    }
  };

  const closeTableWithVoid = async (reason) => {
    setLoadingOp('CLOSE_TABLE');
    try {
        const active = localItems.filter(i => ['confirmed', 'preparing', 'served'].includes(i.status));
        const promises = active.map(i => voidOrderItem(i.id, reason || "Table Force Closed"));
        await Promise.all(promises);
        await closeTableSession(session.id);
        toast.success(t('tableClosedVoided'));
        setIsVoidModalOpen(false);
        setItemToVoid(null);
        if (onCloseDrawer) onCloseDrawer();
    } catch (e) {
        toast.error("Failed to close: " + e.message);
    } finally {
        setLoadingOp(null);
    }
  };

  const handleForceCloseTable = async () => {
      if (!confirm("Are you sure you want to close this table? This action cannot be undone.")) {
          return;
      }

      const hasActiveOrders = localItems.some(i => ['confirmed', 'preparing', 'served'].includes(i.status));

      if (hasActiveOrders) {
          setItemToVoid({ actionType: 'TABLE_CLOSE' }); 
          setIsVoidModalOpen(true);
      } else {
          setLoadingOp('CLOSE_TABLE');
          try {
              await closeTableSession(session.id);
              toast.success("Table Closed");
              if (onCloseDrawer) onCloseDrawer();
          } catch(e) {
              toast.error(e.message);
          } finally {
              setLoadingOp(null);
          }
      }
  };

  const handleConfirmVoid = async (reason) => {
      if (!itemToVoid) return;

      if (itemToVoid.actionType === 'TABLE_CLOSE') {
          await closeTableWithVoid(reason);
          return;
      }

      setLoadingOp('VOID_ITEM');
      try {
           await voidOrderItem(itemToVoid.id, reason);
           toast.success(t('itemVoided'));
           setSessionItems(prev => prev.filter(i => i.id !== itemToVoid.id));
      } catch(e) { toast.error(e.message); }
      finally { setLoadingOp(null); }

      setIsVoidModalOpen(false);
      setItemToVoid(null);
  };

  return {
      handleStartSession,
      closeTableWithVoid,
      handleForceCloseTable,
      handleConfirmVoid
  };
};
