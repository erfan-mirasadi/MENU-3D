import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { getOrCreateBillLogic, addBillAdjustmentLogic } from "@/services/paymentService";
import { useRestaurantData } from "@/app/hooks/useRestaurantData";

export default function usePaymentModal({ isOpen, onClose, session, onCheckout, onRefetch }) {
  const { t, language } = useLanguage();
  const { restaurant } = useRestaurantData();
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
  // Derived Values
  const orderItems = useMemo(() => {
    return session?.order_items?.filter(item => 
      ['confirmed', 'preparing', 'ready', 'served'].includes(item.status)
    ) || [];
  }, [session]);

  const totalOrderAmount = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (item.quantity * Number(item.unit_price_at_order)), 0);
  }, [orderItems]);

  const bill = Array.isArray(session?.bills) ? session.bills[0] : session?.bill;
  
  const adjustmentsTotal = useMemo(() => {
      if (!bill?.adjustments) return 0;
      return bill.adjustments.reduce((acc, adj) => {
          const amount = parseFloat(adj.amount) || 0;
          return adj.type === 'charge' ? acc + amount : acc - amount;
      }, 0);
  }, [bill]);

  const paidAmount = bill ? Math.max(0, parseFloat(bill.paid_amount) || 0) : 0;
  const grandTotal = totalOrderAmount + adjustmentsTotal;
  const remainingTotal = Math.max(0, grandTotal - paidAmount);
  const isFullyPaid = bill && remainingTotal <= 0.5;

  const paidItemIds = useMemo(() => {
      const ids = new Set();
      if (bill?.transactions) {
          bill.transactions.forEach(tx => {
              if (Array.isArray(tx.paid_items)) {
                  tx.paid_items.forEach(pi => ids.add(pi.id));
              }
          });
      }
      return ids;
  }, [bill]);

  const itemsWithStatus = useMemo(() => {
      return orderItems.map(item => ({
          ...item,
          isPaid: paidItemIds.has(item.id)
      }));
  }, [orderItems, paidItemIds]);

  const groupedItems = useMemo(() => {
      return Object.values(itemsWithStatus.reduce((acc, item) => {
          const key = item.product?.id || item.product_id;
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

  useEffect(() => {
      if(isOpen) {
          console.log("[PaymentModal] Active. Session:", session?.id, "Bill:", bill?.id, "Remaining:", remainingTotal);
      }
  }, [isOpen]);

  useEffect(() => {
      if (isOpen) {
          setSplitCount(1);
          setSelectedItemIds(new Set());
          setSelectedAdjustmentIndices(new Set());
          setCustomAmount("");
          setPaymentMethod("CASH");
          setActiveTab("FULL");
      }
  }, [isOpen]);

  const amountToPay = useMemo(() => {
      if (isFullyPaid) return 0;
      if (activeTab === "FULL") return remainingTotal;

      if (splitMode === "PEOPLE") {
          if (splitCount <= 1) return remainingTotal;
          return remainingTotal / splitCount;
      }
      
      if (splitMode === "ITEMS") {
          let sum = 0;
          const unpaidItems = itemsWithStatus.filter(i => !i.isPaid);
          const selectedUnpaid = unpaidItems.filter(i => selectedItemIds.has(i.id));
          
          selectedUnpaid.forEach(item => {
              sum += (item.quantity * Number(item.unit_price_at_order));
          });
          
          const allUnpaidSelected = unpaidItems.length > 0 && selectedUnpaid.length === unpaidItems.length;
          
          if (allUnpaidSelected) {
              sum += adjustmentsTotal;
          } else {
              if (bill?.adjustments) {
                  bill.adjustments.forEach((adj, idx) => {
                      if (selectedAdjustmentIndices.has(idx)) {
                           const amount = parseFloat(adj.amount) || 0;
                           if (adj.type === 'charge') sum += amount;
                           else if (adj.type === 'discount') sum -= amount;
                      }
                  });
              }
          }

          if (sum > remainingTotal + 0.1) return remainingTotal; 
          return Math.max(0, sum);
      }

      if (splitMode === "CUSTOM") {
          const val = parseFloat(customAmount);
          if (isNaN(val)) return 0;
          return Math.min(val, remainingTotal);
      }
      return remainingTotal;
  }, [activeTab, splitMode, splitCount, selectedItemIds, customAmount, remainingTotal, itemsWithStatus, isFullyPaid, adjustmentsTotal, bill, selectedAdjustmentIndices]);

  useEffect(() => {
      if (selectedItemIds.size > 0 && activeTab === 'FULL') {
          setActiveTab("SPLIT");
          setSplitMode("ITEMS");
      } else if (selectedItemIds.size > 0 && splitMode !== 'ITEMS') {
          setSplitMode("ITEMS");
      }
  }, [selectedItemIds, activeTab, splitMode]);

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

  // Handlers
  const handleAddAdjustment = async () => {
    if (!adjData.title || !adjData.amount) {
        toast.error(t("fillAllFields"));
        return;
    }
    setAdjLoading(true);
    try {
        let targetBillId = bill?.id;

        if (!targetBillId) {
             const newBill = await getOrCreateBillLogic(session.id);
             if (!newBill || !newBill.id) {
                 throw new Error("Failed to generate bill record.");
             }
             targetBillId = newBill.id;
        }
        
        await addBillAdjustmentLogic(targetBillId, {
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

  const toggleItemSelection = (group) => {
      if (group.isPaid) return; 

      const next = new Set(selectedItemIds);
      const allSelected = group.ids.every(id => next.has(id));

      if (allSelected) {
          group.ids.forEach(id => next.delete(id));
      } else {
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

  const handleMixedCashChange = (val) => {
      setMixedCash(val);
      const c = parseFloat(val) || 0;
      if (c <= amountToPay) {
          setMixedCard(Math.max(0, amountToPay - c).toFixed(2));
      } else {
          setMixedCard("0.00");
      }
  };

  const handleMixedCardChange = (val) => {
      setMixedCard(val);
      const p = parseFloat(val) || 0;
      if (p <= amountToPay) {
          setMixedCash(Math.max(0, amountToPay - p).toFixed(2));
      } else {
          setMixedCash("0.00");
      }
  };
  
  const canSubmit = amountToPay > 0.01 && amountToPay <= remainingTotal + 0.1;
  const isOverPaying = amountToPay > remainingTotal + 0.5;

  const handleConfirm = async () => {
      if (!canSubmit) {
          toast.error(isOverPaying ? t("amountExceeds") : t("invalidAmount"));
          return;
      }
      setProcessing(true);
      try {
          let res;

          if (paymentMethod === "MIXED") {
               const c = parseFloat(mixedCash) || 0;
               const p = parseFloat(mixedCard) || 0;
               const totalMixed = c + p;
               if (Math.abs(totalMixed - amountToPay) > 0.009) {
                   toast.error(`Error: Total mixed payment (${totalMixed.toFixed(2)}) must exactly match the amount due (${amountToPay.toFixed(2)}).`);
                   setProcessing(false);
                   return;
               }
               const payments = [];
               if (c > 0) payments.push({ method: 'CASH', amount: c });
               if (p > 0) payments.push({ method: 'POS', amount: p });

               res = await onCheckout(session.id, "SPLIT", { payments });
          } else {
                let itemsToRecord = [];
                if (activeTab === 'FULL') {
                     itemsToRecord = itemsWithStatus.filter(i => !i.isPaid);
                } else if (splitMode === 'ITEMS') {
                     itemsToRecord = itemsWithStatus.filter(i => selectedItemIds.has(i.id));
                }
                
                res = await onCheckout(session.id, "SINGLE", { 
                    method: paymentMethod, 
                    amount: amountToPay,
                    items: itemsToRecord,
                    isFullPayment: activeTab === 'FULL'
                });
          }
          
          if (!res?.success) {
              toast.error(res?.error?.message || t("paymentFailed"));
              return;
          }

          console.log(`[PaymentModal] Payment Recorded. Session=${session.id}, Amount=${amountToPay}, Method=${paymentMethod}, FullyPaid=${res.fullyPaid}`);
          toast.success(t("paymentRecorded"));

          if (res.fullyPaid) {
              onClose();
          } else {
              setCustomAmount("");
              setMixedCash("");
              setMixedCard("");
              setSelectedItemIds(new Set());
              setSelectedAdjustmentIndices(new Set());
              setActiveTab("FULL");
              setPaymentMethod("CASH");
              // Removed redundant onRefetch() because onCheckout already refreshes data on success.
          }

      } catch (err) {
          console.error(err);
          toast.error(err.message || t("paymentFailed"));
      } finally {
          setProcessing(false);
      }
  };

  return {
    t, language, restaurant,
    // State
    activeTab, setActiveTab,
    processing,
    splitMode, setSplitMode,
    splitCount, setSplitCount,
    selectedItemIds, setSelectedItemIds,
    selectedAdjustmentIndices, setSelectedAdjustmentIndices,
    customAmount, setCustomAmount,
    paymentMethod, setPaymentMethod,
    mixedCash, setMixedCash: handleMixedCashChange,
    mixedCard, setMixedCard: handleMixedCardChange,
    showAdjModal, setShowAdjModal,
    adjData, setAdjData,
    adjLoading,
    
    // Derived
    orderItems,
    bill,
    paidAmount,
    remainingTotal,
    isFullyPaid,
    itemsWithStatus,
    groupedItems,
    amountToPay,
    
    // Handlers
    handleAddAdjustment,
    toggleItemSelection,
    toggleAdjustmentSelection,
    handleConfirm
  };
};
