import { FaFire, FaUtensils, FaCheck } from "react-icons/fa";
import OrderSection from "./OrderSection";
import SwipeableOrderItem from "./SwipeableOrderItem";
import Loader from "@/components/ui/Loader";
import { useRestaurantFeatures } from "@/app/hooks/useRestaurantFeatures";
import { useLanguage } from "@/context/LanguageContext";

export default function ConfirmedOrderList({ 
    items, 
    role, 
    loading, 
    loadingOp,
    onUpdateQty, 
    onDelete, 
    onStartPreparing 
}) {
    const { features } = useRestaurantFeatures();
    const { t } = useLanguage();

    if (items.length === 0) return null;

    // CASHIER & WAITER VIEW (Actionable)
    if (role === 'cashier' || role === 'waiter') {
        return (
             <OrderSection
                title={role === 'waiter' ? t('sentToKitchen') : t('readyForPrep')}
                count={items.length}
                accentColor="yellow"
                icon={<FaFire />}
             >
                <div className="space-y-3">
                    {items.map(item => (
                        <SwipeableOrderItem key={item.id} item={item} isPending={false} onUpdateQty={onUpdateQty} onDelete={onDelete} />
                    ))}
                    <button
                        onClick={onStartPreparing}
                        disabled={loading}
                        className={`w-full mt-4 py-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                            loading 
                            ? "bg-gray-500 cursor-not-allowed opacity-70"
                            : features.kitchen 
                                ? "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 shadow-yellow-900/40"
                                : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-green-900/40"
                        }`}
                    >
                        {loadingOp === 'PREPARE_ORDER' ? (
                            <Loader active={true} variant="inline" className="h-6 w-6" />
                        ) : (
                            <>
                                {features.kitchen ? (
                                    <><FaUtensils className="text-xl" /> {t('startPreparing')}</>
                                ) : (
                                    <><FaCheck className="text-xl" /> {t('markServed')}</>
                                )}
                            </>
                        )}
                    </button>
                </div>
             </OrderSection>
        );
    }

    // WAITER VIEW (Read-only / Sent)
    // Waiter usually sees confirmed combined with served if we want.
    // But per original code: "For Waiter: Includes Confirmed and Served".
    // So usually Waiter doesn't see a separate "Confirmed" block unless we split it.
    // The original code concatened confirmed + active for waiter.
    // Let's defer to ActiveOrderList for waiter if we want to merge them, OR handle it here if we want to change UI.
    // Original Code: 
    // confirmedItems.concat(activeItems).length > 0 && ( ... OrderSection title="Sent to Kitchen" ... )
    
    // So ConfirmedOrderList might not be used for Waiter if we stick to exact original UI.
    // But refactoring allows us to be cleaner. separate might be better?
    // User asked to clean up.
    // Let's keep it separate if meaningful, or combine them in ActiveOrderList for waiter.
    // For now, let's say Waiter passes confirmed items to ActiveOrderList if they want them merged.
    // Or we can return null here for waiter and let parent handle merging.
    
    return null;
}
