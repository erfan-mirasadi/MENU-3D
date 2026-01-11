  import React, { useState, useMemo } from "react";
import { RiCloseLine, RiBankCardLine, RiMoneyDollarBoxLine, RiCheckLine, RiLoader4Line } from "react-icons/ri";

const PaymentModal = ({ isOpen, onClose, session, onCheckout }) => {
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // 'CASH' | 'POS'
  const [cashReceived, setCashReceived] = useState("");
  const [processing, setProcessing] = useState(false);

  // Derive Order Details
  const orderItems = useMemo(() => {
    return session?.order_items?.filter(item => item.status !== 'cancelled') || [];
  }, [session]);

  const totalAmount = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (item.quantity * parseFloat(item.unit_price_at_order)), 0);
  }, [orderItems]);

  const formattedTotal = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount);

  // Change Calculation
  const changeAmount = useMemo(() => {
      if (paymentMethod !== 'CASH' || !cashReceived) return 0;
      const received = parseFloat(cashReceived);
      if (isNaN(received)) return 0;
      return Math.max(0, received - totalAmount);
  }, [paymentMethod, cashReceived, totalAmount]);

  const handleConfirm = async () => {
      setProcessing(true);
      try {
          // Amount for service is implied total, but we can pass received if needed. 
          // For POS assume exact match.
          // Check if cash is sufficient
          if (paymentMethod === 'CASH' && (parseFloat(cashReceived) || 0) < totalAmount) {
              alert("Insufficient Amount Received"); // Simple alert for now, toast in parent is better
              setProcessing(false);
              return;
          }

          await onCheckout(session.id, paymentMethod, totalAmount);
          // Don't close here, parent handles success flow or we close after promise
      } catch (err) {
          console.error("Payment failed", err);
      } finally {
          setProcessing(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1F1D2B] w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px] border border-[#252836]">
        
        {/* LEFT SIDE: Order Summary */}
        <div className="flex-1 p-6 flex flex-col border-r border-[#252836]">
          <div className="flex justify-between items-center mb-6">
             <div>
                <h2 className="text-xl font-bold text-white">Order Summary</h2>
                <p className="text-[#ABBBC2] text-sm mt-1">Table #{session?.table?.table_number || "?"}</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             {orderItems.length === 0 ? (
                 <p className="text-[#ABBBC2] text-center italic mt-10">No items in this order.</p>
             ) : (
                <div className="flex flex-col gap-4">
                    {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-[#252836] p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden">
                                     {item.product?.image_url && (
                                         <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                                     )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium line-clamp-1">{item.product?.title?.en || "Unknown"}</span>
                                    <span className="text-[#ABBBC2] text-xs">x{item.quantity}</span>
                                </div>
                            </div>
                            <span className="text-white font-semibold">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.quantity * parseFloat(item.unit_price_at_order))}
                            </span>
                        </div>
                    ))}
                </div>
             )}
          </div>

          <div className="mt-6 pt-6 border-t border-[#252836] flex flex-col gap-2">
             <div className="flex justify-between text-[#ABBBC2] text-sm">
                 <span>Subtotal</span>
                 <span>{formattedTotal}</span>
             </div>
             <div className="flex justify-between text-[#ABBBC2] text-sm">
                 <span>Tax</span>
                 <span>₺0.00</span>
             </div>
             <div className="flex justify-between text-white text-xl font-bold mt-2">
                 <span>Total</span>
                 <span>{formattedTotal}</span>
             </div>
          </div>
        </div>

        {/* RIGHT SIDE: Payment Actions */}
        <div className="w-full md:w-[400px] bg-[#252836] p-6 flex flex-col justify-between relative">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-[#ABBBC2] hover:text-white transition-colors p-2"
            >
                <RiCloseLine size={24} />
            </button>

            <div>
                <h2 className="text-xl font-bold text-white mb-8">Payment</h2>
                
                <h3 className="text-white font-medium mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setPaymentMethod("CASH")}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "CASH" 
                            ? "border-[#EA7C69] bg-[#EA7C69]/10 text-white" 
                            : "border-[#393C49] text-[#ABBBC2] hover:border-gray-500"
                        }`}
                    >
                        <RiMoneyDollarBoxLine size={32} />
                        <span className="font-medium">Cash</span>
                        {paymentMethod === "CASH" && <div className="absolute top-2 right-2 text-[#EA7C69]"><RiCheckLine /></div>}
                    </button>
                    <button
                        onClick={() => setPaymentMethod("POS")}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "POS" 
                            ? "border-[#EA7C69] bg-[#EA7C69]/10 text-white" 
                            : "border-[#393C49] text-[#ABBBC2] hover:border-gray-500"
                        }`}
                    >
                        <RiBankCardLine size={32} />
                        <span className="font-medium">Card</span>
                        {paymentMethod === "POS" && <div className="absolute top-2 right-2 text-[#EA7C69]"><RiCheckLine /></div>}
                    </button>
                </div>

                {paymentMethod === "CASH" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[#ABBBC2] text-sm mb-2 block">Amount Received</label>
                        <div className="relative mb-4">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">₺</span>
                            <input 
                                type="number" 
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                className="w-full bg-[#1F1D2B] text-white border border-[#393C49] rounded-lg py-3 pl-8 pr-4 focus:outline-none focus:border-[#EA7C69]transition-colors font-bold text-lg placeholder-gray-600"
                                placeholder="0.00"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#1F1D2B] p-4 rounded-lg">
                            <span className="text-[#ABBBC2]">Change</span>
                            <span className="text-[#EA7C69] font-bold text-xl">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(changeAmount)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleConfirm}
                disabled={processing}
                className="w-full bg-[#EA7C69] text-white font-bold py-4 rounded-xl hover:bg-[#d96a56] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8 shadow-lg shadow-[#EA7C69]/20"
            >
                {processing ? (
                    <>
                        <RiLoader4Line className="animate-spin" size={24} />
                        Processing...
                    </>
                ) : (
                    "Confirm Payment"
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
