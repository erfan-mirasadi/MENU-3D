'use client'
import { useState, useMemo } from 'react'
import { useCashierData } from '@/app/hooks/useCashierData'
import RestaurantMap from '../_components/RestaurantMap'
import TableEditor from '../_components/TableEditor'
import { calculateDefaultLayout } from '../_utils/layoutUtils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { RiEdit2Line, RiSave3Line, RiCloseLine, RiRestartLine, RiDragMove2Line, RiShapeLine } from 'react-icons/ri'

export default function DashboardPage() {
  const { tables, sessions, loading } = useCashierData()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState(null)
  
  // 'translate' | 'scale'
  const [editMode, setEditMode] = useState('translate')
  
  // Local state for layout changes
  // We need to keep track of FULL table objects now, because they might have new Width/Depth
  const [localTables, setLocalTables] = useState([])

  // Init local tables when entering edit mode or loading
  const mergedTables = useMemo(() => {
    const merged = tables.map((table) => {
       const activeSession = sessions.find((s) => s.table_id === table.id);
       return {
         ...table,
         status: activeSession ? activeSession.status : 'free',
         // Ensure defaults
         width: table.layout_data?.width || 1.2,
         depth: table.layout_data?.depth || 1.2,
         x: table.layout_data?.x || 0, // Fallback, will be fixed by grid calc if needed
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
          window.location.reload()
      } catch (err) {
          console.error(err)
          toast.error('Failed to save layout')
      }
  }

  const handleResetLayout = () => {
      if (!confirm("Are you sure? This will strictly arrange tables by number and reset all custom sizes.")) return;
      
      const reset = calculateDefaultLayout(localTables.map(t => ({
          ...t,
          layout_data: { x: 0, y: 0 } // Force clear
      })))
      // Reset dimensions too
      const fullyReset = reset.map(t => ({ ...t, width: 1.2, depth: 1.2 }))
      
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
                mode={editMode}
            />
        ) : (
            <RestaurantMap tables={mergedTables} />
        )}
      </div>

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
                            onClick={handleResetLayout}
                            className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-red-50 transition-colors mr-4"
                        >
                            <RiRestartLine size={20} /> Reset Sort
                        </button>

                        <button 
                            onClick={() => {
                                setIsEditing(false)
                                // local changes discarded automatically since we re-init next time
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
                 
                 {/* Tool Switcher */}
                 <div className="flex bg-white rounded-full shadow-xl p-1 gap-1">
                    <button 
                        onClick={() => setEditMode('translate')}
                        className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${editMode === 'translate' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <RiDragMove2Line size={18} /> Move
                    </button>
                    <button 
                        onClick={() => setEditMode('scale')}
                        className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${editMode === 'scale' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <RiShapeLine size={18} /> Resize
                    </button>
                 </div>

                 <div className="bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md text-sm font-medium shadow-xl flex items-center gap-6">
                     <div className="flex items-center gap-2">
                         {editMode === 'translate' ? "Drag arrows to move" : "Drag boxes to resize"}
                     </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  )
}