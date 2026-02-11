import { useState, useMemo, useEffect, useRef } from "react";
import { 
    RiCloseLine, 
    RiBankCardLine, 
    RiMoneyDollarBoxLine, 
    RiCheckLine, 
    RiLoader4Line,
    RiPieChartLine,
    RiWallet3Line,
    RiCalculatorLine,
    RiUser3Line,
    RiFileList3Line,
    RiAddLine,
    RiSubtractLine,
    RiArrowDownLine,
    RiDiscountPercentLine
} from "react-icons/ri";
import toast from "react-hot-toast";
import { useMountTransition } from "@/app/hooks/useMountTransition";
import { useLanguage } from "@/context/LanguageContext";
import { cashierService } from "@/services/cashierService";
import { useRestaurantData } from "@/app/hooks/useRestaurantData";
import React from 'react';

const PaymentModal = ({ isOpen, onClose, session, onCheckout, onRefetch }) => {
  const { t, language } = useLanguage();
  const { restaurant } = useRestaurantData();
  /* ... (existing state) */
  const [activeTab, setActiveTab] = useState("FULL"); 
  const [processing, setProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState("PEOPLE");
  const [splitCount, setSplitCount] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [selectedAdjustmentIndices, setSelectedAdjustmentIndices] = useState(new Set());
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [mixedCash, setMixedCash] = useState("");
  const [mixedCard, setMixedCard] = useState("");

  // Adjustment State
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjData, setAdjData] = useState({ title: '', amount: '', type: 'charge' });
  const [adjLoading, setAdjLoading] = useState(false);

  const handleAddAdjustment = async () => {
    if (!adjData.title || !adjData.amount) {
        toast.error(t("fillAllFields"));
        return;
    }
    setAdjLoading(true);
    try {
        let targetBillId = bill?.id;

        if (!targetBillId) {
             // If no bill exists yet (e.g. first payment attempt), create it now.
             const newBill = await cashierService.getOrCreateBill(session.id);
             if (!newBill || !newBill.id) {
                 throw new Error("Failed to generate bill record.");
             }
             targetBillId = newBill.id;
        }
        
        await cashierService.addBillAdjustment(targetBillId, {
            ...adjData,
            amount: parseFloat(adjData.amount)
        });
        
        toast.success(t("adjAdded"));
        setShowAdjModal(false);
        setAdjData({ title: '', amount: '', type: 'charge' });
        
        if (onRefetch) await onRefetch();
    } catch (err) {
        console.error(err);
        toast.error(err.message);
    } finally {
        setAdjLoading(false);
    }
  };

  // Scroll Indicator State
  const listRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Animation Hook
  const isTransitioning = useMountTransition(isOpen, 300);

  /* ... (data logic remains same) */
  // ... (orderItems, totalOrderAmount definition) ...
  const orderItems = useMemo(() => {
    return session?.order_items?.filter(item => item.status !== 'cancelled') || [];
  }, [session]);

  const totalOrderAmount = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (item.quantity * Number(item.unit_price_at_order)), 0);
  }, [orderItems]);

  // Use bill data if available, otherwise assume full amount
  // NOTE: In a real scenario, we might need to fetch the fresh bill status. 
  // For now, we rely on what's passed or defaults.
  // UPDATE: useRestaurantData now fetches 'bills' as array.
  const bill = Array.isArray(session?.bills) ? session.bills[0] : session?.bill;
  
  // If bill exists, use remaining_amount. If not, use total.
  // We need to handle the case where bill is null (first payment).
  const remainingTotal = bill ? parseFloat(bill.remaining_amount) : totalOrderAmount;
  // If remaining is super small (float error), treat as paid
  const isFullyPaid = bill && parseFloat(bill.remaining_amount) <= 0.5;

  const paidAmount = Math.max(0, totalOrderAmount - remainingTotal);

  // Derive Item Status (Heuristic: Paid items are "first" in the list effectively)
  const itemsWithStatus = useMemo(() => {
      let runningPaid = paidAmount;
      return orderItems.map(item => {
          const itemTotal = item.quantity * Number(item.unit_price_at_order);
          // Allow for small float tolerance
          if (runningPaid >= itemTotal - 0.01) {
              runningPaid -= itemTotal;
              return { ...item, isPaid: true };
          }
          return { ...item, isPaid: false };
      });
  }, [orderItems, paidAmount]);

  // Grouping Logic for UI Display
  const groupedItems = useMemo(() => {
      return Object.values(itemsWithStatus.reduce((acc, item) => {
          const key = item.product?.id || item.product_id;
          
          // We group by Product AND isPaid status.
          const groupKey = `${key}-${item.isPaid}`;
          
          if (!acc[groupKey]) {
             acc[groupKey] = {
                 ...item,
                 quantity: 0,
                 ids: [],
                 originalItems: []
             }
          }

          acc[groupKey].quantity += item.quantity;
          acc[groupKey].ids.push(item.id);
          acc[groupKey].originalItems.push(item);
          return acc;
      }, {}));
  }, [itemsWithStatus]);

  // Scroll Check Function
  const checkScroll = () => {
      const el = listRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      // Show if content is taller than view AND we haven't scrolled to bottom (with buffer)
      const canScroll = scrollHeight > clientHeight;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10;
      setShowScrollIndicator(canScroll && !isAtBottom);
  };
  
  useEffect(() => {
      if(isOpen) {
          console.log("[PaymentModal] Opened. Session:", session?.id, "Bill:", bill?.id, "Remaining:", remainingTotal);
      }
  }, [isOpen, session, bill, remainingTotal]);

  useEffect(() => {
      if (isOpen) {
          // Reset and check after render
          setTimeout(checkScroll, 100);
      }
  }, [isOpen, itemsWithStatus]); // Check when items change or modal opens

  /* ... (init effect remains same) */
  useEffect(() => {
      if (isOpen) {
          setSplitCount(1);
          setSplitCount(1);
          setSelectedItemIds(new Set());
          setSelectedAdjustmentIndices(new Set());
          setCustomAmount("");
          setPaymentMethod("CASH");
          setActiveTab("FULL");
      }
  }, [isOpen]);

  // Calculate "Amount To Pay" based on Split Mode
  const amountToPay = useMemo(() => {
      // If Fully Paid, 0
      if (isFullyPaid) return 0;

      if (activeTab === "FULL") return remainingTotal;

      if (splitMode === "PEOPLE") {
          if (splitCount <= 1) return remainingTotal;
          // Simple division
          return remainingTotal / splitCount;
      }
      
      if (splitMode === "ITEMS") {
          let sum = 0;
          itemsWithStatus.forEach(item => {
              if (selectedItemIds.has(item.id) && !item.isPaid) {
                  sum += (item.quantity * Number(item.unit_price_at_order));
              }
          });
          
          // Add selected adjustments
          if (bill?.adjustments) {
              bill.adjustments.forEach((adj, idx) => {
                  if (selectedAdjustmentIndices.has(idx)) {
                       const amount = parseFloat(adj.amount) || 0;
                       if (adj.type === 'charge') sum += amount;
                       else if (adj.type === 'discount') sum -= amount;
                  }
              });
          }

          // Check if selecting all items matches roughly remaining
          if (sum > remainingTotal + 0.1) return remainingTotal; 
          return Math.max(0, sum); // Ensure no negative payment
      }

      if (splitMode === "CUSTOM") {
          const val = parseFloat(customAmount);
          if (isNaN(val)) return 0;
          return Math.min(val, remainingTotal);
      }
      return remainingTotal;
  }, [activeTab, splitMode, splitCount, selectedItemIds, customAmount, remainingTotal, itemsWithStatus, isFullyPaid]);

  // Auto-switch to ITEMS mode if items are selected
  useEffect(() => {
      if (selectedItemIds.size > 0 && activeTab === 'FULL') {
          setActiveTab("SPLIT");
          setSplitMode("ITEMS");
      } else if (selectedItemIds.size > 0 && splitMode !== 'ITEMS') {
          setSplitMode("ITEMS");
      }
  }, [selectedItemIds, activeTab, splitMode]);

  const toggleItemSelection = (group) => {
      if (group.isPaid) return; // Cannot toggle paid items

      const next = new Set(selectedItemIds);
      const allSelected = group.ids.every(id => next.has(id));

      if (allSelected) {
          // Deselect all in group
          group.ids.forEach(id => next.delete(id));
      } else {
          // Select all in group
          group.ids.forEach(id => next.add(id));
      }
      setSelectedItemIds(next);
  };

  const toggleAdjustmentSelection = (idx) => {
      const next = new Set(selectedAdjustmentIndices);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      setSelectedAdjustmentIndices(next);
  };

  // Mixed Payment Logic
  const fillMixedCard = () => {
      const c = parseFloat(mixedCash) || 0;
      setMixedCard(Math.max(0, amountToPay - c).toFixed(2));
  };
  
  // Validation
  const canSubmit = amountToPay > 0.01 && amountToPay <= remainingTotal + 0.1;
  const isOverPaying = amountToPay > remainingTotal + 0.5;

  const handleConfirm = async () => {
      if (!canSubmit) {
          toast.error(isOverPaying ? t("amountExceeds") : t("invalidAmount"));
          return;
      }
      setProcessing(true);
      try {
          if (paymentMethod === "MIXED") {
               // Validate Mixed
               const c = parseFloat(mixedCash) || 0;
               const p = parseFloat(mixedCard) || 0;
               if (Math.abs((c + p) - amountToPay) > 0.1) {
                   toast.error(t("mixedMismatch"));
                   setProcessing(false);
                   return;
               }
               const payments = [];
               if (c > 0) payments.push({ method: 'CASH', amount: c });
               if (p > 0) payments.push({ method: 'POS', amount: p });

               // We use 'SPLIT' type in backend for mixed/multi-method payments
               await onCheckout(session.id, "SPLIT", { payments });
          } else {
                let itemsToRecord = [];
                if (activeTab === 'FULL') {
                     itemsToRecord = itemsWithStatus.filter(i => !i.isPaid);
                } else if (splitMode === 'ITEMS') {
                     itemsToRecord = itemsWithStatus.filter(i => selectedItemIds.has(i.id));
                }
                
                await onCheckout(session.id, "SINGLE", { 
                    method: paymentMethod, 
                    amount: amountToPay,
                    items: itemsToRecord,
                    isFullPayment: activeTab === 'FULL'
                });
          }
          
          console.log(`[PaymentModal] Invoke Checkout. Session=${session.id}, Amount=${amountToPay}, Method=${paymentMethod}`);
          
          // Success
          toast.success(t("paymentRecorded"));
          // Optionally close modal or reset state if session not closed
          if (amountToPay >= remainingTotal - 0.1) {
              // Full payment done
              onClose();
          } else {
              // Partial payment done, maybe reset to allow next payment
              setCustomAmount("");
              setMixedCash("");
              setMixedCard("");
              setSelectedItemIds(new Set());
              setActiveTab("FULL"); 
              // We rely on parent to update 'session' prop to reflect new remaining amount
          }

      } catch (err) {
          console.error(err);
          toast.error(err.message || t("paymentFailed"));
      } finally {
          setProcessing(false);
      }
  };

  // Scroll Lock
  useEffect(() => {
      if (isOpen) {
          document.body.style.overflow = "hidden";
      } else {
          document.body.style.overflow = "";
      }
      return () => {
          document.body.style.overflow = "";
      };
  }, [isOpen]);

  if (!isTransitioning && !isOpen) return null;

  const show = isOpen && isTransitioning;

  return (
    <div 
        onClick={onClose}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#1F1D2B] w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px] border border-[#252836] transition-all duration-300 transform ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}
      >
        
        {/* LEFT: ORDER SUMMARY / ITEM SELECTOR */}
        <div className="w-full md:w-[450px] flex flex-col border-r border-[#252836] bg-[#1F1D2B] relative">
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
                 {groupedItems.map(item => { // Use groupedItems
                     // Visual Selection: if ALL IDs in group are selected? Or ANY?
                     // Let's say ALL for consistent UI behavior (toggle selects all).
                     const isSelected = item.ids.length > 0 && item.ids.every(id => selectedItemIds.has(id));
                     const isPaid = item.isPaid;
                     const price = item.quantity * Number(item.unit_price_at_order);
                     
                     // Dynamic Title Logic
                     const fallbackLang = restaurant?.default_language || 'en';
                     const title = typeof item.product?.title === 'object'
                        ? (item.product.title?.[language] || item.product.title?.[fallbackLang] || "Unknown Item")
                        : (item.product?.title || "Unknown Item");

                     return (
                         <div 
                            key={`${item.product?.id || item.product_id || 'unknown'}-${isPaid}`} // Stable key for group
                            onClick={() => toggleItemSelection(item)} // Pass group item
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                isPaid 
                                ? "bg-[#252836]/50 border-transparent opacity-50 cursor-not-allowed" 
                                : isSelected 
                                    ? "bg-[#ea7c69]/10 border-[#ea7c69]" 
                                    : "bg-[#252836] border-transparent hover:border-gray-600"
                            }`}
                         >
                             {/* Checkbox / Selection Indicator */}
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                 isPaid 
                                 ? "border-green-500 bg-green-500/20 text-green-500" 
                                 : isSelected 
                                     ? "border-[#ea7c69] bg-[#ea7c69] text-white" 
                                     : "border-gray-500 group-hover:border-gray-400"
                             }`}>
                                 {isPaid ? <RiCheckLine size={16} /> : (isSelected && <RiCheckLine size={16} />)}
                             </div>
                             
                             {/* Image */}
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

        {/* ADJUSTMENT MODAL OVERLAY */}
        {showAdjModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div onClick={e => e.stopPropagation()} className="bg-[#1F1D2B] w-full max-w-sm rounded-2xl border border-[#393C49] shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-[#252836] flex justify-between items-center bg-[#252836]/50">
                        <h3 className="text-white font-bold">{t("addAdjTitle")}</h3>
                        <button onClick={() => setShowAdjModal(false)} className="text-gray-400 hover:text-white"><RiCloseLine size={24}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        
                        {/* Type Switch */}
                        <div className="flex bg-[#252836] p-1 rounded-lg border border-[#393C49]">
                            <button 
                                onClick={() => setAdjData({...adjData, type: 'charge'})}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${adjData.type === 'charge' ? 'bg-red-500/20 text-red-500 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                + {t("extraCharge")}
                            </button>
                            <button 
                                onClick={() => setAdjData({...adjData, type: 'discount'})}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${adjData.type === 'discount' ? 'bg-green-500/20 text-green-500 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                - {t("discount")}
                            </button>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t("description")}</label>
                            <input 
                                type="text"
                                placeholder={adjData.type === 'charge' ? t("descPlaceholder") : t("descPlaceholder")}
                                value={adjData.title}
                                onChange={e => setAdjData({...adjData, title: e.target.value})}
                                property="off"
                                className="w-full bg-[#252836] border border-[#393C49] rounded-xl p-3 text-white focus:border-[#ea7c69] outline-none transition-colors"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t("amountLabel")} ({adjData.type === 'charge' ? t("extraCharge") : t("discount")})</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                                <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={adjData.amount}
                                    onChange={e => setAdjData({...adjData, amount: e.target.value})}
                                    className="w-full bg-[#252836] border border-[#393C49] rounded-xl p-3 pl-8 text-white font-bold text-lg focus:border-[#ea7c69] outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleAddAdjustment}
                            disabled={adjLoading}
                            className="w-full bg-[#ea7c69] hover:bg-[#d96a56] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#ea7c69]/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                        >
                            {adjLoading ? <RiLoader4Line className="animate-spin"/> : <RiCheckLine />}
                            {t("applyAdjustment")}
                        </button>
                    </div>
                </div>
            </div>
        )}
            
            {/* Scroll Indicator */}
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

        {/* RIGHT: PAYMENT CONTROLS */}
        <div className="flex-1 flex flex-col bg-[#1F1D2B] relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 z-10 rounded-full hover:bg-white/10 transition-colors">
                <RiCloseLine size={28} />
            </button>
            
            {/* TABS */}
            <div className="flex gap-8 px-8 pt-8 border-b border-[#252836]">
                <button 
                    onClick={() => { setActiveTab("FULL"); setSplitMode("PEOPLE"); setSplitCount(1); setSelectedItemIds(new Set()); setPaymentMethod('CASH'); }}
                    className={`pb-4 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${activeTab === "FULL" ? "border-[#ea7c69] text-[#ea7c69]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                    <RiWallet3Line size={18} /> {t("fullPayment")}
                </button>
                <button 
                    onClick={() => { setActiveTab("SPLIT"); }}
                    className={`pb-4 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${activeTab === "SPLIT" ? "border-[#ea7c69] text-[#ea7c69]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                    <RiPieChartLine size={18} /> {t("splitPayment")}
                </button>
            </div>

            <div className="flex-1 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                
                {activeTab === "SPLIT" && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                        <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">{t("splitMode")}</label>
                        <div className="flex gap-3 mb-6">
                             <button onClick={() => setSplitMode("PEOPLE")} className={`flex-1 py-3 px-2 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${splitMode === "PEOPLE" ? "bg-[#ea7c69] text-white border-[#ea7c69] shadow-lg shadow-[#ea7c69]/20" : "bg-[#252836] border-[#393C49] text-gray-400 hover:bg-[#2D303E]"}`}>
                                 <RiUser3Line /> {t("byPeople")}
                             </button>
                             <button onClick={() => setSplitMode("ITEMS")} className={`flex-1 py-3 px-2 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${splitMode === "ITEMS" ? "bg-[#ea7c69] text-white border-[#ea7c69] shadow-lg shadow-[#ea7c69]/20" : "bg-[#252836] border-[#393C49] text-gray-400 hover:bg-[#2D303E]"}`}>
                                 <RiFileList3Line /> {t("byItems")}
                             </button>
                             <button onClick={() => setSplitMode("CUSTOM")} className={`flex-1 py-3 px-2 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${splitMode === "CUSTOM" ? "bg-[#ea7c69] text-white border-[#ea7c69] shadow-lg shadow-[#ea7c69]/20" : "bg-[#252836] border-[#393C49] text-gray-400 hover:bg-[#2D303E]"}`}>
                                 <RiCalculatorLine /> {t("custom")}
                             </button>
                        </div>

                        {splitMode === "PEOPLE" && (
                            <div className="bg-[#252836] p-4 rounded-xl flex items-center justify-between border border-[#393C49]">
                                <span className="text-gray-300 font-medium">{t("splitCount")}</span>
                                <div className="flex items-center gap-4 bg-[#1F1D2B] rounded-lg p-1 border border-[#393C49]">
                                    <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded-md transition-colors shadow-sm"><RiSubtractLine /></button>
                                    <span className="text-white font-bold w-6 text-center text-lg">{splitCount}</span>
                                    <button onClick={() => setSplitCount(splitCount + 1)} className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded-md transition-colors shadow-sm"><RiAddLine /></button>
                                </div>
                            </div>
                        )}

                        {splitMode === "ITEMS" && (
                            <div className="text-center bg-[#252836] p-4 rounded-xl border border-[#393C49]">
                                <p className="text-gray-300 text-sm font-medium">{t("selectItemsHint")}</p>
                                <p className="text-[#ea7c69] text-xs mt-1 font-bold">{selectedItemIds.size} {t("itemsSelected")}</p>
                            </div>
                        )}

                        {splitMode === "CUSTOM" && (
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg group-focus-within:text-[#ea7c69] transition-colors">₺</span>
                                <input 
                                    type="number" 
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="w-full bg-[#252836] text-white border-2 border-[#393C49] rounded-xl py-4 pl-10 pr-4 font-bold outline-none focus:border-[#ea7c69] transition-all text-lg placeholder-gray-600"
                                    placeholder="Enter amount to pay..."
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* AMOUNT DISPLAY */}
                <div className="flex flex-col items-center justify-center mb-8 p-6 bg-[#252836] rounded-2xl border border-[#2D303E] shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ea7c69] to-transparent opacity-50"></div>
                    <span className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">{t("payNow")}</span>
                    <span className="text-5xl font-bold text-white tracking-tight flex items-baseline gap-1">
                        <span className="text-2xl text-gray-500">₺</span>
                        {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountToPay)}
                    </span>
                    {activeTab === "SPLIT" && splitMode === "PEOPLE" && splitCount > 1 && (
                        <span className="text-[#ea7c69] text-xs font-bold mt-2 bg-[#ea7c69]/10 px-3 py-1 rounded-full border border-[#ea7c69]/20">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(remainingTotal)} ÷ {splitCount} {t("people") || "people"}
                        </span>
                    )}
                </div>

                {/* PAYMENT METHOD SELECTION */}
                <label className="text-gray-400 text-xs font-bold uppercase mb-3 block px-1">{t("selectPaymentMethod")}</label>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button onClick={() => setPaymentMethod("CASH")} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === "CASH" ? "border-green-500 bg-green-500/10 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "border-[#393C49] text-gray-400 hover:border-gray-500 hover:bg-[#2D303E]"}`}>
                        <RiMoneyDollarBoxLine size={28} className={paymentMethod === "CASH" ? "text-green-400" : ""} /> 
                        <span className="text-xs font-bold tracking-wide">{t("cash")}</span>
                    </button>
                    <button onClick={() => setPaymentMethod("POS")} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === "POS" ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-[#393C49] text-gray-400 hover:border-gray-500 hover:bg-[#2D303E]"}`}>
                        <RiBankCardLine size={28} className={paymentMethod === "POS" ? "text-blue-400" : ""} /> 
                        <span className="text-xs font-bold tracking-wide">{t("card")}</span>
                    </button>
                    <button onClick={() => setPaymentMethod("MIXED")} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === "MIXED" ? "border-[#ea7c69] bg-[#ea7c69]/10 text-white shadow-[0_0_15px_rgba(234,124,105,0.2)]" : "border-[#393C49] text-gray-400 hover:border-gray-500 hover:bg-[#2D303E]"}`}>
                        <RiPieChartLine size={28} className={paymentMethod === "MIXED" ? "text-[#ea7c69]" : ""} /> 
                        <span className="text-xs font-bold tracking-wide">{t("mixed")}</span>
                    </button>
                </div>

                {/* MIXED INPUTS */}
                {paymentMethod === "MIXED" && (
                    <div className="grid grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-top-2 p-4 bg-[#252836] rounded-xl border border-[#393C49]">
                        <div className="relative">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t("cashPortion")}</label>
                            <input type="number" value={mixedCash} onChange={e => setMixedCash(e.target.value)} className="w-full bg-[#1F1D2B] rounded-lg p-3 text-white font-bold border border-[#393C49] focus:border-green-500 outline-none transition-colors" placeholder="0.00" />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex justify-between items-center"><span>{t("cardPortion")}</span> <span onClick={fillMixedCard} className="text-blue-500 cursor-pointer hover:text-blue-400 text-xs">{t("autofill")}</span></label>
                            <input type="number" value={mixedCard} onChange={e => setMixedCard(e.target.value)} className="w-full bg-[#1F1D2B] rounded-lg p-3 text-white font-bold border border-[#393C49] focus:border-blue-500 outline-none transition-colors" placeholder="0.00" />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleConfirm}
                    disabled={processing || amountToPay <= 0.01 || isFullyPaid}
                    className="w-full mt-auto bg-[#EA7C69] hover:bg-[#d96a56] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#EA7C69]/20 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] cursor-pointer"
                >
                    {processing ? (
                        <>
                            <RiLoader4Line className="animate-spin" size={24} /> {t("processing") || "PROCESSING..."}
                        </>
                    ) : (
                        <>
                            <RiCheckLine size={24} /> {t("confirmPayment")}
                        </>
                    )}
                </button>

            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
