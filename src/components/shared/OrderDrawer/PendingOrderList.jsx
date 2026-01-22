import { FaClock, FaCheck } from "react-icons/fa";
import OrderSection from "./OrderSection";
import SwipeableOrderItem from "./SwipeableOrderItem";
import Loader from "@/components/ui/Loader";
import { useRestaurantFeatures } from "@/app/hooks/useRestaurantFeatures";
import FeatureGuard from "@/components/shared/FeatureGuard";

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
    
    if (items.length === 0) return null;

    // WAITER VIEW
    if (role === 'waiter') {
        return (
            <OrderSection
                title="New Orders (To Confirm)"
                count={items.length}
                accentColor="orange"
                icon={<FaClock />}
            >
                <div className="space-y-3">
                    {items.map((item) => (
                        <SwipeableOrderItem
                            key={item.id}
                            item={item}
                            isPending={true}
                            onUpdateQty={onUpdateQty}
                            onDelete={onDelete}
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
                                    ? (features.cashier ? "CONFIRM & SEND TO CASHIER" : "CONFIRM & SEND TO KITCHEN")
                                    : "CONFIRM & SERVE"}
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
                title="New Order (Cashier)"
                count={items.length}
                accentColor="blue"
                icon={<FaClock />}
            >
                <div className="space-y-3 opacity-95">
                    {items.map(item => (
                        <SwipeableOrderItem key={item.id} item={item} isPending={true} onUpdateQty={onUpdateQty} onDelete={onDelete} />
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
                                <FaCheck className="text-xl" /> {features.kitchen ? "SEND TO KITCHEN" : "MARK AS SERVED"}
                            </>
                        )}
                    </button>
                </div>
            </OrderSection>
        );
    }
    
    return null;
}
