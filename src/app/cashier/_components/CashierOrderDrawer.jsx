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
import toast from "react-hot-toast";

// Reuse Waiter Components (User Request)
import DrawerHeader from "@/app/waiter/_components/drawer/DrawerHeader";
import DrawerFooter from "@/app/waiter/_components/drawer/DrawerFooter";
import SwipeableOrderItem from "@/app/waiter/_components/drawer/SwipeableOrderItem";
import DrawerEmptyState from "@/app/waiter/_components/drawer/DrawerEmptyState";
import OrderSection from "@/app/waiter/_components/drawer/OrderSection";
import WaiterMenuModal from "@/app/waiter/_components/WaiterMenuModal";

export default function CashierOrderDrawer({ table, session, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [localItems, setLocalItems] = useState([]); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    if (!confirm(`Close Table ${table.table_number}?`)) return;
    setLoading(true);
    try {
      await closeTableSession(session.id);
      toast.success("Table Closed");
      onClose();
    } catch (error) { toast.error("Failed"); } 
    finally { setLoading(false); }
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
      setLocalItems(prev => prev.filter(i => i.id !== itemId))
      try { await deleteOrderItem(itemId) } catch(e){}
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
                   >
                       <div className="space-y-3 opacity-60">
                            {activeItems.map(item => (
                                <SwipeableOrderItem
                                    key={item.id}
                                    item={item}
                                    isPending={false}
                                    readOnly={true} // Can't edit easily once cooking
                                />
                            ))}
                       </div>
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
    </>
  );
}
