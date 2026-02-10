import { FaClock, FaCheck } from "react-icons/fa";
import OrderSection from "./OrderSection";
import SwipeableOrderItem from "./SwipeableOrderItem";
import Loader from "@/components/ui/Loader";
import { useRestaurantFeatures } from "@/app/hooks/useRestaurantFeatures";
import FeatureGuard from "@/components/shared/FeatureGuard";
import { useLanguage } from "@/context/LanguageContext";

export default function PendingOrderList({ 
    items, 
    role, 
    loading, 
    loadingOp,
    onUpdateQty, 
    onDelete, 
    onConfirm 
}) {
    const { features } = useRestaurantFeatures();
    const { t } = useLanguage();
    
    if (items.length === 0) return null;

    // Group Items Logic
    const groupedItems = Object.values(items.reduce((acc, item) => {
        const key = item.product_id || item.product?.id;
        if (!acc[key]) {
            acc[key] = { ...item, quantity: 0, ids: [], originalItems: [] };
        }
        acc[key].quantity += item.quantity;
        acc[key].ids.push(item.id);
        acc[key].originalItems.push(item);
        return acc;
    }, {}));

    const handleGroupUpdate = (itemId, newTotal) => {
        const group = groupedItems.find(g => g.id === itemId);
        if (!group) return;

        const currentTotal = group.quantity;
        const diff = newTotal - currentTotal;
        if (diff === 0) return;

        if (diff > 0) {
            // Increase: Add to the first item
            const firstItem = group.originalItems[0];
            onUpdateQty(firstItem.id, firstItem.quantity + diff);
        } else {
            // Decrease: Reduce from items or delete them
            let remainingToRemove = Math.abs(diff);
            for (const item of group.originalItems) {
                if (remainingToRemove <= 0) break;

                if (item.quantity > remainingToRemove) {
                    onUpdateQty(item.id, item.quantity - remainingToRemove);
                    remainingToRemove = 0;
                } else {
                    onDelete(item.id);
                    remainingToRemove -= item.quantity;
                }
            }
        }
    };

    const handleGroupDelete = (itemId) => {
        const group = groupedItems.find(g => g.id === itemId);
        if (group) {
            group.ids.forEach(id => onDelete(id));
        }
    };

    // WAITER VIEW
    if (role === 'waiter') {
        return (
            <OrderSection
                title={t('newOrders')}
                count={groupedItems.length}
                accentColor="orange"
                icon={<FaClock />}
            >
                <div className="space-y-3">
                    {groupedItems.map((item) => (
                        <SwipeableOrderItem
                            key={item.id}
                            item={item}
                            isPending={true}
                            onUpdateQty={handleGroupUpdate}
                            onDelete={handleGroupDelete}
                        />
                    ))}
                    <FeatureGuard feature="ordering_enabled">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`w-full mt-4 py-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-orange-900/30 ${
                            loading 
                            ? "bg-[#ea7c69]/80 cursor-not-allowed opacity-70" 
                            : "bg-[#ea7c69] hover:bg-[#d96b58] cursor-pointer"
                        }`}
                    >
                        {loadingOp === 'CONFIRM_ORDER' ? (
                            <Loader active={true} variant="inline" className="h-6 w-6" />
                        ) : (
                            <>
                                <FaCheck className="text-xl" /> 
                                {features.kitchen 
                                    ? (features.cashier ? t('confirmSendCashier') : t('confirmSendKitchen'))
                                    : t('confirmServe')}
                            </>
                        )}
                    </button>
                    </FeatureGuard>
                </div>
            </OrderSection>
        );
    }

    // CASHIER VIEW
    if (role === 'cashier') {
        return (
            <OrderSection
                title={t('newOrderCashier')}
                count={groupedItems.length}
                accentColor="blue"
                icon={<FaClock />}
            >
                <div className="space-y-3 opacity-95">
                    {groupedItems.map(item => (
                        <SwipeableOrderItem 
                            key={item.id} 
                            item={item} 
                            isPending={true} 
                            onUpdateQty={handleGroupUpdate} 
                            onDelete={handleGroupDelete} 
                        />
                    ))}
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`w-full mt-4 py-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-900/30 ${
                            loading 
                            ? "bg-blue-500/80 cursor-not-allowed opacity-70" 
                            : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
                        }`}
                    >
                         {loadingOp === 'CONFIRM_ORDER' ? (
                            <Loader active={true} variant="inline" className="h-6 w-6" />
                        ) : (
                            <>
                                <FaCheck className="text-xl" /> {features.kitchen ? t('sendToKitchen') : t('markServed')}
                            </>
                        )}
                    </button>
                </div>
            </OrderSection>
        );
    }
    
    return null;
}
