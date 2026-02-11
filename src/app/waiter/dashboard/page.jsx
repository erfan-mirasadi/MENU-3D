"use client";

import { useRestaurantData } from "@/app/hooks/useRestaurantData";
import { useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import { RiLogoutBoxRLine } from "react-icons/ri"; // Added icon
import { useRouter } from "next/navigation"; // Added router
import { supabase } from "@/lib/supabase"; // Added supabase
import OrderDrawer from "@/components/shared/OrderDrawer";
import OfflineAlert from "@/components/shared/OfflineAlert";
import TableGrid from "@/components/shared/TableView/TableGrid";
import { useRestaurantFeatures } from "@/app/hooks/useRestaurantFeatures";

import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { moveSession, mergeSessions } from "@/services/waiterService";
import { serviceRequestService } from "@/services/serviceRequestService";
import toast from "react-hot-toast";

export default function WaiterDashboard() {
  const { tables, sessions, loading, handleCheckout, isConnected, refetch } = useRestaurantData();
  const { t } = useLanguage();
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const router = useRouter(); // Added router

  const handleLogout = async () => {
    if (confirm(t('logoutConfirm'))) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  // State
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [resolvingTableId, setResolvingTableId] = useState(null); // Loading state for requests

  // Transfer State
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [sourceTableForTransfer, setSourceTableForTransfer] = useState(null);
  const [sortingMode, setSortingMode] = useState('priority'); // 'priority' | 'numeric'

  // Stats Counters
  const pendingCount = sessions.filter((s) =>
    s.order_items?.some((i) => i.status === "pending")
  ).length;
  const alertCount = sessions.filter((s) =>
    s.service_requests?.some((r) => r.status === "pending")
  ).length;
  const activeCount = sessions.length;

  // --- Handlers ---
  
  const handleEnterTransferMode = () => {
     if (!selectedTable) return;
     // Close drawer first
     setIsDrawerOpen(false);
     // Enable mode
     setIsTransferMode(true);
     setSourceTableForTransfer(selectedTable);
     // Clear selection temporarily
     setSelectedTable(null);
     setSelectedSession(null);
     toast(t('selectTargetTable'), { icon: "🔄" });
  };

  const handleCancelTransfer = () => {
     setIsTransferMode(false);
     setSourceTableForTransfer(null);
     toast(t('transferCancelled'));
  };

  const handleTransferAction = async (targetTable) => {
     if (!sourceTableForTransfer || loadingTransfer) return;
     
     // 1. Get Source Session
     const sourceSession = sessions.find(s => s.table_id === sourceTableForTransfer.id);
     if (!sourceSession) {
         toast.error(t('sourceNoSession'));
         handleCancelTransfer();
         return;
     }

     // 2. Determine Action (Move vs Merge)
     const targetSession = sessions.find(s => s.table_id === targetTable.id);
     const isMerge = !!targetSession;

     if (isMerge) {
         if(!confirm(`Merge Table ${sourceTableForTransfer.table_number} into Table ${targetTable.table_number}?`)) return;
         
         try {
             setLoadingTransfer(true);
             await mergeSessions(sourceSession.id, targetSession.id);
             toast.success(t('mergeSuccess'));
         } catch(err) {
             console.error(err);
             toast.error(t('mergeFailed'));
         }
     } else {
         if(!confirm(`Move Table ${sourceTableForTransfer.table_number} to Table ${targetTable.table_number}?`)) return;

         try {
             setLoadingTransfer(true);
             await moveSession(sourceSession.id, targetTable.id);
             toast.success(t('moveSuccess'));
         } catch(err) {
             console.error(err);
             toast.error(t('moveFailed'));
         }
     }

     setLoadingTransfer(false);
     handleCancelTransfer();
  };


  const handleTableClick = async (table, session) => {
    // INTERCEPT IF IN TRANSFER MODE
    if (isTransferMode) {
        if (table.id === sourceTableForTransfer?.id) {
             toast.error(t('cannotTransferSelf'));
             return;
        }
        handleTransferAction(table);
        return;
    }

    // Check for pending requests and resolve them
    if (session?.service_requests) {
        const pendingRequests = session.service_requests.filter(r => r.status === 'pending');
        if (pendingRequests.length > 0) {
            // Set Loading State
            setResolvingTableId(table.id);
            
            try {
                // Resolve all sequentially (Directly to 'resolved')
                await Promise.all(pendingRequests.map(req => serviceRequestService.resolveRequest(req.id)));
                
                toast.success(t('requestCleared'));
                
                // FORCE REFRESH to update UI immediately
                refetch(); 
            } catch (err) {
                console.error("Failed to resolve requests", err);
            } finally {
                // Clear Loading State
                setResolvingTableId(null);
            }
            
            // CRITICAL: Return early so we DO NOT open the drawer
            return;
        }
    }

    // Only open drawer if there were NO pending requests
    setSelectedTable(table);
    setSelectedSession(session);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedTable(null);
      setSelectedSession(null);
    }, 300);
  };

  // Live Update logic
  const activeDrawerSession =
    isDrawerOpen && selectedTable
      ? sessions.find((s) => s.table_id === selectedTable.id)
      : selectedSession;

  const { isEnabled } = useRestaurantFeatures();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1F1D2B]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#ea7c69] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-mono text-sm">{t('loadingFloor')}</p>
        </div>
      </div>
    );
  }

  if (!isEnabled("waiter")) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1F1D2B] text-white">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-500">{t('waiterDisabled')}</h1>
          <p className="text-gray-400">{t('moduleOff')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative">
      {/* TRANSFER MODE BANNER */}
      {isTransferMode && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#ea7c69] text-white p-4 shadow-2xl animate-in slide-in-from-bottom flex justify-between items-center">
              <div>
                  <p className="font-bold text-lg">{t('transferring')} {sourceTableForTransfer?.table_number}</p>
                  <p className="text-white/80 text-sm">{t('selectTargetTable')}</p>
              </div>
              <button 
                onClick={handleCancelTransfer}
                className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-bold transition-colors"
              >
                {t('cancel')}
              </button>
          </div>
      )}

      {/* --- MODERN HEADER (Responsive) --- */}
      <div className="sticky top-0 z-20 bg-[#1F1D2B]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div className="px-4 py-3 md:py-4">
          
          {/* Top Row: Info + Global Actions */}
          <div className="flex justify-between items-start md:items-center mb-3 md:mb-4 gap-3">
            
            {/* Left: Branding/Stats */}
            <div className="flex-1 overflow-hidden">
               {/* Mobile: Just the stats/logo, no "Tables" text */}
               <div className="flex items-center gap-2">
                   <div className="w-2 h-8 bg-[#ea7c69] rounded-full flex-shrink-0"></div>
                   <div>
                       <h1 className="md:hidden text-base font-bold text-white leading-tight">{t('floorOverview')}</h1>
                       <p className="text-xs text-gray-400 font-medium">
                        {tables.length} {t('activeTables')}
                       </p>
                   </div>
               </div>
               
               {/* Desktop: Full Title (Hidden on Mobile) */}
               <div className="hidden md:block mt-1">
                  {/* (Already covered by the simplified mobile view above which works for desktop too, but keeping separate if needed for styling) 
                      Actually, let's unify. The above structure is clean for both.
                  */}
               </div>
            </div>

            {/* Right: Actions (Sort, Status, Lang, Logout) */}
            <div className="flex flex-col items-end gap-2">
                 
                 <div className="flex items-center gap-2">
                     {/* SORT BUTTON (Moved Here) */}
                     <button 
                        onClick={() => setSortingMode(prev => prev === 'priority' ? 'numeric' : 'priority')}
                        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${
                            sortingMode === 'priority' 
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                     >
                        <FaLayerGroup />
                        {sortingMode === 'priority' ? t('smartSort') : t('numericSort')}
                     </button>
                    
                     {/* Live Status */}
                     <div className="flex items-center gap-2 bg-black/20 px-2 py-1.5 rounded-lg border border-white/5">
                          <div className="relative flex h-2 w-2">
                              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          </div>
                     </div>

                     <LanguageSwitcher />

                     {/* Logout */}
                     <button 
                        onClick={handleLogout}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded-lg transition-colors border border-red-500/20"
                        title={t('logout')}
                     >
                        <RiLogoutBoxRLine size={18} />
                     </button>
                 </div>
                 
                 {/* Mobile Only Sort Button (If screen is too small for top row) */}
                 <button 
                    onClick={() => setSortingMode(prev => prev === 'priority' ? 'numeric' : 'priority')}
                    className={`sm:hidden flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase w-full justify-center border ${
                        sortingMode === 'priority' 
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                 >
                    <FaLayerGroup />
                    {sortingMode === 'priority' ? t('smartSort') : t('numericSort')}
                 </button>

            </div>
          </div>

          {/* --- STATUS BAR (Pure Filters) --- */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1">
                {/* ALERT PILL */}
                {alertCount > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-xl shadow-lg shadow-red-900/50 animate-bounce">
                    <span className="font-bold text-sm">{alertCount}</span>
                    <span className="text-[10px] font-bold uppercase md:text-xs">{t('requests')}</span>
                  </div>
                )}

                {/* PENDING PILL */}
                <div
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    pendingCount > 0
                      ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/50"
                      : "bg-[#252836] border-white/5 text-gray-400"
                  }`}
                >
                  <span className="font-bold text-sm">{pendingCount}</span>
                  <span className="text-[10px] font-bold uppercase md:text-xs">{t('toConfirm')}</span>
                </div>

                {/* ACTIVE PILL */}
                <div className="flex-shrink-0 flex items-center gap-2 bg-[#252836] border border-white/5 text-blue-200 px-3 py-2 rounded-xl">
                  <span className="font-bold text-sm">{activeCount}</span>
                  <span className="text-[10px] font-bold uppercase md:text-xs">{t('occupied')}</span>
                </div>
             </div>
          </div>
      </div>

      {/* --- TABLE GRID --- */}
      <div className="p-4">
          <TableGrid 
              tables={tables}
              sessions={sessions}
              onTableClick={handleTableClick}
              isTransferMode={isTransferMode}
              sourceTableId={sourceTableForTransfer?.id}
              loadingTransfer={loadingTransfer}
              role="waiter"
              sortingMode={sortingMode}
              resolvingTableId={resolvingTableId}
          />
      </div>

      {/* --- OFFLINE ALERT --- */}
      <OfflineAlert isConnected={isConnected} />

      {/* --- DRAWER --- */}
      <OrderDrawer
        key={selectedTable?.id}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        table={selectedTable}
        session={activeDrawerSession}
        role="waiter"
        onCheckout={handleCheckout}
        onTransfer={handleEnterTransferMode}
        onRefetch={refetch}
      />
    </div>
  );
}

