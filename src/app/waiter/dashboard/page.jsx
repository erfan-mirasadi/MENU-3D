"use client";

import { useRestaurantData } from "@/app/hooks/useRestaurantData";
import { useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import OrderDrawer from "@/components/shared/OrderDrawer";
import OfflineAlert from "@/components/shared/OfflineAlert";
import TableCard from "../_components/TableCard";
import FeatureGuard from "@/components/shared/FeatureGuard";

export default function WaiterDashboard() {
  const { tables, sessions, loading, handleCheckout, isConnected } = useRestaurantData();
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  // State
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Transfer State
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [sourceTableForTransfer, setSourceTableForTransfer] = useState(null);

  // Import Service Actions (Dynamically to avoid cycles if any)
  const { moveSession, mergeSessions } = require("@/services/waiterService");
  const toast = require("react-hot-toast").default;

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
     toast("Select a target table to transfer/merge", { icon: "🔄" });
  };

  const handleCancelTransfer = () => {
     setIsTransferMode(false);
     setSourceTableForTransfer(null);
     toast("Transfer cancelled");
  };

  const handleTransferAction = async (targetTable) => {
     if (!sourceTableForTransfer || loadingTransfer) return;
     
     // 1. Get Source Session
     const sourceSession = sessions.find(s => s.table_id === sourceTableForTransfer.id);
     if (!sourceSession) {
         toast.error("Source table has no active session!");
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
             toast.success("Tables merged successfully!");
         } catch(err) {
             console.error(err);
             toast.error("Merge failed");
         }
     } else {
         if(!confirm(`Move Table ${sourceTableForTransfer.table_number} to Table ${targetTable.table_number}?`)) return;

         try {
             setLoadingTransfer(true);
             await moveSession(sourceSession.id, targetTable.id);
             toast.success("Table moved successfully!");
         } catch(err) {
             console.error(err);
             toast.error("Move failed");
         }
     }

     setLoadingTransfer(false);
     handleCancelTransfer();
  };


  const handleTableClick = (table, session) => {
    // INTERCEPT IF IN TRANSFER MODE
    if (isTransferMode) {
        if (table.id === sourceTableForTransfer?.id) {
             toast.error("Cannot transfer to self!");
             return;
        }
        handleTransferAction(table);
        return;
    }

    // Normal Open Drawer
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1F1D2B]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#ea7c69] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-mono text-sm">LOADING FLOOR...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="waiter" fallback={
        <div className="flex h-screen items-center justify-center bg-[#1F1D2B] text-white">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-500">Waiter App Disabled</h1>
            <p className="text-gray-400">This module is currently turned off.</p>
          </div>
        </div>
    }>
    <div className="min-h-screen pb-20 relative">
      {/* TRANSFER MODE BANNER */}
      {isTransferMode && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#ea7c69] text-white p-4 shadow-2xl animate-in slide-in-from-bottom flex justify-between items-center">
              <div>
                  <p className="font-bold text-lg">Transferring {sourceTableForTransfer?.table_number}</p>
                  <p className="text-white/80 text-sm">Select a target table to move or merge.</p>
              </div>
              <button 
                onClick={handleCancelTransfer}
                className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
          </div>
      )}

      {/* --- MODERN HEADER --- */}
      <div className="sticky top-0 z-20 bg-[#1F1D2B]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Floor <span className="text-[#ea7c69]">Overview</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {tables.length} Tables · Realtime Active
              </p>
            </div>
            {/* Realtime Status Indicator */}
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Live' : 'Offline'}
               </span>
               <div className="relative flex h-3 w-3">
                  {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
               </div>
            </div>
          </div>

          {/* --- STATUS BAR (FILTER-LOOK) --- */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {/* ALERT PILL */}
            {alertCount > 0 && (
              <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-900/50 animate-bounce">
                <span className="font-bold">{alertCount}</span>
                <span className="text-xs font-bold uppercase">Requests</span>
              </div>
            )}

            {/* PENDING PILL (Most Important) */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                pendingCount > 0
                  ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/50"
                  : "bg-[#252836] border-white/5 text-gray-400"
              }`}
            >
              <span className="font-bold">{pendingCount}</span>
              <span className="text-xs font-bold uppercase">To Confirm</span>
            </div>

            {/* ACTIVE PILL */}
            <div className="flex items-center gap-2 bg-[#252836] border border-white/5 text-blue-200 px-4 py-2 rounded-xl">
              <span className="font-bold">{activeCount}</span>
              <span className="text-xs font-bold uppercase">Occupied</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABLE GRID --- */}
      <div className={`p-4 transition-opacity ${loadingTransfer ? 'opacity-50 pointer-events-none' : ''}`}>
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <FaLayerGroup className="text-4xl mb-4 text-gray-600" />
            <p className="text-gray-500">No tables found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tables.map((table) => {
              const activeSession = sessions.find(
                (s) => s.table_id === table.id
              );
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  session={activeSession}
                  onClick={handleTableClick}
                  isTransferMode={isTransferMode}
                  isSource={sourceTableForTransfer?.id === table.id}
                />
              );
            })}
          </div>
        )}
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
      />
    </div>
    </FeatureGuard>
  );
}

