import { 
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
    RiSubtractLine
} from "react-icons/ri";

export default function PaymentControls({ paymentState }) {
    const {
        t, activeTab, setActiveTab, splitMode, setSplitMode, 
        splitCount, setSplitCount, selectedItemIds, setSelectedItemIds, 
        paymentMethod, setPaymentMethod, mixedCash, setMixedCash, 
        mixedCard, setMixedCard, amountToPay, remainingTotal, 
        customAmount, setCustomAmount, handleConfirm, processing, 
        isFullyPaid, canSubmit
    } = paymentState;

    return (
        <div className="flex-1 flex flex-col bg-[#1F1D2B] relative overflow-y-auto min-h-0">
            
            {/* TABS */}
            <div className="flex gap-4 md:gap-8 px-4 md:px-8 pt-4 md:pt-8 border-b border-[#252836]">
                <button 
                    onClick={() => { setActiveTab("FULL"); setSplitMode("PEOPLE"); setSplitCount(1); setSelectedItemIds(new Set()); setPaymentMethod('CASH'); }}
                    className={`pb-3 md:pb-4 font-bold text-xs md:text-sm tracking-wide transition-all border-b-2 flex items-center gap-1.5 md:gap-2 ${activeTab === "FULL" ? "border-[#ea7c69] text-[#ea7c69]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                    <RiWallet3Line size={18} /> {t("fullPayment")}
                </button>
                <button 
                    onClick={() => { setActiveTab("SPLIT"); }}
                    className={`pb-3 md:pb-4 font-bold text-xs md:text-sm tracking-wide transition-all border-b-2 flex items-center gap-1.5 md:gap-2 ${activeTab === "SPLIT" ? "border-[#ea7c69] text-[#ea7c69]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                    <RiPieChartLine size={18} /> {t("splitPayment")}
                </button>
            </div>

            <div className="flex-1 p-4 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
                
                {activeTab === "SPLIT" && (
                    <div className="mb-3 md:mb-6 animate-in fade-in slide-in-from-top-4">
                        <label className="text-gray-400 text-xs font-bold uppercase mb-2 md:mb-3 block">{t("splitMode")}</label>
                        <div className="flex gap-2 md:gap-3 mb-3 md:mb-6">
                             <button onClick={() => setSplitMode("PEOPLE")} className={`flex-1 py-2 md:py-3 px-2 rounded-xl border font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${splitMode === "PEOPLE" ? "bg-[#ea7c69] text-white border-[#ea7c69] shadow-lg shadow-[#ea7c69]/20" : "bg-[#252836] border-[#393C49] text-gray-400 hover:bg-[#2D303E]"}`}>
                                 <RiUser3Line /> {t("byPeople")}
                             </button>
                             <button onClick={() => setSplitMode("ITEMS")} className={`flex-1 py-2 md:py-3 px-2 rounded-xl border font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${splitMode === "ITEMS" ? "bg-[#ea7c69] text-white border-[#ea7c69] shadow-lg shadow-[#ea7c69]/20" : "bg-[#252836] border-[#393C49] text-gray-400 hover:bg-[#2D303E]"}`}>
                                 <RiFileList3Line /> {t("byItems")}
                             </button>
                             <button onClick={() => setSplitMode("CUSTOM")} className={`flex-1 py-2 md:py-3 px-2 rounded-xl border font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${splitMode === "CUSTOM" ? "bg-[#ea7c69] text-white border-[#ea7c69] shadow-lg shadow-[#ea7c69]/20" : "bg-[#252836] border-[#393C49] text-gray-400 hover:bg-[#2D303E]"}`}>
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
                <div className="flex flex-col items-center justify-center mb-4 md:mb-8 p-3 md:p-6 bg-[#252836] rounded-2xl border border-[#2D303E] shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ea7c69] to-transparent opacity-50"></div>
                    <span className="text-gray-400 text-[10px] md:text-xs font-bold uppercase mb-1 md:mb-2 tracking-widest">{t("payNow")}</span>
                    <span className="text-3xl md:text-5xl font-bold text-white tracking-tight flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl text-gray-500">₺</span>
                        {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountToPay)}
                    </span>
                    {activeTab === "SPLIT" && splitMode === "PEOPLE" && splitCount > 1 && (
                        <span className="text-[#ea7c69] text-xs font-bold mt-2 bg-[#ea7c69]/10 px-3 py-1 rounded-full border border-[#ea7c69]/20">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(remainingTotal)} ÷ {splitCount} {t("people") || "people"}
                        </span>
                    )}
                </div>

                {/* PAYMENT METHOD SELECTION */}
                <label className="text-gray-400 text-xs font-bold uppercase mb-2 md:mb-3 block px-1">{t("selectPaymentMethod")}</label>
                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
                    <button onClick={() => setPaymentMethod("CASH")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === "CASH" ? "border-green-500 bg-green-500/10 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "border-[#393C49] text-gray-400 hover:border-gray-500 hover:bg-[#2D303E]"}`}>
                        <RiMoneyDollarBoxLine size={22} className={paymentMethod === "CASH" ? "text-green-400" : ""} /> 
                        <span className="text-xs font-bold tracking-wide">{t("cash")}</span>
                    </button>
                    <button onClick={() => setPaymentMethod("POS")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === "POS" ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-[#393C49] text-gray-400 hover:border-gray-500 hover:bg-[#2D303E]"}`}>
                        <RiBankCardLine size={22} className={paymentMethod === "POS" ? "text-blue-400" : ""} /> 
                        <span className="text-xs font-bold tracking-wide">{t("card")}</span>
                    </button>
                    <button onClick={() => setPaymentMethod("MIXED")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === "MIXED" ? "border-[#ea7c69] bg-[#ea7c69]/10 text-white shadow-[0_0_15px_rgba(234,124,105,0.2)]" : "border-[#393C49] text-gray-400 hover:border-gray-500 hover:bg-[#2D303E]"}`}>
                        <RiPieChartLine size={22} className={paymentMethod === "MIXED" ? "text-[#ea7c69]" : ""} /> 
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
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t("cardPortion")}</label>
                            <input type="number" value={mixedCard} onChange={e => setMixedCard(e.target.value)} className="w-full bg-[#1F1D2B] rounded-lg p-3 text-white font-bold border border-[#393C49] focus:border-blue-500 outline-none transition-colors" placeholder="0.00" />
                        </div>
                    </div>
                )}

            </div>

            {/* Confirm Button - sticky at bottom */}
            <div className="sticky bottom-0 p-4 pb-8 md:p-6 bg-[#1F1D2B] border-t border-[#252836] md:border-t-0 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}>
                <button
                    onClick={handleConfirm}
                    disabled={processing || amountToPay <= 0.01 || isFullyPaid}
                    className="w-full bg-[#EA7C69] hover:bg-[#d96a56] text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-[#EA7C69]/20 transition-all flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] cursor-pointer"
                >
                    {processing ? (
                        <>
                            <RiLoader4Line className="animate-spin" size={20} /> {t("processing") || "PROCESSING..."}
                        </>
                    ) : (
                        <>
                            <RiCheckLine size={20} /> {t("confirmPayment")}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};