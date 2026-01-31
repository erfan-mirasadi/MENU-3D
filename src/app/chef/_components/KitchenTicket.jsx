'use client'
import { useState } from 'react'
import KitchenTimer from './KitchenTimer'
import { RiRestaurantLine, RiCheckboxCircleLine, RiCheckDoubleLine, RiTimeLine, RiAlertFill } from 'react-icons/ri'
import Loader from '@/components/ui/Loader'

    // Single Item Row Component
    function TicketItem({ item, onUpdateStatus }) {
        const [loading, setLoading] = useState(false)

        const isPending = item.status === 'pending' || item.status === 'confirmed'
        const isPreparing = item.status === 'preparing'
        const isReady = item.status === 'ready'
        const isServed = item.status === 'served'

        // Wrapper to handle local loading state and GROUP updates
        const handleAction = async (newStatus) => {
            if (loading) return
            setLoading(true)
            try {
                // If item has multiple IDs (grouped), update all of them
                if (item.ids && item.ids.length > 0) {
                    await Promise.all(item.ids.map(id => onUpdateStatus(id, newStatus)))
                } else {
                    // Fallback for single item structure
                    await onUpdateStatus(item.id, newStatus)
                }
            } finally {
                setLoading(false)
            }
        }

        // Localized Title Helper
        const getTitle = (product) => {
            if (!product?.title) return "Unknown Item"
            if (typeof product.title === 'object') {
                return product.title.en || product.title.ru || product.title.tr || "Unknown Item"
            }
            return product.title
        }

        return (
            <div className={`
                flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200
                ${isPending ? 'border-orange-200 bg-orange-50/30' : ''}
                ${isPreparing ? 'border-yellow-200 bg-yellow-50/30' : ''}
                ${isReady ? 'border-green-500 bg-green-50' : ''}
                ${isServed ? 'border-gray-200 bg-gray-50 opacity-75' : ''} 
            `}>
                {/* Left: Qty & Name */}
                <div className="flex items-center gap-3">
                    <span className={`
                        flex items-center justify-center w-8 h-8 rounded-lg font-black text-lg
                        ${isPending ? 'bg-orange-100 text-orange-700' : ''}
                        ${isPreparing ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${isReady ? 'bg-green-500 text-white' : ''}
                        ${isServed ? 'bg-gray-200 text-gray-500' : ''}
                    `}>
                        {item.quantity}
                    </span>
                    <div>
                         <span className={`block font-bold text-lg leading-tight ${isServed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {getTitle(item.products)}
                         </span>
                         {/* Status Badge */}
                         <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {item.status === 'confirmed' ? 'NEW' : item.status}
                         </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {isPending && (
                        <button 
                            onClick={() => handleAction('preparing')}
                            disabled={loading}
                            className={`p-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 active:scale-95 transition-all w-12 h-12 flex items-center justify-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <Loader variant="inline" /> : <RiRestaurantLine size={20} />}
                        </button>
                    )}
                    {isPreparing && (
                        <button 
                            onClick={() => handleAction('ready')}
                            disabled={loading}
                            className={`p-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95 transition-all w-12 h-12 flex items-center justify-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <Loader variant="inline" /> : <RiCheckboxCircleLine size={20} />}
                        </button>
                    )}
                     {isReady && !isServed && (
                        <button 
                            onClick={() => handleAction('preparing')}
                            disabled={loading}
                            className={`p-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-500 shadow-md active:scale-95 transition-all w-12 h-12 flex items-center justify-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            title="Undo (Set back to Preparing)"
                        >
                            {loading ? <Loader variant="inline" /> : <RiTimeLine size={20} />}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    export default function KitchenTicket({ session, orders, onUpdateStatus, onServeAll }) {
        const [loading, setLoading] = useState(false)

        // Handle Bulk Action Loading Locally
        const handleServeAllWrapper = async () => {
            if (loading) return
            setLoading(true)
            try {
                await onServeAll(orders)
            } finally {
                setLoading(false)
            }
        }

        // Determine Ticket Status
        const hasPending = orders.some(o => o.status === 'pending' || o.status === 'confirmed')
        
        const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
        const oldestOrderTime = activeOrders.reduce((oldest, o) => {
            return (new Date(o.created_at) < new Date(oldest)) ? o.created_at : oldest
        }, new Date().toISOString())

        // GROUPING LOGIC (Aggregation)
        const groupedOrders = Object.values(orders.filter(item => item.status !== 'served').reduce((acc, item) => {
            // User Request: Group items if status is 'preparing' OR 'ready'.
            // Also MUST distinguish by Notes/Options.
            
            const isGroupable = item.status === 'preparing' || item.status === 'ready';
            
            let key;
            if (isGroupable) {
                 const notesKey = item.notes ? item.notes.trim() : 'no-notes';
                 // Use product_id (FK) first. Fallback to products.id.
                 const pId = item.product_id || item.products?.id || 'unknown';
                 // Group by Product + Status + Notes (So "Preparing" items are one group, "Ready" items are another)
                 key = `${pId}-${item.status}-${notesKey}`;
            } else {
                 // For 'confirmed' (New), keep them separate (Unique Key) so chef can start them individually if needed (or we could group these too if requested later)
                 key = item.id; 
            }

            if (!acc[key]) {
                acc[key] = { 
                    ...item, 
                    quantity: 0, 
                    ids: [] 
                };
            }
            acc[key].quantity += item.quantity;
            acc[key].ids.push(item.id);
            return acc;
        }, {}));

        return (
            <div className={`
                flex flex-col bg-white rounded-2xl overflow-hidden shadow-xl border-2 transition-all duration-300
                ${hasPending ? 'border-orange-500 shadow-orange-100' : 'border-yellow-400 shadow-yellow-100'}
            `}>
                {/* Header */}
                <div className={`
                    p-4 flex justify-between items-center border-b-2
                    ${hasPending ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-17 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-md
                            ${hasPending ? 'bg-orange-500 animate-pulse' : 'bg-yellow-500'}
                        `}>
                            {session?.tables?.table_number || "?"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Table</span>
                        </div>
                    </div>
                    
                    {/* Timer (Based on oldest item) */}
                    <KitchenTimer createdAt={oldestOrderTime} />
                </div>

                {/* Session Note (Alert) */}
                {session?.note && (
                    <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
                        <RiAlertFill className="text-red-500 text-xl shrink-0 mt-0.5" />
                        <div>
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-0.5">
                                Special Instructions
                            </span>
                            <p className="text-red-800 text-lg font-medium leading-snug">
                                {session.note}
                            </p>
                        </div>
                    </div>
                )}

                {/* Ticket Body (Scrollable List) */}
                <div className="flex-1 p-3 space-y-3 bg-gray-50/50">
                    {groupedOrders.map(item => (
                        <TicketItem 
                            key={item.ids[0]} // Use first ID as key for stability
                            item={item} 
                            onUpdateStatus={onUpdateStatus} 
                        />
                    ))}
                </div>

            {/* Ticket Footer (Bulk Actions) */}
            <div className="p-3 bg-white border-t border-gray-100">
                <button 
                    onClick={handleServeAllWrapper}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black uppercase tracking-wider shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                    {loading ? <Loader variant="inline" /> : (
                        <>
                            <span>ALL PREPARED</span>
                            <RiCheckDoubleLine size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
