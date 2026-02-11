'use client'
import { useMemo } from 'react'
import { useRestaurantData } from '@/app/hooks/useRestaurantData'
import { useLanguage } from '@/context/LanguageContext'
import { RiCloseLine } from 'react-icons/ri'

export default function KitchenSummaryBar({ orders, isOpen, onClose }) {
    const { restaurant } = useRestaurantData()
    const { language } = useLanguage()
    
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

    if (summary.length === 0) {
        // Show empty sidebar placeholder if no orders
        return (
            <div className="w-20 md:w-24 bg-dark-800 border-r border-dark-700 h-screen flex flex-col items-center py-6 gap-4 shadow-xl shrink-0">
               <span className="text-xs font-black text-dark-700 -rotate-90 mt-10 whitespace-nowrap">
                    NO ORDERS
                </span>
            </div>
        )
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar / Drawer */}
            <div className={`
                fixed md:static inset-y-0 left-0 z-50
                w-24 md:w-28 bg-dark-800 border-r border-dark-700 h-screen 
                flex flex-col items-center py-6 gap-6 overflow-y-auto no-scrollbar shadow-xl shrink-0 
                transition-transform duration-300 transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <button 
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-400 hover:text-white bg-dark-700 rounded-full mb-2"
                >
                    <RiCloseLine size={20} />
                </button>

                <span className="text-[10px] font-black text-text-dim uppercase tracking-widest border-b border-dark-700 pb-2 mb-2 w-full text-center">
                    ALL DAY
                </span>
            
            {summary.map((item, idx) => (
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
            ))}
        </div>
        </>
    )
}
