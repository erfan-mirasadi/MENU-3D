import React, { useRef, useState, useEffect } from 'react';
import { 
    RiFileList3Line, 
    RiCheckLine, 
    RiArrowDownLine, 
    RiDiscountPercentLine 
} from "react-icons/ri";

export default function OrderSummary({ paymentState, session }) {
    const {
        t, language, restaurant,
        orderItems, groupedItems, selectedItemIds, toggleItemSelection,
        bill, setShowAdjModal, paidAmount, remainingTotal
    } = paymentState;
    const listRef = useRef(null);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const checkScroll = () => {
        const el = listRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const canScroll = scrollHeight > clientHeight;
        const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10;
        setShowScrollIndicator(canScroll && !isAtBottom);
    };

    useEffect(() => {
        setTimeout(checkScroll, 100);
    }, [groupedItems]);

    return (
        <div className="w-full md:w-[450px] flex flex-col border-b md:border-b-0 md:border-r border-[#252836] bg-[#1F1D2B] relative max-h-[40dvh] md:max-h-none">
            <div className="p-6 border-b border-[#252836] bg-[#252836]/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <RiFileList3Line className="text-[#ea7c69]"/> {t("orderDetails")}
                </h2>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{t("table")} #{session?.table?.table_number}</span>
                    <span>{orderItems.length} {t("items")}</span>
                </div>
            </div>

            <div 
                ref={listRef}
                onScroll={checkScroll}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 scroll-smooth"
            >
                 {groupedItems.map(item => { 
                     const isSelected = item.ids.length > 0 && item.ids.every(id => selectedItemIds.has(id));
                     const isPaid = item.isPaid;
                     const price = item.quantity * Number(item.unit_price_at_order);
                     
                     const fallbackLang = restaurant?.default_language || 'en';
                     const title = typeof item.product?.title === 'object'
                        ? (item.product.title?.[language] || item.product.title?.[fallbackLang] || "Unknown Item")
                        : (item.product?.title || "Unknown Item");

                     return (
                         <div 
                            key={`${item.product?.id || item.product_id || 'unknown'}-${isPaid}`}
                            onClick={() => toggleItemSelection(item)} 
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                isPaid 
                                ? "bg-[#252836]/50 border-transparent opacity-50 cursor-not-allowed" 
                                : isSelected 
                                    ? "bg-[#ea7c69]/10 border-[#ea7c69]" 
                                    : "bg-[#252836] border-transparent hover:border-gray-600"
                            }`}
                         >
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                 isPaid 
                                 ? "border-green-500 bg-green-500/20 text-green-500" 
                                 : isSelected 
                                     ? "border-[#ea7c69] bg-[#ea7c69] text-white" 
                                     : "border-gray-500 group-hover:border-gray-400"
                             }`}>
                                 {isPaid ? <RiCheckLine size={16} /> : (isSelected && <RiCheckLine size={16} />)}
                             </div>
                             
                             <div className="w-14 h-14 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0 border border-white/5">
                                 {item.product?.image_url ? (
                                     <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">IMG</div>
                                 )}
                             </div>

                             <div className="flex-1 min-w-0">
                                 <p className={`font-medium text-sm truncate ${isPaid ? "text-gray-500 line-through" : "text-white"}`}>{title}</p>
                                 <p className="text-gray-400 text-xs">{item.quantity}x</p>
                             </div>

                             <div className="text-right">
                                <span className={`font-bold text-sm ${isPaid ? "text-gray-500" : "text-white"}`}>
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price)}
                                </span>
                                {isPaid && <span className="block text-[10px] text-green-500 font-bold uppercase">{t("paid")}</span>}
                             </div>
                         </div>
                     )
                 })}

                 {/* ADJUSTMENTS SECTION */}
                 {bill?.adjustments?.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-[#252836]">
                         <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">{t("adjustments")}</h3>
                         {bill.adjustments.map((adj, idx) => (
                             <div key={idx} className="flex justify-between items-center py-1 px-2 hover:bg-white/5 rounded">
                                 <span className="text-gray-300 text-sm">{adj.title}</span>
                                 <span className={`font-bold text-sm ${adj.type === 'charge' ? 'text-red-400' : 'text-green-400'}`}>
                                     {adj.type === 'charge' ? '+' : '-'}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(parseFloat(adj.amount))} ₺
                                 </span>
                             </div>
                         ))}
                     </div>
                 )}

                 <button 
                    onClick={() => setShowAdjModal(true)}
                    className="mt-4 w-full py-3 border-2 border-dashed border-[#ea7c69]/30 text-[#ea7c69] rounded-xl text-sm font-bold hover:bg-[#ea7c69]/10 transition-colors flex items-center justify-center gap-2"
                 >
                     <RiDiscountPercentLine size={18} /> {t("addAdjustment")}
                 </button>
            </div>

            {showScrollIndicator && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-10 animate-bounce opacity-70">
                    <button 
                         onClick={() => listRef.current?.scrollBy({ top: 100, behavior: 'smooth' })}
                         className="bg-[#ea7c69]/70 text-white rounded-full p-2 shadow-lg pointer-events-auto hover:bg-[#d96a56] transition-colors "
                    >
                        <RiArrowDownLine size={24}  />
                    </button>
                </div>
            )}

            <div className="p-6 bg-[#252836] border-t border-[#1F1D2B]">
                <div className="flex justify-between text-gray-400 text-sm mb-1">
                    <span>{t("paid")}</span>
                    <span className="text-green-500">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg">
                    <span>{t("remainingDue")}</span>
                    <span className="text-[#ea7c69]">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(remainingTotal)}</span>
                </div>
            </div>
        </div>
    );
};