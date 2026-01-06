'use client'

import { useCashierData } from '@/app/hooks/useCashierData'
import RestaurantMap from '../_components/RestaurantMap'

export default function DashboardPage() {
  const { tables, sessions, loading } = useCashierData()

  // 1. Merge Data for Map
  const tablesWithStatus = tables.map((table) => {
    // Find active session for this table
    const activeSession = sessions.find((s) => s.table_id === table.id);
    
    return {
      ...table,
      status: activeSession ? activeSession.status : 'free',
      x: table.layout_data?.x || 0,
      y: table.layout_data?.y || 0
    };
  });

  // Calculate stats
  const occupiedCount = tablesWithStatus.filter(t => t.status !== 'free').length;

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
      
      {/* 3D Map Component */}
      <div className="absolute inset-0 z-0">
        <RestaurantMap tables={tablesWithStatus} />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6">
        <header className="flex justify-between items-center pointer-events-auto">
          <h1 className="text-2xl font-bold text-gray-800 drop-shadow-md">Floor Manager</h1>
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20 text-sm font-medium flex items-center gap-3">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-gray-700">{occupiedCount} Occupied</span>
             </div>
             <div className="w-px h-4 bg-gray-300"></div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-gray-700">{tables.length - occupiedCount} Free</span>
             </div>
          </div>
        </header>
      </div>
    </div>
  )
}