import { useEffect, useState } from "react";
import { reportService } from "@/services/reportService";
import Image from "next/image";
import { RiCloseLine, RiMoneyDollarCircleLine, RiFileList3Line, RiBankCardLine, RiUser3Line, RiTimeLine } from "react-icons/ri";
import { useMountTransition } from "@/app/hooks/useMountTransition";

const TransactionDetailsModal = ({ transaction, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cache the transaction so we can show it while animating out
  const [cachedTransaction, setCachedTransaction] = useState(transaction);
  
  useEffect(() => {
     if (transaction) setCachedTransaction(transaction);
  }, [transaction]);

  const activeTransaction = transaction || cachedTransaction;

  // Animation Hook
  const isOpen = !!transaction;
  const isTransitioning = useMountTransition(isOpen, 300);

  // Close on Escape key and manage body scroll
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    
    // Prevent background scrolling if open
    if (isOpen) document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose, isOpen]);

  // Fetch details
  useEffect(() => {
    if (!activeTransaction?.id) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await reportService.getTransactionDetails(activeTransaction.id);
        setDetails(data);
      } catch (err) {
        console.error("Failed to load transaction details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activeTransaction]); // Depend on activeTransaction to refresh if switching directly (unlikely) or just mounting

  if (!isTransitioning && !isOpen) return null;
  // If we have no data at all (shouldn't happen due to cache logic unless first render is null), return null
  if (!activeTransaction) return null;

  const show = isOpen && isTransitioning;

  return (
    <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
    >
      <div className={`bg-[#1F1D2B] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#393C49] flex flex-col overflow-hidden transition-all duration-300 transform ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#393C49] bg-[#252836]">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RiFileList3Line className="text-[#EA7C69]" />
              Transaction Details
            </h2>
            <span className="text-sm text-[#ABBBC2] mt-1">ID: {activeTransaction.id.slice(0, 8)}...</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#ABBBC2] hover:text-white hover:bg-[#393C49] rounded-full transition-colors"
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#393C49] scrollbar-track-transparent">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-[#ABBBC2]">
              <div className="w-8 h-8 border-2 border-[#EA7C69] border-t-transparent rounded-full animate-spin" />
              Loading details...
            </div>
          ) : !details ? (
             <div className="text-center text-red-400 py-10">Failed to load details.</div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-[#252836] p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-xs text-[#ABBBC2] flex items-center gap-1"><RiTimeLine /> Time</span>
                      <span className="text-white font-medium">{details.time}</span>
                  </div>
                  <div className="bg-[#252836] p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-xs text-[#ABBBC2] flex items-center gap-1"><RiUser3Line /> Staff</span>
                      <span className="text-white font-medium">{activeTransaction.staff}</span>
                  </div>
                  <div className="bg-[#252836] p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-xs text-[#ABBBC2] flex items-center gap-1">Table</span>
                      <span className="text-white font-medium">Table {activeTransaction.tableNo}</span>
                  </div>
                  <div className="bg-[#252836] p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-xs text-[#ABBBC2] flex items-center gap-1"><RiBankCardLine /> Method</span>
                      <span className="text-white font-medium capitalize">{details.method}</span>
                  </div>
                   <div className="bg-[#252836] p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-xs text-[#ABBBC2] flex items-center gap-1">Bill ID</span>
                      <span className="text-white font-medium text-xs truncate" title={activeTransaction.billId}>{activeTransaction.billId}</span>
                  </div>
                  <div className="bg-[#252836] p-3 rounded-lg flex flex-col gap-1 border border-[#EA7C69]/30">
                      <span className="text-xs text-[#ABBBC2] flex items-center gap-1"><RiMoneyDollarCircleLine /> Total Paid</span>
                      <span className="text-[#EA7C69] font-bold text-lg">₺{parseFloat(details.totalAmount).toLocaleString()}</span>
                  </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#393C49] pb-2 flex justify-between">
                      <span>Items in Session</span>
                      {Math.abs(details.totalAmount - details.billTotal) > 1 && (
                          <span className="text-[#EA7C69] text-xs lowercase opacity-80">(Partial Payment)</span>
                      )}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {details.items.length === 0 && <p className="text-[#ABBBC2] text-sm">No items found.</p>}
                    {details.items.map((item, i) => {
                        // Check if this item likely corresponds to an ID in paidItemIds?
                        // Problem: The `items` returned by `reportService` are aggregates or raw lines?
                        // `reportService` returns formatted items. It does NOT currently include the `id` of the order_item.
                        // I need to update `reportService` again to include `id` in the formatted items list to match with `paidItemIds`.
                        
                        // Let's assume I fix reportService in next step or this step.
                        // Actually, I should have included IDs in `formattedItems`.
                        
                        const isRelevant = details.paidItemIds.length > 0 
                            ? details.paidItemIds.includes(item.id) 
                            : true; // If no metadata, show all
                        
                        return (
                        <div key={i} className={`flex items-center gap-4 bg-[#252836]/50 p-2 rounded-lg transition-all ${
                              isRelevant ? "hover:bg-[#252836] border border-transparent" : "opacity-30 grayscale"
                            }`}>
                            {/* Product Image */}
                            <div className="w-12 h-12 relative rounded-md overflow-hidden bg-black/20 flex-shrink-0">
                                {item.image ? (
                                    <Image src={item.image} alt={item.title} fill sizes="50px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-[#ABBBC2]">No Img</div>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <h4 className={`font-medium text-sm ${isRelevant ? 'text-white' : 'text-gray-500'}`}>{item.title}</h4>
                                <p className="text-xs text-[#ABBBC2]">Qty: {item.quantity} x ₺{item.price}</p>
                            </div>

                            <div className={`font-bold text-sm ${isRelevant ? 'text-white' : 'text-gray-500'}`}>
                                ₺{(item.quantity * item.price).toLocaleString()}
                            </div>
                        </div>
                    )})}
                  </div>
              </div>

              {/* Session Note */}
              {details.sessionNote && (
                  <div className="bg-[#252836] p-4 rounded-xl border border-yellow-500/20">
                      <h3 className="text-sm font-bold text-[#EA7C69] uppercase tracking-wider mb-2 flex items-center gap-2">
                          <RiFileList3Line /> Session Note
                      </h3>
                      <p className="text-white text-sm italic">"{details.sessionNote}"</p>
                  </div>
              )}

              {/* Bill Adjustments */}
              {details.adjustments && details.adjustments.length > 0 && (
                  <div className="bg-[#252836] p-4 rounded-xl">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Bill Adjustments</h3>
                      <div className="flex flex-col gap-2">
                          {details.adjustments.map((adj, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm border-b border-[#393C49] pb-2 last:border-0 last:pb-0">
                                  <span className="text-[#ABBBC2]">{adj.title}</span>
                                  <span className={`font-medium ${adj.type === 'discount' ? 'text-green-400' : 'text-red-400'}`}>
                                      {adj.type === 'discount' ? '-' : '+'}₺{parseFloat(adj.amount).toLocaleString()}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Bill Summary */}
              <div className="bg-[#252836] p-4 rounded-xl flex flex-col gap-2">
                   <div className="flex justify-between text-sm">
                        <span className="text-[#ABBBC2]">Items Total</span>
                        <span className="text-white">₺{details.items.reduce((acc, item) => acc + (item.quantity * item.price), 0).toLocaleString()}</span>
                   </div>
                   
                   {/* Extra Charges Summary */}
                   {details.adjustments?.filter(a => a.type === 'charge').length > 0 && (
                       <div className="flex justify-between text-sm">
                            <span className="text-[#ABBBC2]">Extra Charges</span>
                            <span className="text-red-400">
                                +₺{details.adjustments.filter(a => a.type === 'charge').reduce((sum, a) => sum + parseFloat(a.amount), 0).toLocaleString()}
                            </span>
                       </div>
                   )}

                   {/* Discounts Summary */}
                   {details.adjustments?.filter(a => a.type === 'discount').length > 0 && (
                       <div className="flex justify-between text-sm">
                            <span className="text-[#ABBBC2]">Discounts</span>
                            <span className="text-green-400">
                                -₺{details.adjustments.filter(a => a.type === 'discount').reduce((sum, a) => sum + parseFloat(a.amount), 0).toLocaleString()}
                            </span>
                       </div>
                   )}

                   <div className="flex justify-between text-sm">
                        <span className="text-[#ABBBC2]">Bill Total</span>
                        <span className="text-white font-medium">₺{parseFloat(details.billTotal).toLocaleString()}</span>
                   </div>

                   <div className="h-[1px] bg-[#393C49] my-1" />
                   <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Paid (This Transaction)</span>
                        <span className="text-[#EA7C69]">₺{parseFloat(details.totalAmount).toLocaleString()}</span>
                   </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TransactionDetailsModal;
