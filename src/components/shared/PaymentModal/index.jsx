import { RiCloseLine } from "react-icons/ri";
import useMountTransition from "@/app/hooks/useMountTransition";
import usePaymentModal from "@/app/hooks/usePaymentModal";
import OrderSummary from './OrderSummary';
import PaymentControls from './PaymentControls';
import AdjustmentModal from './AdjustmentModal';

export default function PaymentModal({ isOpen, onClose, session, onCheckout, onRefetch }) {
  const isTransitioning = useMountTransition(isOpen, 300);
  const paymentState = usePaymentModal({
    isOpen, onClose, session, onCheckout, onRefetch
  });
  if (!isTransitioning && !isOpen) return null;
  const show = isOpen && isTransitioning;

  return (
    <div 
        onClick={onClose}
        className={`fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-sm md:p-4 transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#1F1D2B] w-full max-w-6xl h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row md:min-h-[500px] border-0 md:border border-[#252836] transition-all duration-300 transform ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-100 md:scale-95 opacity-0 translate-y-8'} relative`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button onClick={onClose} className="absolute right-3 md:top-6 md:right-6 text-gray-400 hover:text-white p-2 z-20 rounded-full hover:bg-white/10 transition-colors bg-[#252836]/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none" style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}>
            <RiCloseLine size={24} />
        </button>
        
        <OrderSummary paymentState={paymentState} session={session} />
        
        <PaymentControls paymentState={paymentState} />

        <AdjustmentModal 
            show={paymentState.showAdjModal} 
            onClose={() => paymentState.setShowAdjModal(false)}
            adjData={paymentState.adjData}
            setAdjData={paymentState.setAdjData}
            adjLoading={paymentState.adjLoading}
            handleAddAdjustment={paymentState.handleAddAdjustment}
            t={paymentState.t}
        />
      </div>
    </div>
  );
};