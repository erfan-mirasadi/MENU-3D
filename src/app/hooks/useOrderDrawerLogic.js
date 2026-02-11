import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  confirmOrderItems,
  startTableSession,
  closeTableSession,
  updateOrderItem,
  deleteOrderItem,
  addOrderItem,
  startPreparingOrder,
  serveConfirmedOrders
} from "@/services/waiterService";
import { voidOrderItem, updateOrderItemSecurely } from "@/services/orderService";
import { useRestaurantFeatures } from "./useRestaurantFeatures";
import { useLanguage } from "@/context/LanguageContext";

export const useOrderDrawerLogic = (session, table, onCheckout, role = "waiter", onCloseDrawer, onRefetch) => {
  const { features } = useRestaurantFeatures();
  const { t } = useLanguage();
  const [loadingOp, setLoadingOp] = useState(null); // 'START_SESSION', 'CLOSE_TABLE', etc.
  
  // State 1: Local Drafts (New additions not yet sent to DB)
  const [draftItems, setDraftItems] = useState([]);

  // State 2: Session Items (Synced from DB)
  const [sessionItems, setSessionItems] = useState([]);

  // Combined View for UI
  const [localItems, setLocalItems] = useState([]);

  // Optimistic locking state (Replaces useRef for cleaner React philosophy)
  const [optimisticLock, setOptimisticLock] = useState(null); // { targetStatus: 'confirmed'|'preparing', count: 5 }


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  // Void/Edit State
  const [itemToVoid, setItemToVoid] = useState(null);
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchItems, setBatchItems] = useState([]);
  
  // State 3: Confirmed Edits (Local Quantity Adjustments for Confirmed Items)
  const [confirmedEdits, setConfirmedEdits] = useState({});

  // Sync with Realtime Session Data
  useEffect(() => {
    if (session?.order_items) {
      const serverItems = session.order_items;
      
      // CHECK OPTIMISTIC LOCK
      if (optimisticLock) {
          const { targetStatus, count } = optimisticLock;
          
          const matchingItems = serverItems.filter(i => i.status === targetStatus || 
             (targetStatus === 'confirmed' && ['preparing','served'].includes(i.status)) ||
             (targetStatus === 'preparing' && ['served'].includes(i.status))
          );

          if (matchingItems.length < count) {
              console.log("Blocking stale update (State Lock Active)");
              return; 
          }
          
          setOptimisticLock(null);
          setLoadingOp(null); 
      }

      const sorted = [...serverItems].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setSessionItems(sorted);
    } else {
      setSessionItems([]);
    }
  }, [session?.order_items]);

  // Reset generic loading op if session changes (safety for START_SESSION hanging)
  useEffect(() => {
      // If we were waiting for start session and it arrived, clear it.
      if (loadingOp === 'START_SESSION' && session?.id) {
          setLoadingOp(null);
      }
  }, [session?.id, loadingOp]);

  // Combine Session + Drafts + Confirmed Edits
  useEffect(() => {
      // Apply confirmed edits to session items locally
      const itemsWithEdits = sessionItems.map(item => {
          if ((item.status === 'confirmed' || item.status === 'pending') && confirmedEdits[item.id] !== undefined) {
              return { ...item, quantity: confirmedEdits[item.id] };
          }
          return item;
      });
      setLocalItems([...itemsWithEdits, ...draftItems]);
  }, [sessionItems, draftItems, confirmedEdits]);

  // Derived Lists
  const pendingItems = localItems.filter((i) => i.status === "pending");
  const confirmedItems = localItems.filter((i) => i.status === "confirmed");
  const activeItems = localItems.filter((i) => ["preparing", "ready", "served"].includes(i.status));

  const totalAmount = localItems.reduce(
    (sum, item) => sum + (item.unit_price_at_order || 0) * item.quantity,
    0
  );

  // Handlers

  const handleStartSession = async () => {
    setLoadingOp('START_SESSION');
    try {
      await startTableSession(table.id, table.restaurant_id);
      toast.success(t('tableStarted'));
      // Intentionally keep loadingOp='START_SESSION' until realtime prop comes in (handled by useEffect above)
    } catch (error) { 
      toast.error(t('failedToStart')); 
      setLoadingOp(null);
    } 
  };

  const handlePaymentRequest = async () => {
    if (onRefetch) {
        setLoadingOp('FETCHING_LATEST');
        try {
            await onRefetch();
        } catch(e) {
            console.error("Failed to refetch session", e);
        } finally {
            setLoadingOp(null);
        }
    }
    setIsPaymentModalOpen(true);
  };

  const handleForceCloseTable = async () => {
      // 1. Initial Safety Check
      if (!confirm("Are you sure you want to close this table? This action cannot be undone.")) {
          return;
      }

      const hasActiveOrders = localItems.some(i => ['confirmed', 'preparing', 'served'].includes(i.status));

      if (hasActiveOrders) {
          // 2. If Active Orders -> Force Void Reason Prompt
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

  const handleMenuAdd = async (product) => {
    // Local operation, no loading op needed usually, or 'MENU_ACTION'
    const existingDraft = draftItems.find(i => i.product_id === product.id);

    if (existingDraft) {
        setDraftItems(prev => prev.map(i => 
            i.id === existingDraft.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
        return; 
    }

    // 2. Create new Draft Item
    const newItem = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product, 
        product_id: product.id,
        quantity: 1, 
        unit_price_at_order: product.price,
        status: 'pending', 
        created_at: new Date().toISOString(),
        isDraft: true 
    };

    setDraftItems(prev => [...prev, newItem]);
    toast.success(t('addedToOrder'), { icon: '📝', duration: 1000 });
  };

  const handleMenuRemove = async (product) => {
      // 1. Prioritize removing from DRAFTS
      const draftItem = draftItems.find(i => i.product_id === product.id);

      if (draftItem) {
          if (draftItem.quantity > 1) {
              setDraftItems(prev => prev.map(i => i.id === draftItem.id ? {...i, quantity: i.quantity - 1} : i));
          } else {
              setDraftItems(prev => prev.filter(i => i.id !== draftItem.id));
          }
          return;
      }

      // 2. If not in drafts, check Session Items
      const sessionItem = sessionItems.find(i => 
        (i.product_id === product.id || i.product?.id === product.id) && 
        ['pending', 'confirmed', 'preparing', 'served'].includes(i.status)
      );

      if (!sessionItem) return;

      // Logic for Session items
      if (sessionItem.status === 'pending') {
          // Pending DB Items -> Delete directly (no void reason)
          if (sessionItem.quantity > 1) {
             try { 
                 await updateOrderItem(sessionItem.id, { quantity: sessionItem.quantity - 1 });
                 // Optimistic update
                 setSessionItems(prev => prev.map(i => i.id === sessionItem.id ? {...i, quantity: i.quantity - 1} : i));
             } catch(e) { toast.error("Failed to update"); }
          } else {
             try {
                 await deleteOrderItem(sessionItem.id);
                 setSessionItems(prev => prev.filter(i => i.id !== sessionItem.id));
             } catch(e) { toast.error("Failed to delete"); }
          }
      } else {
          // Confirmed/Active -> REQUIRED Void Reason
          setItemToVoid(sessionItem);
          setIsVoidModalOpen(true);
      }
  };

  const onUpdateQty = async (itemId, newQty) => {
      // Check if it's a draft
      const isDraft = draftItems.some(i => i.id === itemId);
      if (isDraft) {
          if (newQty < 1) {
              setDraftItems(prev => prev.filter(i => i.id !== itemId));
          } else {
              setDraftItems(prev => prev.map(i => i.id === itemId ? {...i, quantity: newQty} : i));
          }
          return;
      }

      // Check if it's a Confirmed OR Pending item (Batch Edit)
      const isBatchable = sessionItems.some(i => i.id === itemId && (i.status === 'confirmed' || i.status === 'pending'));
      if (isBatchable) {
          if (newQty < 1) {
             // If qty is 0, we can either:
             // A) Treat as delete immediately (call onDeleteItem)
             // B) Batch validity 0 (implies delete on flush)
             // Current UI logic often calls onDelete for 0. Let's stick to calling onDeleteItem for 0.
             onDeleteItem(itemId);
             // Also clear any edit in progress for it to avoid ghosts
             setConfirmedEdits(prev => {
                 const next = { ...prev };
                 delete next[itemId];
                 return next;
             });
          } else {
             setConfirmedEdits(prev => ({ ...prev, [itemId]: newQty }));
          }
          return;
      }

      if(newQty < 1) return; 
      try { await updateOrderItem(itemId, { quantity: newQty }); } catch(e){}
  };

  const onDeleteItem = async (itemId) => {
      const isDraft = draftItems.some(i => i.id === itemId);
      if (isDraft) {
          setDraftItems(prev => prev.filter(i => i.id !== itemId));
          return;
      }

      const item = sessionItems.find(i => i.id === itemId);
      if (!item) return;

      if (item.status === 'pending') {
          setSessionItems(prev => prev.filter(i => i.id !== itemId));
          try { await deleteOrderItem(itemId); toast.success(t('removedFromOrder')); } catch(e){}
      } else {
          setItemToVoid(item);
          setIsVoidModalOpen(true);
      }
  };

  const handleConfirmOrder = async () => {
    if (draftItems.length === 0 && sessionItems.filter(i => i.status === 'pending').length === 0) {
        toast(t('nothingToSend'));
        return;
    }

    setLoadingOp('CONFIRM_ORDER');
    
    // 0. Flush Pending/Confirmed Edits first
    const editKeys = Object.keys(confirmedEdits);
    if (editKeys.length > 0) {
        const promises = editKeys.map(id => {
            const qty = confirmedEdits[id];
            return updateOrderItem(id, { quantity: qty });
        });
        await Promise.all(promises);
        setConfirmedEdits({});
    }

    const currentDrafts = [...draftItems]; // Capture drafts for optimistic update

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

        // Revised Logic per User Request: 
        // 1. Kitchen ON, Cashier ON -> 'confirmed' (Standard Queue)
        // 2. Kitchen ON, Cashier OFF -> 'preparing' (Direct to Kitchen, skip confirmation)
        // 3. Kitchen OFF -> 'served' (Instant Serve)
        
        let targetStatus = 'confirmed';
        if (features.kitchen) {
            if (!features.cashier) {
                targetStatus = 'preparing'; 
            } else {
                targetStatus = 'confirmed';
            }
        } else {
            targetStatus = 'served';
        }

        // 3. Confirm All Pending + New Drafts
        await confirmOrderItems(session.id, targetStatus);
        
        // OPTIMISTIC UPDATE: 
        let totalCount = 0;
        setSessionItems(prev => {
            const updatedExisting = prev.map(item => 
                item.status === 'pending' ? { ...item, status: targetStatus } : item
            );
            
            const optimisticDrafts = currentDrafts.map(d => ({
                ...d,
                id: d.id, // Keep draft ID temporarily (Realtime will overwrite later)
                status: targetStatus,
                created_at: d.created_at || new Date().toISOString()
            }));

            const final = [...updatedExisting, ...optimisticDrafts];
            totalCount = final.filter(i => i.status === targetStatus).length;
            return final;
        });

        // Set Lock (State based)
        setOptimisticLock({ targetStatus: targetStatus, count: totalCount > 0 ? 1 : 0 });

        // Safety Timeout
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
        } else {
             toast.success(t('ordersServed'));
        }
    } catch (error) { 
        toast.error(t('failedToConfirm'));
        console.error(error);
        setLoadingOp(null); // Clear on error
    } 
    // FINALLY REMOVED: We intentionally keep loadingOp active until useEffect clears it OR timeout.
  };
  
  const handleStartPreparing = async () => {
      setLoadingOp('PREPARE_ORDER');
      try {
          // 0. Flush Confirmed Edits
          const editKeys = Object.keys(confirmedEdits);
          if (editKeys.length > 0) {
              // Flush updates to server
              const promises = editKeys.map(id => {
                  const qty = confirmedEdits[id];
                  return updateOrderItemSecurely(id, qty, qty, "Quantity Update before Kitchen"); 
                  // Using secure update or just standard update? 
                  // Standard updateOrderItem is imported from waiterService. updateOrderItemSecurely is from orderService.
                  // Let's use updateOrderItem from waiterService as it matches onUpdateQty original logic.
                  // But wait, original onUpdateQty used updateOrderItem (waiterService).
                  // Let's stick to that.
                  // Actually, better use Promise.all waiting.
                  return updateOrderItem(id, { quantity: qty });
              });
              
              await Promise.all(promises);
              setConfirmedEdits({});
          }

          if (features.kitchen) {
               // Standard Flow: Confirmed -> Preparing
              await startPreparingOrder(session.id);
              
              // OPTIMISTIC UPDATE: Move Confirmed -> Preparing
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

          } else {
              // No Kitchen Flow: Confirmed -> Served (Directly)
              await serveConfirmedOrders(session.id);
              
              // OPTIMISTIC UPDATE: Move Confirmed -> Served
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

  const handleConfirmVoid = async (reason) => {
      if (!itemToVoid) return;
      
      if (itemToVoid.actionType === 'BATCH_SAVE') {
          await executeBatchUpdate(reason);
          return;
      }

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
            // Standard Flow: Confirm -> Preparing
            await confirmOrderItems(session.id, 'confirmed');
            await startPreparingOrder(session.id);
             // OPTIMISTIC UPDATE: Preparing
            let totalCount = 0;
            setSessionItems(prev => {
                const updatedExisting = prev.map(item => 
                    ['pending', 'confirmed'].includes(item.status) ? { ...item, status: 'preparing' } : item
                );

                const optimisticDrafts = currentDrafts.map(d => ({
                    ...d,
                    id: d.id,
                    status: 'preparing',
                    created_at: d.created_at || new Date().toISOString()
                }));

                const final = [...updatedExisting, ...optimisticDrafts];
                totalCount = final.filter(i => i.status === 'preparing').length;
                return final;
            });
            setOptimisticLock({ targetStatus: 'preparing', count: totalCount > 0 ? totalCount : 0 });

            toast.success(t('sentToKitchen'));

        } else {
            // No Kitchen: Confirm -> Served directly
             await confirmOrderItems(session.id, 'served');
             
             // OPTIMISTIC UPDATE: Served
             let totalCount = 0;
            setSessionItems(prev => {
                const updatedExisting = prev.map(item => 
                    ['pending', 'confirmed'].includes(item.status) ? { ...item, status: 'served' } : item
                );

                const optimisticDrafts = currentDrafts.map(d => ({
                    ...d,
                    id: d.id,
                    status: 'served',
                    created_at: d.created_at || new Date().toISOString()
                }));

                const final = [...updatedExisting, ...optimisticDrafts];
                totalCount = final.filter(i => i.status === 'served').length;
                return final;
            });
             setOptimisticLock({ targetStatus: 'served', count: totalCount > 0 ? totalCount : 0 });

             toast.success(t('ordersServed'));
        }
        
        // Timeout Logic shared
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

  // Batch Logic (Scoped)
  const handleStartBatchEdit = (scope) => {
      // scope: 'confirmed' | 'kitchen' | 'served'
      let relevantStatus = [];
      if (scope === 'served') relevantStatus = ['served'];
      else if (scope === 'kitchen') relevantStatus = ['preparing', 'ready'];
      else if (scope === 'confirmed') relevantStatus = ['confirmed'];
      else return; 
      
      // Use localItems to include local edits!
      const active = localItems.filter(i => relevantStatus.includes(i.status)); 
      
      const groupedBatch = Object.values(active.reduce((acc, item) => {
        const key = item.product_id || item.product?.id;
        if (!acc[key]) {
            acc[key] = { 
                ...item, 
                quantity: 0, 
                ids: [], 
                virtualId: `group-edit-${key}` 
            };
        }
        acc[key].quantity += item.quantity;
        acc[key].ids.push(item.id);
        return acc;
      }, {}));

      setBatchItems(groupedBatch);
      setIsBatchEditing(scope);
  };

  const handleCancelBatchEdit = () => {
      setIsBatchEditing(null);
      setBatchItems([]);
  };

  const handleExecuteBatch = () => {
        // Determine Original Active based on CURRENT SCOPE
        let relevantStatus = [];
        if (isBatchEditing === 'served') relevantStatus = ['served'];
        else if (isBatchEditing === 'kitchen') relevantStatus = ['preparing', 'ready'];
        else if (isBatchEditing === 'confirmed') relevantStatus = ['confirmed'];
        
        const originalActive = sessionItems.filter(i => relevantStatus.includes(i.status));
      
        // ... (Logic unchanged for calculating void, but scoped to originalActive)
        let needsVoid = false;

        // Check 1: Did any group qty decrease?
        for (const batchItem of batchItems) {
            // Find total existing quantity for this product WITHIN SCOPE
            const originalTotal = originalActive
                .filter(o => (o.product_id || o.product?.id) === (batchItem.product_id || batchItem.product?.id))
                .reduce((sum, i) => sum + i.quantity, 0);
            
            if (batchItem.quantity < originalTotal) {
                needsVoid = true;
                break;
            }
        }

        // Check 2: Was a group completely removed? (Not in batchItems anymore)
        const batchProductIds = batchItems.map(b => b.product_id || b.product?.id);
        const originalProductIds = [...new Set(originalActive.map(o => o.product_id || o.product?.id))];
        
        if (originalProductIds.some(pid => !batchProductIds.includes(pid))) {
            needsVoid = true;
        }

        if (needsVoid) {
            setItemToVoid({ actionType: 'BATCH_SAVE' });
            setIsVoidModalOpen(true);
        } else {
            executeBatchUpdate(null);
        }
  };

  const executeBatchUpdate = async (voidReason) => {
      setLoadingOp('BATCH_UPDATE');
      try {
          // Re-determine scope for execution
          let relevantStatus = [];
          if (isBatchEditing === 'served') relevantStatus = ['served'];
          else if (isBatchEditing === 'kitchen') relevantStatus = ['preparing', 'ready'];
          else if (isBatchEditing === 'confirmed') relevantStatus = ['confirmed'];

          const originalActive = sessionItems.filter(i => relevantStatus.includes(i.status));
          const updates = [];
          
          // 1. Handle Updates/Reductions
          for (const batchItem of batchItems) {
               // Get all original rows for this product WITHIN SCOPE
               const originalRows = originalActive.filter(o => (o.product_id || o.product?.id) === (batchItem.product_id || batchItem.product?.id));
               const currentTotal = originalRows.reduce((sum, i) => sum + i.quantity, 0);
               const targetTotal = batchItem.quantity;

               if (targetTotal === currentTotal) continue; 

               if (targetTotal < currentTotal) {
                   let amountToRemove = currentTotal - targetTotal;
                   
                   // Sort by quantity desc 
                   originalRows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

                   for (const row of originalRows) {
                       if (amountToRemove <= 0) break;
                       
                       if (row.quantity <= amountToRemove) {
                           updates.push(voidOrderItem(row.id, voidReason || "Batch Removed"));
                           amountToRemove -= row.quantity;
                       } else {
                           const newRowQty = row.quantity - amountToRemove;
                           updates.push(updateOrderItemSecurely(row.id, newRowQty, row.quantity, voidReason || "Batch Update"));
                           amountToRemove = 0;
                       }
                   }
               } 
          }

          // 2. Handle Complete Removals
          const batchProductIds = batchItems.map(b => b.product_id || b.product?.id);
          const productsToRemove = [...new Set(originalActive
                .map(o => o.product_id || o.product?.id)
                .filter(pid => !batchProductIds.includes(pid))
          )];
          
          for (const pid of productsToRemove) {
               const rows = originalActive.filter(o => (o.product_id || o.product?.id) === pid);
               for (const r of rows) {
                   updates.push(voidOrderItem(r.id, voidReason || "Batch Removed"));
               }
          }

          await Promise.all(updates);
          toast.success(t('orderUpdated'));
      } catch (e) {
          toast.error(t('failedToUpdate') + ": " + e.message);
      } finally {
          setLoadingOp(null);
          setIsBatchEditing(null);
          setIsVoidModalOpen(false);
          setItemToVoid(null);
      }
  };
  
  const handleCheckoutWrapper = async (sessionId, type, data) => {
        setLoadingOp('CHECKOUT');
        try {
            if (onCheckout) {
                const res = await onCheckout(sessionId, type, data);
                if (res?.success) {
                    setIsPaymentModalOpen(false);
                    return true; 
                } else {
                    toast.error(t('checkoutFailed') + ": " + (res?.error?.message || "Unknown"));
                    return false;
                }
            } else {
                toast.error("Checkout function not provided");
                return false;
            }
        } finally {
            setLoadingOp(null);
        }
  }

  return {
    state: {
        loadingOp, // EXPOSED: 'START_SESSION', 'CLOSE_TABLE', etc.
        loading: !!loadingOp, // Legacy support for basic disable logic
        localItems,
        pendingItems,
        confirmedItems,
        activeItems,
        totalAmount,
        isMenuOpen,
        isPaymentModalOpen,
        isVoidModalOpen,
        itemToVoid,
        isBatchEditing,
        batchItems
    },
    setters: {
        setIsMenuOpen,
        setIsPaymentModalOpen,
        setIsVoidModalOpen,
        setBatchItems
    },
    actions: {
        handleStartSession,
        handlePaymentRequest,
        handleForceCloseTable,
        handleConfirmOrder,
        handleStartPreparing,
        handleMenuAdd,
        handleMenuRemove,
        onUpdateQty,
        onDeleteItem,
        handleConfirmVoid,
        handleCashierInstantSend,
        handleStartBatchEdit,
        handleCancelBatchEdit,
        handleExecuteBatch,
        handleCheckoutWrapper
    }
  };
};
