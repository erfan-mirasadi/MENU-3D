'use client'
import { useState, useMemo } from 'react'
import { useRestaurantData } from '@/app/hooks/useRestaurantData'
import RestaurantMap from '../_components/RestaurantMap'
import TableEditor from '../_components/TableEditor'
import { calculateDefaultLayout } from '../_utils/layoutUtils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { RiEdit2Line, RiSave3Line, RiCloseLine, RiRestartLine, RiDragMove2Line, RiShapeLine, RiAddLine } from 'react-icons/ri'
import { useRouter } from 'next/navigation'
import OrderDrawer from '@/components/shared/OrderDrawer'

export default function DashboardPage() {
  const router = useRouter()
  // unified hook
  const { tables, sessions, loading, restaurantId, restaurant, refetch, handleCheckout, isConnected } = useRestaurantData()
  const [isEditing, setIsEditing] = useState(false)
  
  // Selection State
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Local state for layout changes
  const [localTables, setLocalTables] = useState([])

  // Init local tables when entering edit mode or loading
  const mergedTables = useMemo(() => {
    const merged = tables.map((table) => {
       const activeSession = sessions.find((s) => s.table_id === table.id);
       
       let computedStatus = 'free'
       
       if (activeSession) {
           const items = activeSession.order_items || []
           const requests = activeSession.service_requests || []
           
           // 1. Bill/Service Request (Red)
           const hasPaymentRequest = requests.some(r => r.status === 'pending') // Assuming any request is urgent for now
           
           // 2. Counts
           const pendingCount = items.filter(i => i.status === 'pending').length
           const confirmedCount = items.filter(i => i.status === 'confirmed').length
           const preparingCount = items.filter(i => i.status === 'preparing').length
           const servedCount = items.filter(i => i.status === 'served').length
           
           if (hasPaymentRequest) {
               computedStatus = 'payment_requested'
           }
           else if (confirmedCount > 0) {
               // Waiter confirmed, Cashier Needs to see "Orange Blink"
               computedStatus = 'confirmed' 
           }
           else if (preparingCount > 0 || servedCount > 0) {
               // In kitchen or eating -> Green
               computedStatus = 'active'
           }
           else if (pendingCount > 0) {
               // Waiter hasn't confirmed yet. 
               computedStatus = 'ordering'
           }
           else {
               // Session open but no active items (Occupied / Seated)
               computedStatus = 'occupied' 
           }
       }

       return {
         ...table,
         status: computedStatus,
         width: table.layout_data?.width || 2.2,
         depth: table.layout_data?.depth || 2.2,
         x: table.layout_data?.x || 0,
         y: table.layout_data?.y || 0
       };
    });
    return calculateDefaultLayout(merged);
  }, [tables, sessions])

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
      
      const reset = calculateDefaultLayout(localTables.map(t => ({
          ...t,
          layout_data: { x: 0, y: 0 } 
      })))
      const fullyReset = reset.map(t => ({ ...t, width: 2.2, depth: 2.2 }))
      
      setLocalTables(fullyReset)
      toast('Layout reset to grid', { icon: 'ℹ️' })
  }

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
           <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading Restaurant Map...</p>
           </div>
        </div>
     )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      
      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        {isEditing ? (
            <TableEditor 
                tables={localTables} 
                onTablesUpdate={handleUpdateTables}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
            />
        ) : (
            <RestaurantMap 
                tables={mergedTables} 
                onSelectTable={(id) => {
                    if(!id) return
                    setSelectedTableId(id)
                    setIsDrawerOpen(true)
                }}
            />
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
            />
       )}

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-start flex-col gap-1">
              <h1 className="text-2xl font-bold text-gray-800 drop-shadow-md">Floor Manager</h1>
              {isEditing && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">EDIT MODE</span>}
          </div>
          
          <div className="flex items-center gap-4">
               {/* Stats */}
              {!isEditing && (
                  <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20 text-sm font-medium flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="text-gray-700">{isConnected ? 'System Online' : 'Offline'}</span>
                     </div>
                     <div className="w-px h-4 bg-gray-200"></div>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        <span className="text-gray-700">{mergedTables.filter(t => t.status !== 'free').length} Occupied</span>
                     </div>
                  </div>
              )}

              {/* Edit Controls */}
              <div className="flex gap-2">
                  {isEditing ? (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <button 
                            onClick={handleAddTable}
                            className="bg-white text-green-600 border border-green-100 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-green-50 transition-colors mr-2"
                        >
                            <RiAddLine size={20} /> Add Table
                        </button>

                        <button 
                            onClick={handleResetLayout}
                            className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-red-50 transition-colors mr-4"
                        >
                            <RiRestartLine size={20} /> Reset Sort
                        </button>

                        <button 
                            onClick={() => {
                                setIsEditing(false)
                            }}
                            className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            <RiCloseLine size={20} /> Cancel
                        </button>
                        <button 
                            onClick={handleSaveLayout}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-500/30 font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <RiSave3Line size={20} /> Save
                        </button>
                      </div>
                  ) : (
                      <button 
                        onClick={handleStartEdit}
                        className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <RiEdit2Line size={18} /> Edit Floor
                      </button>
                  )}
              </div>
          </div>
        </header>

        {/* Footer / Instructions for Edit Mode */}
        {isEditing && (
             <div className="self-center pointer-events-auto flex flex-col items-center gap-4 mb-8">
                 <div className="bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md text-sm font-medium shadow-xl flex items-center gap-6">
                     <div className="flex items-center gap-2">
                         <RiDragMove2Line className="text-blue-400" />
                         <span>Drag tables to move</span>
                     </div>
                     <div className="w-px h-4 bg-white/20"></div>
                     <div className="flex items-center gap-2">
                         <RiShapeLine className="text-orange-400" />
                         <span>Drag handles to resize</span>
                     </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  )
}