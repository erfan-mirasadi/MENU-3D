import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const OrderReportTable = ({ orders, loading, filter }) => {
    // Add internal state for status filtering
    const { t, content } = useLanguage();
    const [statusFilter, setStatusFilter] = useState("All");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter displayed orders
    const displayedOrders = statusFilter === "All" 
        ? orders 
        : orders.filter(o => o.status?.toLowerCase() === statusFilter.toLowerCase());

    // Helper to format currency
    const formatCurrency = (amount) => {
        return `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺`;
    };

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "completed":
        case "served":
          return "bg-[#6BE2BE]/20 text-[#50D1AA]"; // Greenish
        case "preparing":
          return "bg-[#9290FE]/20 text-[#9290FE]"; // Purpleish
        case "pending":
          return "bg-[#FFB572]/20 text-[#FFB572]"; // Orangeish
        default:
          return "bg-gray-700 text-gray-300";
      }
    };
  
    return (
      <div className="bg-[#1F1D2B] rounded-lg p-6 w-full">
        <div className="flex justify-between items-center mb-6 relative">
            <h2 className="text-xl font-bold text-white">{t('analytics')}</h2>
             
             <div className="relative">
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 text-white border border-[#393C49] px-4 py-2 rounded-lg text-sm bg-[#1F1D2B] hover:bg-[#252836] cursor-pointer"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                    {statusFilter === "All" ? "Filter Order" : statusFilter}
                </button>

                {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#252836] border border-[#393C49] rounded-lg shadow-lg z-10 py-1">
                        {["All", "Pending", "Preparing", "Served", "Completed", "Cancelled"].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status);
                                    setShowFilterMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#1F1D2B] hover:text-white"
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}
             </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[#ABBBC2] text-sm border-b border-[#393C49]">
                <th className="py-4 font-semibold pl-4">{t('table')}</th>
                <th className="py-4 font-semibold">{t('menu') || "Menu"}</th>
                <th className="py-4 font-semibold">{t('total') || "Total"}</th>
                <th className="py-4 font-semibold">{t('status') || "Status"}</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300 font-medium text-sm">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#393C49] animate-pulse">
                        <td className="py-4 pl-4"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
                        <td className="py-4"><div className="h-4 bg-gray-700 rounded w-32"></div></td>
                        <td className="py-4"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
                        <td className="py-4"><div className="h-6 bg-gray-700 rounded w-20"></div></td>
                    </tr>
                ))
              ) : displayedOrders.length === 0 ? (
                  <tr>
                      <td colSpan="4" className="py-8 text-center text-[#ABBBC2]">
                          {orders.length === 0 ? "No orders found for this period." : "No orders match the filter."}
                      </td>
                  </tr>
              ) : (
                  <>
                    {(isExpanded ? displayedOrders : displayedOrders.slice(0, 6)).map((order) => (
                        <tr key={order.id} className="border-b border-[#393C49] hover:bg-[#252836]/50 transition-colors">
                        <td className="py-4 pl-4 text-[#E0E6E9] font-bold">
                            {order.tableNo}
                        </td>
                        <td className="py-4 text-[#E0E6E9]">{content(order.menu)}</td>
                        <td className="py-4 text-[#E0E6E9]">{formatCurrency(order.total)}</td>
                        <td className="py-4">
                            <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                order.status
                            )}`}
                            >
                            {order.status}
                            </span>
                        </td>
                        </tr>
                    ))}
                  </>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && displayedOrders.length > 8 && (
            <div className="mt-4 flex justify-center">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[#EA7C69] text-sm font-semibold hover:text-[#EA7C69]/80 transition-colors"
                >
                    {isExpanded ? "View Less" : "View All Orders"}
                </button>
            </div>
        )}
      </div>
    );
  };
  
  export default OrderReportTable;
