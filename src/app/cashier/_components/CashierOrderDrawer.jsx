'use client'
import { useState, useEffect } from "react";
import { FaCheck, FaClock, FaUtensils, FaReceipt, FaPrint, FaFire } from "react-icons/fa";
import {
  confirmOrderItems,
  closeTableSession,
  startTableSession,
  updateOrderItem,
  deleteOrderItem,
  addOrderItem,
  startPreparingOrder
} from "@/services/waiterService";
import { voidOrderItem, updateOrderItemSecurely } from "@/services/orderService";
import toast from "react-hot-toast";

// Reuse Waiter Components (User Request)
import DrawerHeader from "@/app/waiter/_components/drawer/DrawerHeader";
import DrawerFooter from "@/app/waiter/_components/drawer/DrawerFooter";
import SwipeableOrderItem from "@/app/waiter/_components/drawer/SwipeableOrderItem";
import DrawerEmptyState from "@/app/waiter/_components/drawer/DrawerEmptyState";
import OrderSection from "@/app/waiter/_components/drawer/OrderSection";
import WaiterMenuModal from "@/app/waiter/_components/WaiterMenuModal";
import PaymentModal from "./PaymentModal";
import VoidReasonModal from "./VoidReasonModal";



export default function CashierOrderDrawer({ table, session, isOpen, onClose, onCheckout }) {
  const [loading, setLoading] = useState(false);
  const [localItems, setLocalItems] = useState([]); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  const [itemToVoid, setItemToVoid] = useState(null); // Used for single item void OR batch void context
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchItems, setBatchItems] = useState([]); // Buffer for edits

  // Scroll Lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Sync with Realtime Session Data
  useEffect(() => {
    if (session?.order_items) {
      const sorted = [...session.order_items].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setLocalItems(sorted);
    } else {
      setLocalItems([]);
    }
  }, [session?.order_items]);

  if (!isOpen || !table) return null;

  // --- FILTERING ---
  // 1. Confirmed by Waiter (Orange Blink) -> Cashier Needs to "Start Prep"
  const confirmedItems = localItems.filter((i) => i.status === "confirmed");
  
  // 2. Pending (Waiter hasn't confirmed yet) - Cashier can see/edit
  const pendingItems = localItems.filter((i) => i.status === "pending");
  
  // 3. Active (Preparing/Served) - Done
  const activeItems = localItems.filter((i) => 
    ["preparing", "served"].includes(i.status)
  );

  const totalAmount = localItems.reduce(
    (sum, item) => sum + (item.unit_price_at_order || 0) * item.quantity,
    0
  );

  // --- ACTIONS ---

  const handleStartSession = async () => {
    setLoading(true);
    try {
      await startTableSession(table.id, table.restaurant_id);
      toast.success("Table Opened");
    } catch (error) { toast.error("Failed"); } 
    finally { setLoading(false); }
  };

  const handleCloseTable = async () => {
    // Instead of direct close, open Payment Modal
    setIsPaymentModalOpen(true);
  };

  // ACTION: Move Confirmed -> Preparing (Triggers Green Table)
  const handleSendToKitchen = async () => {
      setLoading(true)
      try {
          await startPreparingOrder(session.id)
          toast.success("Sent to Kitchen! 🍳", { icon: '👨‍🍳' })
      } catch(e) {
          console.error("Supabase Error:", e)
          toast.error("Error: " + (e.message || "Failed to update status"))
      } finally {
          setLoading(false)
      }
  }
  
  // Fallback: Confirm Pending -> Confirmed (if Cashier acts as Waiter)
  const handleConfirmPending = async () => {
      setLoading(true)
      try {
          await confirmOrderItems(session.id)
          toast.success("Confirmed Orders")
      } catch(e) { toast.error("Failed"); }
      finally { setLoading(false) }
  }


  // --- MENU LOGIC (Reused) ---
  const handleMenuAdd = async (product) => {
    // Reuse same logic as Waiter: Add to Pending
    const existingPending = localItems.find(i => 
        (i.product_id === product.id || i.product?.id === product.id) && i.status === "pending"
    );

    if (existingPending) {
        // Increment
        const newQty = existingPending.quantity + 1
        setLocalItems(prev => prev.map(i => i.id === existingPending.id ? {...i, quantity: newQty} : i))
        try { await updateOrderItem(existingPending.id, { quantity: newQty }) } catch(e){}
    } else {
        // Add New
        const newItem = {
            id: `temp-${Date.now()}`,
            product, product_id: product.id,
            quantity: 1, unit_price_at_order: product.price,
            status: "pending", created_at: new Date().toISOString()
        }
        setLocalItems(prev => [...prev, newItem])
        try {
            await addOrderItem({
                session_id: session.id,
                product_id: product.id,
                quantity: 1,
                unit_price_at_order: product.price,
                status: "pending"
            })
            toast.success("Item Added")
        } catch(e) {
            setLocalItems(prev => prev.filter(i => i.id !== newItem.id))
        }
    }
  }

  const handleMenuRemove = async (product) => {
      // Simplification: just find first match not cancelled
      const existing = localItems.find(i => 
        (i.product_id === product.id || i.product?.id === product.id) && i.status !== "cancelled"
      )
      if(!existing) return 

      if(existing.quantity > 1) {
          const newQty = existing.quantity - 1
          setLocalItems(prev => prev.map(i => i.id === existing.id ? {...i, quantity: newQty} : i))
          try { await updateOrderItem(existing.id, { quantity: newQty }) } catch(e){}
      } else {
          setLocalItems(prev => prev.filter(i => i.id !== existing.id))
          try { await deleteOrderItem(existing.id) } catch(e){}
      }
  }

  const onUpdateQty = async (itemId, newQty) => {
      if(newQty < 1) return 
      setLocalItems(prev => prev.map(i => i.id === itemId ? {...i, quantity: newQty} : i))
      try { await updateOrderItem(itemId, { quantity: newQty }) } catch(e){}
  }

  const onDeleteItem = async (itemId) => {
      const item = localItems.find(i => i.id === itemId);
      if (!item) return;

      // If Pending -> Just Delete (Waiter logic)
      if (item.status === 'pending') {
          setLocalItems(prev => prev.filter(i => i.id !== itemId))
          try { await deleteOrderItem(itemId) } catch(e){}
          return;
      }

      // If Confirmed/Served -> Secure Void
      if (['confirmed', 'served'].includes(item.status)) {
          setItemToVoid(item);
          setIsVoidModalOpen(true);
      }
  }

  const handleConfirmVoid = async (reason) => {
      if (!itemToVoid) return;
      
      if (itemToVoid.actionType === 'BATCH_SAVE') {
          await executeBatchUpdate(reason);
          return;
      }

      // Fallback for single item void (if still used elsewhere, though mostly replaced by batch)
      // ... (Legacy or single delete if supported outside batch)
      try {
           await voidOrderItem(itemToVoid.id, reason);
           toast.success("Item Voided");
           setLocalItems(prev => prev.filter(i => i.id !== itemToVoid.id));
      } catch(e) { toast.error(e.message) }
      
      setIsVoidModalOpen(false);
      setItemToVoid(null);
  }

  // --- BATCH EDIT LOGIC ---
  const handleStartBatchEdit = () => {
      // Clone active items to buffer
      // We only care about activeItems for this mode
      const active = localItems.filter(i => ["preparing", "served"].includes(i.status));
      setBatchItems(JSON.parse(JSON.stringify(active)));
      setIsBatchEditing(true);
  }

  const handleCancelBatchEdit = () => {
      setIsBatchEditing(false);
      setBatchItems([]);
  }

  const handleBatchQtyChange = (itemId, newQty) => {
      if (newQty < 1) return; // or handle delete if 0? Swipe usually handles delete.
      setBatchItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
  }

  const handleBatchDelete = (itemId) => {
      setBatchItems(prev => prev.filter(i => i.id !== itemId));
  }

  const handleSaveBatchClick = () => {
      // 1. Calculate Diffs
      // We compare 'batchItems' (New) vs 'activeItems' (Old, from localItems)
      const originalActive = localItems.filter(i => ["preparing", "served"].includes(i.status));
      
      let needsVoid = false;

      // Check for removed items
      const originalIds = originalActive.map(i => i.id);
      const newIds = batchItems.map(i => i.id);
      const removedIds = originalIds.filter(id => !newIds.includes(id));

      if (removedIds.length > 0) needsVoid = true;

      // Check for reduced quantity
      if (!needsVoid) {
          for (const newItem of batchItems) {
              const original = originalActive.find(o => o.id === newItem.id);
              if (original && newItem.quantity < original.quantity) {
                  needsVoid = true;
                  break;
              }
          }
      }

      if (needsVoid) {
          // Trigger Modal, pass "BATCH" context
          setItemToVoid({ actionType: 'BATCH_SAVE' });
          setIsVoidModalOpen(true);
      } else {
          // No voids, just updates (Increases or No Change)
          executeBatchUpdate(null);
      }
  }

  const executeBatchUpdate = async (voidReason) => {
      setLoading(true);
      try {
          const originalActive = localItems.filter(i => ["preparing", "served"].includes(i.status));
          
          const updates = [];
          const logs = [];

          // 1. Handle Updates & Reductions
          for (const newItem of batchItems) {
              const original = originalActive.find(o => o.id === newItem.id);
              if (!original) continue; // Should not happen

              if (newItem.quantity !== original.quantity) {
                  updates.push(
                      updateOrderItemSecurely(newItem.id, newItem.quantity, original.quantity, voidReason || "Batch Update")
                  );
              }
          }

          // 2. Handle Deletions
          const newIds = batchItems.map(i => i.id);
          const removedItems = originalActive.filter(i => !newIds.includes(i.id));

          for (const removed of removedItems) {
              updates.push(voidOrderItem(removed.id, voidReason || "Batch Removed"));
          }

          await Promise.all(updates);
          toast.success("Order Updated Successfully");

          // Sync Local State (Or rely on Realtime? Realtime might be safer but slow)
          // For immediate feedback let's allow Realtime to catch up, or refetch.
          // Since we rely on 'session' prop which is realtime, we might just wait.
          // But to be responsive, we close edit mode.
          
      } catch (e) {
          console.error(e);
          toast.error("Update Failed: " + e.message);
      } finally {
          setLoading(false);
          setIsBatchEditing(false);
          setIsVoidModalOpen(false);
          setItemToVoid(null);
      }
  }


  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#1F1D2B] z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <DrawerHeader
          table={table}
          session={session}
          onClose={onClose}
          onOpenMenu={() => setIsMenuOpen(true)}
          onCloseTable={handleCloseTable} 
        />
        
        {/* TOOLBAR: Print */}
        <div className="bg-[#252836] p-2 flex justify-end px-4 border-b border-white/5">
            <button 
                onClick={() => toast('Print feature coming soon', { icon: '🖨️' })}
                className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-gray-300 transition-colors"
            >
                <FaPrint /> Print Bill
            </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 bg-[#1F1D2B]">
          {!session ? (
            <DrawerEmptyState
              onStartSession={handleStartSession}
              loading={loading}
            />
          ) : (
            <>
               {/* 1. CONFIRMED BY WAITER (Main Action for Cashier) */}
               {confirmedItems.length > 0 && (
                 <OrderSection
                    title="Ready for Prep (Waiter Confirmed)"
                    count={confirmedItems.length}
                    accentColor="orange"
                    icon={<FaFire />}
                 >
                    <div className="space-y-3">
                        {confirmedItems.map(item => (
                            <SwipeableOrderItem 
                                key={item.id} 
                                item={item} 
                                isPending={false} // Can't delete easily? Or allow? Assuming allow.
                                onUpdateQty={onUpdateQty}
                                onDelete={onDeleteItem}
                            />
                        ))}
                        <button
                            onClick={handleSendToKitchen}
                            disabled={loading}
                            className="w-full mt-4 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40 active:scale-95 transition-all"
                        >
                            <FaUtensils className="text-xl" /> START PREPIARING
                        </button>
                    </div>
                 </OrderSection>
               )}
               
               {/* 2. PENDING (Waiter hasn't confirmed yet) */}
               {pendingItems.length > 0 && (
                   <OrderSection
                        title="Pending (Waiter Review)"
                        count={pendingItems.length}
                        accentColor="gray"
                        icon={<FaClock />}
                   >
                       <div className="space-y-3 opacity-80">
                           {pendingItems.map(item => (
                               <SwipeableOrderItem
                                   key={item.id}
                                   item={item}
                                   isPending={true}
                                   onUpdateQty={onUpdateQty}
                                   onDelete={onDeleteItem}
                               />
                           ))}
                           {/* Cashier Override Confirm */}
                           <button
                                onClick={handleConfirmPending}
                                className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-bold rounded-lg border border-gray-600"
                           >
                               Override Confirm
                           </button>
                       </div>
                   </OrderSection>
               )}

               {/* 3. IN KITCHEN / SERVED (Steady Green) */}
               {activeItems.length > 0 && (
                   <OrderSection
                        title="In Kitchen / Served"
                        count={activeItems.length}
                        accentColor="green"
                        icon={<FaCheck />}
                        action={
                            !isBatchEditing && (
                                <button 
                                    onClick={handleStartBatchEdit}
                                    className="text-sm font-bold text-green-500 hover:text-green-400 underline"
                                >
                                    Edit Order
                                </button>
                            )
                        }
                   >
                       {isBatchEditing ? (
                           <div className="space-y-4">
                               <div className="space-y-3">
                                   {batchItems.map(item => (
                                       <SwipeableOrderItem
                                           key={item.id}
                                           item={item}
                                           isPending={false} // UI Style: Looks like confirmed but editable
                                           onUpdateQty={handleBatchQtyChange}
                                           onDelete={handleBatchDelete}
                                           // No readOnly here, we want provided controls
                                       />
                                   ))}
                               </div>
                               <div className="flex gap-3">
                                   <button 
                                        onClick={handleCancelBatchEdit}
                                        className="flex-1 py-3 bg-gray-700 text-gray-300 font-bold rounded-xl"
                                   >
                                       Cancel
                                   </button>
                                   <button 
                                        onClick={handleSaveBatchClick}
                                        className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-900/40"
                                   >
                                       Save Changes
                                   </button>
                               </div>
                           </div>
                       ) : (
                           <div className="space-y-3 opacity-90">
                                {activeItems.map(item => (
                                    <SwipeableOrderItem
                                        key={item.id}
                                        item={item}
                                        isPending={false}
                                        readOnly={true} // Locked view
                                    />
                                ))}
                           </div>
                       )}
                   </OrderSection>
               )}
            </>
          )}
        </div>

        {session && (
          <DrawerFooter
            totalAmount={totalAmount}
            onCloseTable={handleCloseTable}
            loading={loading}
          />
        )}
      </div>

      <WaiterMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        cartItems={localItems}
        onAdd={handleMenuAdd}
        onRemove={handleMenuRemove}
        restaurantId={session?.restaurant_id}
      />

      <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          session={session ? {...session, table } : null} // Pass table details if needed inside
          onCheckout={async (sessionId, method, amount) => {
              const res = await onCheckout(sessionId, method, amount);
              if (res.success) {
                  setIsPaymentModalOpen(false);
                  onClose(); // Close drawer
                  toast.success("Table Closed & Paid successfully!");
              } else {
                  toast.error("Checkout Failed: " + (res.error?.message || "Unknown error"));
              }
          }}
      />
      <VoidReasonModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onConfirm={handleConfirmVoid}
        item={itemToVoid}
      />
    </>
  );
}
