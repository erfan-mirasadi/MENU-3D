'use client'
import { useMemo, useEffect } from 'react'
import { useRestaurantData } from '@/app/hooks/useRestaurantData'
import { useLanguage } from '@/context/LanguageContext'
import { RiCloseLine, RiLogoutBoxLine } from 'react-icons/ri';
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { unsubscribeFromPushNotifications } from "@/services/notificationService";
import toast from "react-hot-toast";

export default function KitchenSummaryBar({ orders, isOpen, onClose, isLoggingOut, setIsLoggingOut }) {
    const { restaurant } = useRestaurantData()
    const { language } = useLanguage()
    const router = useRouter()

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await unsubscribeFromPushNotifications();
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) {
                toast.error("Logout failed");
                setIsLoggingOut(false);
            } else {
                toast.success("Logged out successfully");
                router.push("/login?role=chef");
                // Do not set isLoggingOut to false here, let the page transition handle it
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during logout");
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        // Prevent body scroll only on mobile when the drawer is open
        if (isOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to re-enable scrolling if the component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    
    // 1. Aggregate Logic
    const summary = useMemo(() => {
        const counts = {}
        
        orders.forEach(order => {
            // Only count Active items (Pending or Preparing)
            // Served items should not be in the "Need to Cook" total
            if (['pending', 'confirmed', 'preparing'].includes(order.status)) {
                // Determine Title (Handlelocalized)
                const fallbackLang = restaurant?.default_language || 'en';
                const title = typeof order.products?.title === 'object'
                    ? (order.products.title?.[language] || order.products.title?.[fallbackLang] || "Unknown")
                    : order.products?.title
                
                if (!counts[title]) {
                    counts[title] = { count: 0, image_url: order.products?.image_url }
                }
                counts[title].count += order.quantity
            }
        })
        
        // Convert to array and sort by count (Highest first)
        return Object.entries(counts)
             .map(([name, data]) => ({ name, count: data.count, image_url: data.image_url }))
             .sort((a,b) => b.count - a.count)
             
    }, [orders])

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[110] md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar / Drawer */}
            <div className={`
                fixed md:static inset-y-0 left-0 z-[120]
                w-24 md:w-28 bg-dark-800 border-r border-dark-700 h-screen 
                flex flex-col items-center py-6 shadow-xl shrink-0 
                transition-transform duration-300 transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <button 
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-400 hover:text-white bg-dark-700 rounded-full mb-2 shrink-0"
                >
                    <RiCloseLine size={20} />
                </button>

                <span className="text-[10px] font-black text-text-dim uppercase tracking-widest border-b border-dark-700 pb-2 mb-2 w-full text-center shrink-0">
                    ALL DAY
                </span>
            
                {/* Scrollable Items Container */}
                <div className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center gap-6 py-2">
                    {summary.length === 0 ? (
                        <span className="text-xs font-black text-dark-700 -rotate-90 mt-10 whitespace-nowrap">
                            NO ORDERS
                        </span>
                    ) : (
                        summary.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 group relative px-2">
                                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-visible bg-dark-900 border-2 border-dark-700 group-hover:border-accent transition-all">
                                    {item.image_url ? (
                                        <img 
                                            src={item.image_url} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-dark-700 rounded-xl text-text-dim text-xs">
                                            IMG
                                        </div>
                                    )}
                                    
                                    {/* Count Badge (Outside) */}
                                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center text-sm font-black shadow-lg ring-4 ring-dark-800 z-10 scale-100 group-hover:scale-110 transition-transform">
                                        {item.count}
                                    </div>
                                </div>
                                
                                {/* Product Name */}
                                <span className="text-[10px] md:text-xs font-bold text-text-light text-center leading-tight line-clamp-2 max-w-full">
                                    {item.name}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Logout Button (Pinned to Bottom of Sidebar) */}
                <div className="mt-auto pt-4 w-full px-2 md:px-4 shrink-0 border-t border-dark-700/50">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all duration-300 shadow-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 group backdrop-blur-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Logout"
                    >
                        {isLoggingOut ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 group-hover:border-white"></div>
                        ) : (
                            <RiLogoutBoxLine size={20} className="group-hover:-translate-x-1 transition-transform" />
                        )}
                        <span className="text-[10px] md:text-xs font-bold">{isLoggingOut ? 'Leaving...' : 'Exit'}</span>
                    </button>
                </div>
            </div>
        </>
    )
}
