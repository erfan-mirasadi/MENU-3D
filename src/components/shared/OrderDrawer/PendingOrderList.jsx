import { FaClock, FaCheck } from "react-icons/fa";
import OrderSection from "./OrderSection";
import SwipeableOrderItem from "./SwipeableOrderItem";
import Loader from "@/components/ui/Loader";

export default function PendingOrderList({ 
    items, 
    role, 
    loading, 
    loadingOp,
    onUpdateQty, 
    onDelete, 
    onConfirm 
}) {
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
                                <FaCheck className="text-xl" /> CONFIRM & SEND TO KITCHEN
                            </>
                        )}
                    </button>
                </div>
            </OrderSection>
        );
    }

    // CASHIER VIEW
    if (role === 'cashier') {
        return (
            <OrderSection
                title="Pending (Waiter Review)"
                count={items.length}
                accentColor="gray"
                icon={<FaClock />}
            >
                <div className="space-y-3 opacity-80">
                    {items.map(item => (
                        <SwipeableOrderItem key={item.id} item={item} isPending={true} onUpdateQty={onUpdateQty} onDelete={onDelete} />
                    ))}
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
                                <FaCheck className="text-xl" /> SEND TO KITCHEN
                            </>
                        )}
                    </button>
                </div>
            </OrderSection>
        );
    }
    
    return null;
}
