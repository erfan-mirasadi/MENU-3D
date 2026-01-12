import { FaReceipt, FaCheck, FaPen } from "react-icons/fa";
import OrderSection from "./OrderSection";
import SwipeableOrderItem from "./SwipeableOrderItem";

export default function ActiveOrderList({ 
    items, 
    role, 
    isBatchEditing,
    onEditOrder,
    onCancelEdit,
    onSaveEdit,
    batchItems,
    onUpdateBatchQty,
    onDeleteBatchItem,
    onUpdateQty,
    onDelete
}) {
    if (items.length === 0) return null;

    // Unified View
    const getTitle = () => {
        if (role === 'waiter') return "Sent to Kitchen";
        return "In Kitchen / Served";
    };

    const getIcon = () => {
        if (role === 'waiter') return <FaReceipt />;
        return <FaCheck />;
    };

    const getAccentColor = () => {
        if (role === 'waiter') return "blue";
        return "green";
    };

    return (
        <OrderSection
            title={getTitle()}
            count={items.length}
            accentColor={getAccentColor()}
            icon={getIcon()}
            action={
            !isBatchEditing && (
                <button 
                    onClick={onEditOrder} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        role === 'waiter' 
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" 
                            : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                    }`}
                >
                    <FaPen /> Edit
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
                            isPending={false}
                            onUpdateQty={onUpdateBatchQty}
                            onDelete={onDeleteBatchItem}
                            allowIncrease={false}
                        />
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancelEdit} className="flex-1 py-3 bg-gray-700 text-gray-300 font-bold rounded-xl">Cancel</button>
                    <button onClick={onSaveEdit} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-900/40">Save Changes</button>
                </div>
            </div>
        ) : (
            <div className="space-y-3 opacity-90">
                {items.map(item => (
                    <SwipeableOrderItem key={item.id} item={item} isPending={false} readOnly={true} />
                ))}
            </div>
        )}
        </OrderSection>
    );
}
