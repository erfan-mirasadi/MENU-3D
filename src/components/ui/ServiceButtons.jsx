"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaConciergeBell, FaFileInvoiceDollar } from "react-icons/fa";
import { serviceRequestService } from "@/services/serviceRequestService";
import toast from "react-hot-toast";

import { useRestaurantFeatures } from "@/app/hooks/useRestaurantFeatures";
import { useLanguage } from "@/context/LanguageContext";

export default function ServiceButtons({ restaurantId, tableId, sessionId }) {
  const [loading, setLoading] = useState(null); // 'call_waiter' | 'bill' | null
  const [confirming, setConfirming] = useState(null); // 'call_waiter' | 'bill' | null
  
  const { isEnabled, loading: featuresLoading } = useRestaurantFeatures(); 
  const { t } = useLanguage();

  const handleClick = (type) => {
      if (confirming === type) {
          // Second click: CONFIRM
          handleRequest(type);
      } else {
          // First click: EXPAND
          setConfirming(type);
      }
  };

  const handleRequest = async (type) => {
    if (loading) return;
    setLoading(type);

    try {
      const { error } = await serviceRequestService.createRequest(
        restaurantId,
        tableId,
        sessionId,
        type
      );

      if (error) {
        toast.error(t('failedToSend'));
      } else {
        const msg = type === 'bill' ? t('billSent') : t('waiterSent');
        toast.success(msg);
        setConfirming(null); // Close after success
      }
    } catch (err) {
      console.error("Request failed", err);
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(null);
    }
  };

  // Ensure we only run on client (hydration safe)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of content: Don't show until mounted AND features are loaded
  if (!mounted || featuresLoading) return null;

  // Render nothing if neither feature is enabled
  const showWaiter = isEnabled("waiter");
  const showBill = isEnabled("cashier");
  
  if (!showWaiter && !showBill) return null;

  return (
    <>
        {/* Backdrop Overlay */}
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 z-[2147483646] ${confirming ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setConfirming(null)}
        />

        <div className={`relative flex flex-col gap-4 transition-all duration-500 z-[2147483647] ${confirming ? 'translate-x-4' : ''}`}>
        
        {/* Call Waiter Button */}
        {showWaiter && (
            <div className={`relative flex items-center transition-all duration-500 ${confirming === 'call_waiter' ? 'w-64' : 'w-12'}`}>
                <button
                    onClick={() => handleClick("call_waiter")}
                    disabled={loading === "call_waiter" || (confirming && confirming !== 'call_waiter')}
                    className={`
                        group relative flex items-center overflow-hidden
                        bg-white/10 backdrop-blur-md border border-white/20 shadow-xl 
                        transition-all duration-500 ease-out
                        ${confirming === 'call_waiter' ? 'w-full rounded-2xl bg-[#ea7c69] border-[#ea7c69] pl-3' : 'w-11 h-11 rounded-full justify-center hover:bg-white/20 active:scale-95'}
                        ${confirming && confirming !== 'call_waiter' ? 'opacity-0 scale-0 h-0 w-0 border-0 p-0 m-0 overflow-hidden' : ''}
                    `}
                    aria-label="Call Waiter"
                >
                    <div className={`flex items-center justify-center shrink-0 ${confirming === 'call_waiter' ? '' : 'w-11 h-11 '}`}>
                        <FaConciergeBell className={`text-white text-xl ${loading === 'call_waiter' ? 'animate-pulse' : 'group-hover:animate-wiggle'}`} />
                    </div>
                    
                    {/* Text Container */}
                    <div className={`
                        flex flex-col items-start justify-center whitespace-nowrap text-white transition-all duration-500 delay-100
                        ${confirming === 'call_waiter' ? 'opacity-100 translate-x-0 ml-3' : 'opacity-0 -translate-x-10 w-0'}
                    `}>
                        <span className="font-bold text-sm tracking-wide">{t('callWaiter')}</span>
                        <span className="text-[10px] opacity-80">{t('toConfirm')}</span>
                    </div>

                    {/* Confirmation Ripple / Effect (Optional) */}
                    {confirming === 'call_waiter' && (
                         <div className="absolute right-3 animate-pulse">
                             <div className="w-2 h-2 bg-white rounded-full"></div>
                         </div>
                    )}
                </button>
            </div>
        )}

        {/* Request Bill Button */}
        {showBill && (
             <div className={`relative flex items-center transition-all duration-500 ${confirming === 'bill' ? 'w-64' : 'w-12'}`}>
                <button
                    onClick={() => handleClick("bill")}
                    disabled={loading === "bill" || (confirming && confirming !== 'bill')}
                    className={`
                        group relative flex items-center overflow-hidden
                        bg-white/10 backdrop-blur-md border border-white/20 shadow-xl 
                        transition-all duration-500 ease-out
                        ${confirming === 'bill' ? 'w-full rounded-2xl bg-blue-600 border-blue-500 pl-3' : 'w-11 h-11 rounded-full justify-center hover:bg-white/20 active:scale-95'}
                        ${confirming && confirming !== 'bill' ? 'opacity-0 scale-0 h-0 w-0 border-0 p-0 m-0 overflow-hidden' : ''}
                    `}
                    aria-label="Request Bill"
                >
                    <div className={`flex items-center justify-center shrink-0 ${confirming === 'bill' ? '' : 'w-11 h-11'}`}>
                         <FaFileInvoiceDollar className={`text-white text-xl ${loading === 'bill' ? 'animate-pulse' : ''}`} />
                    </div>
                    
                    {/* Text Container */}
                    <div className={`
                        flex flex-col items-start justify-center whitespace-nowrap text-white transition-all duration-500 delay-100
                        ${confirming === 'bill' ? 'opacity-100 translate-x-0 ml-3' : 'opacity-0 -translate-x-10 w-0'}
                    `}>
                        <span className="font-bold text-sm tracking-wide">{t('requestBill')}</span>
                         <span className="text-[10px] opacity-80">{t('toConfirm')}</span>
                    </div>
                     
                     {/* Confirmation Ripple / Effect */}
                    {confirming === 'bill' && (
                         <div className="absolute right-3 animate-pulse">
                             <div className="w-2 h-2 bg-white rounded-full"></div>
                         </div>
                    )}
                </button>
            </div>
        )}
        </div>
    </>
  );
}
