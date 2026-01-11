import React, { useState } from "react";
import { RiCloseLine, RiAlertFill } from "react-icons/ri";

const REASONS = [
  "Customer Complaint",
  "Waiter Error",
  "Out of Stock",
  "Spilled / Wasted",
  "Other"
];

const VoidReasonModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setProcessing(true);
    const finalReason = reason === "Other" ? customReason : reason;
    if (!finalReason.trim()) {
        alert("Please provide a reason.");
        setProcessing(false);
        return;
    }
    await onConfirm(finalReason);
    setProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1F1D2B] w-full max-w-md rounded-2xl p-6 border border-[#252836] shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3 text-red-500">
                <RiAlertFill size={24} />
                <h2 className="text-xl font-bold text-white">Void Confirmed Item</h2>
            </div>
            <button onClick={onClose} className="text-[#ABBBC2] hover:text-white">
                <RiCloseLine size={24} />
            </button>
        </div>

        <div className="mb-6 p-4 bg-[#252836] rounded-xl flex items-center gap-3">
             {item?.product?.image_url && (
                 <img src={item.product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-black" />
             )}
             <div>
                 <p className="text-white font-bold">{item?.product?.title?.en || "Unknown Item"}</p>
                 <p className="text-[#ABBBC2] text-sm">{item?.quantity} x ₺{item?.unit_price_at_order}</p>
             </div>
        </div>

        <div className="space-y-4 mb-8">
            <label className="block text-white font-medium">Why are you canceling this?</label>
            <div className="grid grid-cols-1 gap-2">
                {REASONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setReason(r)}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                            reason === r 
                            ? "border-red-500 bg-red-500/10 text-white" 
                            : "border-[#393C49] text-[#ABBBC2] hover:border-gray-500"
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {reason === "Other" && (
                <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter specific reason..."
                    className="w-full bg-[#252836] border border-[#393C49] rounded-lg p-3 text-white focus:border-red-500 focus:outline-none h-24"
                />
            )}
        </div>

        <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3 bg-[#252836] text-white font-bold rounded-xl hover:bg-[#2d303e]"
            >
                Cancel
            </button>
            <button 
                onClick={handleConfirm}
                disabled={processing}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50"
            >
                {processing ? "Processing..." : "Confirm Void"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default VoidReasonModal;
