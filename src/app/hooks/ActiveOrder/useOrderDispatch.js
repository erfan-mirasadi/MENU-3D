import toast from "react-hot-toast";
import { triggerStaffPushNotification } from "@/services/notificationService";
import { confirmOrderItems, startPreparingOrder, serveConfirmedOrders, addOrderItem, updateOrderItem } from "@/services/staffService";

export const useOrderDispatch = ({
  session,
  table,
  features,
  draftItems, setDraftItems,
  sessionItems, setSessionItems,
  setOptimisticLock,
  setLoadingOp,
  t,
  onCheckout
}) => {

  const handleConfirmOrder = async (confirmedEdits, setConfirmedEdits) => {
    if (draftItems.length === 0 && sessionItems.filter(i => i.status === 'pending').length === 0) {
        toast(t('nothingToSend'));
        return;
    }

    setLoadingOp('CONFIRM_ORDER');
    
    const editKeys = Object.keys(confirmedEdits);
    if (editKeys.length > 0) {
        const promises = editKeys.map(id => {
            const qty = confirmedEdits[id];
            return updateOrderItem(id, { quantity: qty });
        });
        await Promise.all(promises);
        setConfirmedEdits({});
    }

    const currentDrafts = [...draftItems]; 

    try {
        if (currentDrafts.length > 0) {
            const promises = currentDrafts.map(d => addOrderItem({
                session_id: session.id,
                product_id: d.product_id,
                quantity: d.quantity,
                unit_price_at_order: d.unit_price_at_order,
                status: 'pending' 
            }));
            await Promise.all(promises);
            setDraftItems([]); 
        }
        
        let targetStatus = 'confirmed';
        if (features.kitchen) {
            targetStatus = !features.cashier ? 'preparing' : 'confirmed';
        } else {
            targetStatus = 'served';
        }

        await confirmOrderItems(session.id, targetStatus);
        
        let totalCount = 0;
        setSessionItems(prev => {
            const updatedExisting = prev.map(item => 
                item.status === 'pending' ? { ...item, status: targetStatus } : item
            );
            
            const optimisticDrafts = currentDrafts.map(d => ({
                ...d, id: d.id, status: targetStatus, created_at: d.created_at || new Date().toISOString()
            }));

            const final = [...updatedExisting, ...optimisticDrafts];
            totalCount = final.filter(i => i.status === targetStatus).length;
            return final;
        });

        setOptimisticLock({ targetStatus, count: totalCount > 0 ? 1 : 0 });

        setTimeout(() => {
            setOptimisticLock(prev => {
                if (prev) {
                    setLoadingOp(null);
                    return null;
                }
                return prev;
            });
        }, 5000);

        if (targetStatus === 'confirmed') {
            toast.success(t('sentToCashier'));
        } else if (targetStatus === 'preparing') {
            toast.success(t('sentToKitchen'));
            triggerStaffPushNotification('PREPARING', table.restaurant_id, table.table_number);
        } else {
             toast.success(t('ordersServed'));
             triggerStaffPushNotification('SERVED', table.restaurant_id, table.table_number);
        }
    } catch (error) { 
        toast.error(t('failedToConfirm'));
        console.error(error);
        setLoadingOp(null); 
    } 
  };
  
  const handleStartPreparing = async (confirmedEdits, setConfirmedEdits) => {
      setLoadingOp('PREPARE_ORDER');
      try {
          const editKeys = Object.keys(confirmedEdits);
          if (editKeys.length > 0) {
              const promises = editKeys.map(id => {
                  const qty = confirmedEdits[id];
                  return updateOrderItem(id, { quantity: qty });
              });
              
              await Promise.all(promises);
              setConfirmedEdits({});
          }

          if (features.kitchen) {
              await startPreparingOrder(session.id);
              
              let totalCount = 0;
              setSessionItems(prev => {
                  const next = prev.map(item => 
                      item.status === 'confirmed' ? { ...item, status: 'preparing' } : item
                  );
                  totalCount = next.filter(i => i.status === 'preparing').length;
                  return next;
              });

              setOptimisticLock({ targetStatus: 'preparing', count: totalCount > 0 ? 1 : 0 });
              toast.success(t('startPreparing'), { icon: '👨‍🍳' });
              triggerStaffPushNotification('PREPARING', table.restaurant_id, table.table_number);

          } else {
              await serveConfirmedOrders(session.id);
              
              let totalCount = 0;
              setSessionItems(prev => {
                  const next = prev.map(item => 
                      item.status === 'confirmed' ? { ...item, status: 'served' } : item
                  );
                  totalCount = next.filter(i => i.status === 'served').length;
                  return next;
              });

              setOptimisticLock({ targetStatus: 'served', count: totalCount > 0 ? 1 : 0 });
              toast.success(t('ordersServed'));
              triggerStaffPushNotification('SERVED', table.restaurant_id, table.table_number);
          }

          setTimeout(() => {
            setOptimisticLock(prev => {
                if(prev) {
                    setLoadingOp(null);
                    return null;
                }
                return prev;
            });
          }, 5000);

      } catch(e) {
          toast.error("Error: " + (e.message || "Failed"));
          setLoadingOp(null);
      } 
  };

  const handleCashierInstantSend = async () => {
    setLoadingOp('CONFIRM_ORDER'); 
    const currentDrafts = [...draftItems];

    try {
         if (currentDrafts.length > 0) {
            const promises = currentDrafts.map(d => addOrderItem({
                session_id: session.id,
                product_id: d.product_id,
                quantity: d.quantity,
                unit_price_at_order: d.unit_price_at_order,
                status: 'pending' 
            }));
            await Promise.all(promises);
            setDraftItems([]);
        }

        if (features.kitchen) {
            await confirmOrderItems(session.id, 'confirmed');
            await startPreparingOrder(session.id);
            let totalCount = 0;
            setSessionItems(prev => {
                const updatedExisting = prev.map(item => 
                    ['pending', 'confirmed'].includes(item.status) ? { ...item, status: 'preparing' } : item
                );

                const optimisticDrafts = currentDrafts.map(d => ({
                    ...d, id: d.id, status: 'preparing', created_at: d.created_at || new Date().toISOString()
                }));

                const final = [...updatedExisting, ...optimisticDrafts];
                totalCount = final.filter(i => i.status === 'preparing').length;
                return final;
            });
            setOptimisticLock({ targetStatus: 'preparing', count: totalCount > 0 ? totalCount : 0 });

            toast.success(t('sentToKitchen'));
            triggerStaffPushNotification('PREPARING', table.restaurant_id, table.table_number);

        } else {
             await confirmOrderItems(session.id, 'served');
             let totalCount = 0;
            setSessionItems(prev => {
                const updatedExisting = prev.map(item => 
                    ['pending', 'confirmed'].includes(item.status) ? { ...item, status: 'served' } : item
                );

                const optimisticDrafts = currentDrafts.map(d => ({
                    ...d, id: d.id, status: 'served', created_at: d.created_at || new Date().toISOString()
                }));

                const final = [...updatedExisting, ...optimisticDrafts];
                totalCount = final.filter(i => i.status === 'served').length;
                return final;
            });
             setOptimisticLock({ targetStatus: 'served', count: totalCount > 0 ? totalCount : 0 });

             toast.success(t('ordersServed'));
             triggerStaffPushNotification('SERVED', table.restaurant_id, table.table_number);
        }
        
        setTimeout(() => {
            setOptimisticLock(prev => {
                if(prev) {
                    setLoadingOp(null);
                    return null;
                }
                return prev;
            });
        }, 5000);
    } catch(e) {
        toast.error("Failed: " + e.message);
        setLoadingOp(null);
    } 
  };

  const handleCheckoutWrapper = async (sessionId, type, data) => {
        setLoadingOp('CHECKOUT');
        try {
            if (onCheckout) {
                const res = await onCheckout(sessionId, type, data);
                if (res?.success) {
                    return { success: true, fullyPaid: res.fullyPaid };
                } else {
                    toast.error(t('checkoutFailed') + ": " + (res?.error?.message || "Unknown"));
                    return { success: false };
                }
            } else {
                toast.error("Checkout function not provided");
                return { success: false };
            }
        } finally {
            setLoadingOp(null);
        }
  };

  return {
    handleConfirmOrder,
    handleStartPreparing,
    handleCashierInstantSend,
    handleCheckoutWrapper
  };
};
