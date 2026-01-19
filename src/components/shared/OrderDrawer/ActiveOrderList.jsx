import { FaReceipt, FaCheck, FaPen } from "react-icons/fa";
import OrderSection from "./OrderSection";
import SwipeableOrderItem from "./SwipeableOrderItem";
import Loader from "@/components/ui/Loader";

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
    onDelete,
    loading,
    loadingOp
}) {
    if (items.length === 0) return null;

    // Unified View
    // GROUPING LOGIC: Aggregate items by product_id
    const groupedItems = Object.values(items.reduce((acc, item) => {
        const key = item.product_id || item.product?.id;
        if (!acc[key]) {
            acc[key] = { 
                ...item, 
                quantity: 0, 
                ids: [], // Keep track of all real IDs in this group
                // Use a stable virtual ID for the UI key
                virtualId: `group-${key}` 
            };
        }
        acc[key].quantity += item.quantity;
        acc[key].ids.push(item.id);
        return acc;
    }, {}));

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
            count={groupedItems.length} // Count unique groups now
            accentColor={getAccentColor()}
            icon={getIcon()}
            action={
            !isBatchEditing && (
                <button 
                    onClick={onEditOrder} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
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
                            key={item.virtualId || item.id}
                            item={item}
                            isPending={false}
                            onUpdateQty={onUpdateBatchQty}
                            onDelete={onDeleteBatchItem}
                            allowIncrease={false}
                        />
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancelEdit} className="flex-1 py-3 bg-gray-700 text-gray-300 font-bold rounded-xl cursor-pointer hover:bg-gray-600">Cancel</button>
                    <button 
                        onClick={onSaveEdit} 
                        disabled={loading}
                        className={`flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-900/40 flex items-center justify-center gap-2 ${
                            loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-green-500"
                        }`}
                    >
                        {loadingOp === 'BATCH_UPDATE' ? (
                             <Loader active={true} variant="inline" className="h-5 w-5" />
                        ) : "Save Changes"}
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-3 opacity-90">
                {groupedItems.map(item => (
                    <SwipeableOrderItem key={item.virtualId} item={item} isPending={false} readOnly={true} />
                ))}
            </div>
        )}
        </OrderSection>
    );
}
