"use client";
import { useEffect } from "react";
import { FaPrint } from "react-icons/fa";
// Hooks
import { useOrderDrawerLogic } from "@/app/hooks/useOrderDrawerLogic";
// Animation Hook
import { useMountTransition } from "@/app/hooks/useMountTransition";
// Sub-Components
import DrawerHeader from "./DrawerHeader";
import DrawerFooter from "./DrawerFooter";
import DrawerEmptyState from "./DrawerEmptyState";
import PendingOrderList from "./PendingOrderList";
import ConfirmedOrderList from "./ConfirmedOrderList";
import ActiveOrderList from "./ActiveOrderList";
import ReceiptTemplate from "../ReceiptTemplate";
// Shared Modals (Outside of this folder)
import MenuModal from "../MenuModal";
import PaymentModal from "../PaymentModal";
import VoidReasonModal from "../VoidReasonModal";
import Loader from "@/components/ui/Loader";

export default function OrderDrawer({ 
    table, 
    session,
    restaurant, 
    isOpen, 
    onClose, 
    role = "waiter", 
    onCheckout,
    onTransfer
}) {
    // Pass onClose as the 5th argument to handle auto-close on table close
    const { state, setters, actions } = useOrderDrawerLogic(session, table, onCheckout, role, onClose);
    const {
        loading, loadingOp, localItems, pendingItems, confirmedItems, activeItems, totalAmount,
        isMenuOpen, isPaymentModalOpen, isVoidModalOpen, itemToVoid, isBatchEditing, batchItems
    } = state;

    // Animation Hook
    const isTransitioning = useMountTransition(isOpen, 300);

    // Scroll Lock
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isTransitioning && !isOpen) return null;

    // Safe guard if table is missing but allow anim out to prevent abrupt disappearance
    if (!table && !isTransitioning) return null; 

    const show = isOpen && isTransitioning;

    return (
        <>
            <div 
                onClick={onClose} 
                className={`fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
            />

            <div 
                className={`fixed inset-y-0 right-0 w-full max-w-md bg-[#1F1D2B] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${show ? 'translate-x-0' : 'translate-x-full'}`}
            >
                
                <DrawerHeader
                    table={table}
                    session={session}
                    onClose={onClose}
                    onOpenMenu={() => setters.setIsMenuOpen(true)}
                    onCloseTable={actions.handleForceCloseTable}
                    onTransfer={onTransfer}
                    loading={loading}
                    loadingOp={loadingOp}
                />

                {role === 'cashier' && (
                    <div className="bg-[#252836] p-2 flex justify-end px-4 border-b border-white/5">
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-gray-300 transition-colors"
                        >
                            <FaPrint /> Print Bill
                        </button>
                    </div>
                )}

                {/* Hidden Receipt Template (Visible only in print) */}
                <ReceiptTemplate 
                    table={table}
                    session={session}
                    items={[...confirmedItems, ...activeItems]}
                    total={totalAmount}
                    restaurant={restaurant}
                />

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 bg-[#1F1D2B] relative">
                    {!session ? (
                        <DrawerEmptyState 
                            onStartSession={actions.handleStartSession} 
                            loading={loading} 
                        />
                    ) : (
                        <>
                            {/* 1. Pending Items (Both roles see them differently) */}
                            <PendingOrderList
                                items={pendingItems}
                                role={role}
                                loading={loading}
                                loadingOp={loadingOp}
                                onUpdateQty={actions.onUpdateQty}
                                onDelete={actions.onDeleteItem}
                                onConfirm={
                                    role === 'cashier' 
                                        ? actions.handleCashierInstantSend 
                                        : actions.handleConfirmOrder
                                }
                            />

                            {/* 2. Confirmed Items (Cashier specific usually) */}
                            <ConfirmedOrderList
                                items={confirmedItems}
                                role={role}
                                loading={loading}
                                loadingOp={loadingOp}
                                onUpdateQty={actions.onUpdateQty}
                                onDelete={actions.onDeleteItem}
                                onStartPreparing={actions.handleStartPreparing}
                            />

                            {/* 3. Active/Served Items (Both) */}
                            <ActiveOrderList
                                // Waiter: Active Only (Confirmed now handled separately above)
                                items={activeItems}
                                role={role}
                                isBatchEditing={isBatchEditing}
                                batchItems={batchItems}
                                loading={loading}
                                loadingOp={loadingOp}
                                onEditOrder={actions.handleStartBatchEdit}
                                onCancelEdit={actions.handleCancelBatchEdit}
                                onSaveEdit={actions.handleExecuteBatch}
                                onUpdateBatchQty={(id, qty) => setters.setBatchItems(p => p.map(i => i.id === id ? {...i, quantity: qty} : i))}
                                onDeleteBatchItem={(id) => setters.setBatchItems(p => p.filter(i => i.id !== id))}
                                onUpdateQty={actions.onUpdateQty}
                                onDelete={actions.onDeleteItem}
                            />
                        </>
                    )}
                </div>

                {session && (
                    <DrawerFooter
                        totalAmount={totalAmount}
                        onCloseTable={actions.handlePaymentRequest}
                        loading={loading}
                    />
                )}
                {/* LOADING OVERLAY (Centered in Drawer) */}
                {(loadingOp === 'CONFIRM_ORDER' || loadingOp === 'PREPARE_ORDER') && (
                    <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                        <div className="p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center gap-3">
                             <Loader variant="inline" className="w-10 h-10" />
                             <span className="text-white/50 text-xs font-bold tracking-wider">UPDATING...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <MenuModal
                isOpen={isMenuOpen}
                onClose={() => setters.setIsMenuOpen(false)}
                cartItems={localItems}
                onAdd={actions.handleMenuAdd}
                onRemove={actions.handleMenuRemove}
                restaurantId={session?.restaurant_id}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setters.setIsPaymentModalOpen(false)}
                session={session ? {...session, table } : null}
                onCheckout={async (sid, method, amt) => {
                    const success = await actions.handleCheckoutWrapper(sid, method, amt);
                    if (success) onClose();
                }}
            />

            <VoidReasonModal
                isOpen={isVoidModalOpen}
                onClose={() => setters.setIsVoidModalOpen(false)}
                onConfirm={actions.handleConfirmVoid}
                item={itemToVoid}
            />
        </>
    );
}
