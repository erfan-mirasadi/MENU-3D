'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRestaurantData } from '@/app/hooks/useRestaurantData'
import RestaurantMap from '../_components/RestaurantMap'
import TableEditor from '../_components/TableEditor'
import { calculateDefaultLayout, calculateGridLayout } from '../_utils/layoutUtils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { RiEdit2Line, RiSave3Line, RiCloseLine, RiRestartLine, RiDragMove2Line, RiShapeLine, RiAddLine } from 'react-icons/ri'
import { useRouter } from 'next/navigation'
import OrderDrawer from '@/components/shared/OrderDrawer'
import OfflineAlert from "@/components/shared/OfflineAlert";
import Loader from '@/components/ui/Loader'
import { useRestaurantFeatures } from '@/app/hooks/useRestaurantFeatures';
import { useLanguage } from '@/context/LanguageContext';
import TableGrid from '@/components/shared/TableView/TableGrid';
import { FaList, FaCube } from 'react-icons/fa';

export default function DashboardPage() {
  const router = useRouter()
  // unified hook
  const { tables, sessions, loading, restaurantId, restaurant, refetch, handleCheckout, isConnected } = useRestaurantData()
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState('3d') // '3d' or 'grid'
  const [sortingMode, setSortingMode] = useState('priority') 
  const [loadingTransfer, setLoadingTransfer] = useState(false)
  
  // Selection State
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Transfer State
  const [isTransferMode, setIsTransferMode] = useState(false)
  const [sourceTableIdForTransfer, setSourceTableIdForTransfer] = useState(null)

  // Dynamically import service (to avoid top-level circular deps if any)
  // const { moveSession, mergeSessions } = require("@/services/waiterService");

  // Local state for layout changes
  const [localTables, setLocalTables] = useState([])
  const [floorStyle, setFloorStyle] = useState('terazzo') 

  // Load persistence
  useEffect(() => {
     const saved = localStorage.getItem('menu-app-floor-style')
     if (saved) setFloorStyle(saved)
  }, [])

  const handleFloorChange = (e) => {
      const newStyle = e.target.value
      setFloorStyle(newStyle)
      localStorage.setItem('menu-app-floor-style', newStyle)
  }

  // Init local tables when entering edit mode or loading
  const mergedTables = useMemo(() => {
    const merged = tables.map((table) => {
       const activeSession = sessions.find((s) => s.table_id === table.id);
       
       let computedStatus = 'free'
       
       // Priority 0: Transfer Mode Visuals
       if (isTransferMode) {
           if (table.id === sourceTableIdForTransfer) {
               computedStatus = 'source'
           }
           else if (activeSession) {
               computedStatus = 'merge_target' // Occupied -> Merge
           }
           else {
               computedStatus = 'move_target' // Empty -> Move
           }
       }
       // Priority 1: Normal Visuals
       else if (activeSession) {
           const items = activeSession.order_items || []
           const requests = activeSession.service_requests || []
           
           // 1. Bill/Service Request (Red)
           const hasPaymentRequest = requests.some(r => r.status === 'pending') 
           
           // 2. Counts
           const pendingCount = items.filter(i => i.status === 'pending').length
           const confirmedCount = items.filter(i => i.status === 'confirmed').length
           const preparingCount = items.filter(i => i.status === 'preparing').length
           const servedCount = items.filter(i => i.status === 'served').length
           
           if (hasPaymentRequest) {
               computedStatus = 'payment_requested'
           }
           else if (confirmedCount > 0) {
               // Legacy "Confirmed" status (if used)
               computedStatus = 'confirmed' 
           }
           else if (preparingCount > 0) {
               // Chef Cooking -> Yellow
               computedStatus = 'preparing'
           }
           else if (pendingCount > 0) {
               // Waiter Sent -> Orange/Yellow
               computedStatus = 'kitchen_sent'
           }
           else if (servedCount > 0) {
               // Chef Served -> Green
               computedStatus = 'active'
           }
           else {
               // Session open but no active items (Occupied / Seated)
               computedStatus = 'occupied' 
           }
       }

       return {
         ...table,
         status: computedStatus,
         active_orders: activeSession?.order_items,
         session: activeSession,
         width: table.layout_data?.width || 2.2,
         depth: table.layout_data?.depth || 2.2,
         x: table.layout_data?.x || 0,
         y: table.layout_data?.y || 0
       };
    });
    return calculateDefaultLayout(merged);
  }, [tables, sessions, isTransferMode, sourceTableIdForTransfer])


  const handleEnterTransferMode = () => {
     if (!selectedTableId) return;
     // Close drawer
     setIsDrawerOpen(false);
     // Enable mode
     setIsTransferMode(true);
     setSourceTableIdForTransfer(selectedTableId);
     // Clear selection
     setSelectedTableId(null);
     toast(t('selectTargetTable'), { icon: "🔄" });
  };

  const handleCancelTransfer = () => {
     setIsTransferMode(false);
     setSourceTableIdForTransfer(null);
     toast(t('transferCancelled'));
  };

  const handleTableSelection = async (targetId) => {
     if (!sourceTableIdForTransfer || loadingTransfer) return;
     
     if (targetId === sourceTableIdForTransfer) {
         toast.error("Cannot transfer to self!");
         return;
     }

     // Import dynamically
     const { moveSession, mergeSessions } = require("@/services/waiterService");

     // 1. Get Source Session
     const sourceSession = sessions.find(s => s.table_id === sourceTableIdForTransfer);
     if (!sourceSession) {
         toast.error("Source table has no active session!");
         handleCancelTransfer();
         return;
     }

     const sourceTable = tables.find(t => t.id === sourceTableIdForTransfer);
     const targetTable = tables.find(t => t.id === targetId);
     
     if (!sourceTable || !targetTable) return;

     // 2. Determine Action (Move vs Merge)
     const targetSession = sessions.find(s => s.table_id === targetId);
     const isMerge = !!targetSession;

     if (isMerge) {
         if(!confirm(`Merge Table ${sourceTable.table_number} into Table ${targetTable.table_number}?`)) return;
         
         try {
             setLoadingTransfer(true);
             await mergeSessions(sourceSession.id, targetSession.id);
             toast.success(t('mergeSuccess'));
             // Refresh Data
             refetch();
         } catch(err) {
             console.error(err);
             toast.error("Merge failed");
         }
     } else {
         if(!confirm(`Move Table ${sourceTable.table_number} to Table ${targetTable.table_number}?`)) return;

         try {
             setLoadingTransfer(true);
             await moveSession(sourceSession.id, targetId);
             toast.success(t('moveSuccess'));
             // Refresh Data
             refetch();
         } catch(err) {
             console.error(err);
             toast.error("Move failed");
         }
     }

     setLoadingTransfer(false);
     handleCancelTransfer();
  };

  const handleStartEdit = () => {
      setLocalTables(mergedTables) // Initialize editor with current state
      setIsEditing(true)
  }

  const handleUpdateTables = (updatedList) => {
      setLocalTables(updatedList)
  }

  const handleSaveLayout = async () => {
      const updates = localTables.map(async (t) => {
          return supabase
            .from('tables')
            .update({ 
                layout_data: { 
                    x: t.x, 
                    y: t.y,
                    width: t.width || 1.2,
                    depth: t.depth || 1.2
                } 
            })
            .eq('id', t.id)
      })
      
      try {
          await Promise.all(updates)
          toast.success('Floor plan saved successfully')
          setIsEditing(false)
          setSelectedTableId(null)
          refetch() // Explicitly refresh data
      } catch (err) {
          console.error(err)
          toast.error('Failed to save layout')
      }
  }

  const handleAddTable = async () => {
      let maxNum = 0
      localTables.forEach(t => {
          const match = t.table_number.toString().match(/(\d+)$/)
          if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNum) maxNum = num
          }
      })
      const nextNum = maxNum + 1
      const usePrefix = localTables.length > 0 && localTables.some(t => t.table_number.toString().startsWith('T-'))
      const nextTableNumber = usePrefix ? `T-${String(nextNum).padStart(2, '0')}` : nextNum.toString()
      const finalTableNumber = localTables.length === 0 ? "T-01" : nextTableNumber
      const qrToken = `token-${finalTableNumber.toLowerCase()}-${Date.now().toString(36)}`

      const GRID_STEP = 25 
      let foundX = 0
      let foundY = 0
      let found = false
      
      for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
             const testX = col * GRID_STEP
             const testY = row * GRID_STEP
             
             const hasCollision = localTables.some(t => {
                 const dx = Math.abs(t.x - testX)
                 const dy = Math.abs(t.y - testY)
                 return dx < 22 && dy < 22 
             })
             
             if (!hasCollision) {
                 foundX = testX
                 foundY = testY
                 found = true
                 break
             }
          }
          if (found) break
      }
      
      if (!found) {
          const rightMost = localTables.reduce((max, t) => Math.max(max, t.x), 0)
          foundX = rightMost + 30
      }

      const tempId = `temp-${Date.now()}`
      const newTable = {
          id: tempId,
          table_number: finalTableNumber,
          x: foundX,
          y: foundY,
          width: 2.2,
          depth: 2.2,
          status: 'free',
          restaurant_id: restaurantId,
          qr_token: qrToken
      }
      
      setLocalTables([...localTables, newTable])
      
      try {
           if (!restaurantId) throw new Error("Missing Restaurant ID")
           
           const { data, error } = await supabase
            .from('tables')
            .insert({
                restaurant_id: restaurantId,
                table_number: finalTableNumber,
                qr_token: qrToken,
                layout_data: {
                    x: foundX,
                    y: foundY,
                    width: 2.2, 
                    depth: 2.2
                }
            })
            .select()
            .single()
            
           if (error) throw error
           
           setLocalTables(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t))
           toast.success(`Table ${finalTableNumber} added!`)
           
      } catch (err) {
          console.error(err)
          toast.error("Failed to add table")
          setLocalTables(prev => prev.filter(t => t.id !== tempId))
      }
  }

  const handleResetLayout = () => {
      if (!confirm("Are you sure? This will strictly arrange tables by number and reset all custom sizes.")) return;
       
      const reset = calculateGridLayout(localTables)
      const fullyReset = reset.map(t => ({ ...t, width: 2.2, depth: 2.2 }))
      
      setLocalTables(fullyReset)
      toast(t('resetSort'), { icon: 'ℹ️' })
  }

  const { isEnabled } = useRestaurantFeatures();
  
  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-gray-200">
           <Loader active={true} />
        </div>
     )
  }

  if (!isEnabled("cashier")) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#1F1D2B] text-white">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-500">Cashier POS Disabled</h1>
                <p className="text-gray-400">This module is currently turned off.</p>
            </div>
        </div>
      )
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1F1D2B]">
      
      {/* 3D Viewport or Grid View */}
      <div className="absolute inset-0 z-0 overflow-auto">
        {viewMode === '3d' || isEditing ? (
            isEditing ? (
                <TableEditor 
                    tables={localTables} 
                    onTablesUpdate={handleUpdateTables}
                    selectedTableId={selectedTableId}
                    onSelectTable={setSelectedTableId}
                    floorType={floorStyle}
                />
            ) : (
                <div className="w-full h-full bg-[#1F1D2B]">
                    <RestaurantMap 
                        tables={mergedTables} 
                        floorType={floorStyle}
                        onSelectTable={(id) => {
                            if(!id) return;
                            
                            if (isTransferMode) {
                                handleTableSelection(id);
                                return;
                            }

                            setSelectedTableId(id);
                            setIsDrawerOpen(true);
                        }}
                    />
                </div>
            )
        ) : (
            <div className="p-8 pt-24 h-full overflow-y-auto bg-[#1F1D2B]">
                <TableGrid 
                    tables={mergedTables}
                    sessions={sessions}
                    onTableClick={(table) => {
                        if (isTransferMode) {
                            handleTableSelection(table.id);
                            return;
                        }
                        setSelectedTableId(table.id);
                        setIsDrawerOpen(true);
                    }}
                    isTransferMode={isTransferMode}
                    sourceTableId={sourceTableIdForTransfer}
                    loadingTransfer={loadingTransfer}
                    role="cashier"
                    sortingMode={sortingMode}
                />
            </div>
        )}
      </div>

       {/* ORDER DRAWER */}
       {selectedTableId && !isEditing && (
            <OrderDrawer 
                key={selectedTableId}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                table={mergedTables.find(t => t.id === selectedTableId)}
                session={sessions.find(s => s.table_id === selectedTableId)}
                onCheckout={handleCheckout}
                role="cashier"
                restaurant={restaurant}
                onTransfer={handleEnterTransferMode}
                onRefetch={refetch}
            />
       )}

      {/* --- OFFLINE ALERT --- */}
      <OfflineAlert isConnected={isConnected} />

      {/* TRANSFER MODE BANNER */}
      {isTransferMode && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#ea7c69] text-white px-8 py-4 rounded-full shadow-2xl animate-in slide-in-from-bottom flex gap-6 items-center">
              <div>
                  <p className="font-bold text-lg whitespace-nowrap">{t('selectTargetTable')}</p>
                  <p className="text-white/80 text-xs">{t('clickToMove')}</p>
              </div>
              <button 
                onClick={handleCancelTransfer}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full font-bold transition-colors text-sm"
              >
                {t('cancel')}
              </button>
          </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-start flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-wider uppercase text-white drop-shadow-md">{t('floorManager')}</h1>
              {isEditing && <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-500/30 font-bold">{t('editMode')}</span>}
          </div>
          
          <div className="flex items-center gap-4">
               {/* Language Switcher */}
               {/* <LanguageSwitcher /> */}

               {/* Stats */}
              {!isEditing && (
                <>
                  <div className="bg-[#252836]/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/10 text-sm font-medium flex items-center gap-3 text-white">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="text-gray-300">{isConnected ? t('systemOnline') : t('offline')}</span>
                     </div>
                     <div className="w-px h-4 bg-white/10"></div>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        <span className="text-gray-300">{mergedTables.filter(t => t.status !== 'free').length} {t('occupied')}</span>
                     </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Sorting Toggle (Only for Grid) */}
                    {viewMode === 'grid' && (
                         <button 
                            onClick={() => setSortingMode(prev => prev === 'priority' ? 'numeric' : 'priority')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all border  ${
                                sortingMode === 'priority' 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                                : 'bg-[#252836] border-white/10 text-gray-400 hover:bg-white/5'
                            } cursor-pointer`}
                         >
                            <FaList />
                            {sortingMode === 'priority' ? "Smart Sort" : "123 Sort"}
                         </button>
                    )}
                  </div>
                </>
              )}

              {/* Edit Controls */}
              <div className="flex gap-2">
                  {viewMode === '3d' && (
                    isEditing ? (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <button 
                            onClick={handleAddTable}
                            className="bg-[#252836] text-green-400 border border-green-500/30 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-[#2d3042] hover:border-green-500 hover:text-green-300 transition-all mr-2 cursor-pointer"
                        >
                            <RiAddLine size={20} /> {t('addTable')}
                        </button>
                        
                        <div className="relative group mr-2">
                             <select
                                value={floorStyle}
                                onChange={handleFloorChange}
                                className="bg-[#252836] text-gray-200 border border-white/10 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-[#2d3042] hover:border-white/30 transition-all appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 z-100"
                             >
                                <option value="parquet">{t('woodParquet')}</option>
                                <option value="concrete">{t('concrete')}</option>
                                <option value="marble">{t('whiteMarble')}</option>
                                <option value="terrazzo">{t('terrazzo')}</option>
                                <option value="black">{t('black')}</option>
                             </select>
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                ▼
                             </div>
                        </div>

                        <button 
                            onClick={handleResetLayout}
                            className="bg-[#252836] text-red-500 border border-red-500/30 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-[#2d3042] hover:border-red-500 hover:text-red-400 transition-all mr-4 cursor-pointer"
                        >
                            <RiRestartLine size={20} /> {t('resetSort')}
                        </button>

                        <button 
                            onClick={() => {
                                setIsEditing(false)
                            }}
                            className="bg-[#252836] text-gray-400 border border-white/10 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-[#2d3042] hover:text-white transition-all cursor-pointer"
                        >
                            <RiCloseLine size={20} /> {t('cancel')}
                        </button>
                        <button 
                            onClick={handleSaveLayout}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-500/30 font-bold flex items-center gap-2 hover:bg-blue-500 transition-all cursor-pointer"
                        >
                            <RiSave3Line size={20} /> {t('save')}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleStartEdit}
                        className="bg-[#252836] text-gray-200 border border-white/10 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-[#2d3042] hover:border-white/30 hover:text-white transition-all cursor-pointer"
                      >
                        <RiEdit2Line size={18} /> {t('editFloor')}
                      </button>
                    )
                  )}
              </div>

            {/* View Toggler (Moved to End for RTL usage) */}
            {!isEditing && (
                <div className="bg-[#252836]/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/10 flex gap-1">
                    <button 
                        onClick={() => setViewMode('3d')}
                        className={`p-2 rounded-lg transition-all ${viewMode === '3d' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}
                        title="3D View"
                    >
                        <FaCube size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Grid View"
                    >
                        <FaList size={16} />
                    </button>
                </div>
            )}

          </div>
        </header>

        {/* Footer / Instructions for Edit Mode */}
        {isEditing && (
             <div className="self-center pointer-events-auto flex flex-col items-center gap-4 mb-8">
                 <div className="bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md text-sm font-medium shadow-xl flex items-center gap-6">
                     <div className="flex items-center gap-2">
                         <RiDragMove2Line className="text-blue-400" />
                         <span>{t('dragTables')}</span>
                     </div>
                     <div className="w-px h-4 bg-white/20"></div>
                     <div className="flex items-center gap-2">
                         <RiShapeLine className="text-orange-400" />
                         <span>{t('resizeTables')}</span>
                     </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  )
}