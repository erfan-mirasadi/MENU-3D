'use client'
import KitchenTimer from './KitchenTimer'
import { RiCheckboxCircleLine, RiRestaurantLine } from 'react-icons/ri';

export default function KitchenOrderCard({ order, onConfirm, onServe }) {
    const isNew = order.status === 'confirmed' || order.status === 'pending' // Handle legacy pending too just in case
    const isPreparing = order.status === 'preparing'

    // Visual Styles
    const containerClasses = isNew 
        ? "border-orange-500 bg-orange-50/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse"
        : "border-yellow-400 bg-yellow-50 shadow-md"
    
    // Status Text
    const statusText = isNew ? "NEW ORDER" : "PREPARING"
    const statusColor = isNew ? "text-orange-600" : "text-yellow-600"

    return (
        <div 
            className={`
                relative flex flex-col justify-between 
                rounded-2xl border-2 p-4 h-full min-h-[300px]
                transition-all duration-300 transform animate-in fade-in zoom-in-95
                ${containerClasses}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Table {order.session?.tables?.table_number || "?"}
                    </h3>
                    <div className={`text-sm font-black tracking-wider ${statusColor} flex items-center gap-1`}>
                        {isNew && <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"/>}
                        {statusText}
                    </div>
                </div>
                <KitchenTimer createdAt={order.created_at} />
            </div>

            {/* Content: Big Item Name */}
            <div className="flex-grow flex flex-col justify-center items-center text-center gap-2 mb-6">
                <span className="text-5xl font-black text-gray-800 leading-tight">
                    {order.quantity}x
                </span>
                <span className="text-2xl font-bold text-gray-700 leading-snug">
                    {typeof order.products?.title === 'object' 
                        ? (order.products.title?.en || order.products.title?.ru || order.products.title?.tr || "Unknown Item")
                        : order.products?.title}
                </span>
                {/* Image optional if big text is preferred, user said "only name and count" */}
            </div>

            {/* Actions */}
            <div className="pt-2">
                {isNew && (
                    <button 
                        onClick={() => onConfirm(order.id)}
                        className="w-full py-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-2xl font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <RiRestaurantLine size={32} />
                        START COOKING
                    </button>
                )}

                {isPreparing && (
                    <button 
                        onClick={() => onServe(order.id)}
                        className="w-full py-6 rounded-xl bg-green-500 hover:bg-green-600 text-white text-2xl font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <RiCheckboxCircleLine size={32} />
                        READY TO SERVE
                    </button>
                )}
            </div>
        </div>
    )
}
