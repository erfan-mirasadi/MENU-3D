"use client";
import { useState } from "react";
import { useRestaurantData } from "@/app/hooks/useRestaurantData"; // [NEW]
import { createTable, deleteTable } from "@/services/tableService"; // Removed getTables
import TableCard from "@/app/admin/_components/tables/TableCard";
import AddCard from "@/app/admin/_components/ui/AddCart";
import QrSettingsPanel from "@/app/admin/_components/tables/QrSettingsPanel";
import Loader from "@/components/ui/Loader";
import toast from "react-hot-toast";

export default function TablesPage() {
  const { tables, loading, restaurant, refetch } = useRestaurantData(); // [FIX] Use Context
  const [adding, setAdding] = useState(false);
  
  // QR Code Settings State
  const [color1, setColor1] = useState("#ea7c69");
  const [color2, setColor2] = useState("#252836");

  const handleAddTable = async () => {
    if (!restaurant?.id) {
        toast.error("Restaurant not found");
        return;
    }
    setAdding(true);
    try {
      // 1. Calculate Next Table Number
      // Find max number from T-XX pattern
      let maxNum = 0;
      tables.forEach(t => {
          const match = t.table_number.match(/^T-(\d+)$/);
          if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
          }
      });
      
      const nextNum = maxNum + 1;
      const nextTableNumber = `T-${String(nextNum).padStart(2, '0')}`;
      const token = `token-${nextTableNumber.toLowerCase()}-${Date.now().toString(36)}`; // Simple unique token
      await createTable({
          restaurant_id: restaurant.id,
          table_number: nextTableNumber,
          qr_token: token
      });

      // Update State via Refetch (Context)
      toast.success(`Table ${nextTableNumber} added!`);
      refetch(restaurant.id); // Refresh global data

    } catch (error) {
      console.error(error);
      // Toast handled in service
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTable = async (id) => {
    try {
        await deleteTable(id);
        toast.success("Table deleted successfully");
        refetch(restaurant?.id); // Refresh global data
    } catch (error) {
        // error handled in service
    }
  };

  if (loading) return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
      <Loader active={true} />
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Tables Management</h1>
        <p className="text-text-dim">Manage your restaurant tables and QR codes.</p>
      </div>

      <QrSettingsPanel 
        color1={color1} 
        setColor1={setColor1} 
        color2={color2}
        setColor2={setColor2} 
        restaurantLogo={restaurant?.logo}
        slug={restaurant?.slug}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-10">
        {/* Add Card acting as the first item or separate button */}
        <AddCard 
          onClick={handleAddTable} 
          isLoading={adding} 
          label="Add New Table"
          className="border-primary/40"
        />

        {/* List of Tables */}
        {tables.map((table) => (
          <TableCard 
            key={table.id} 
            table={table} 
            onDelete={handleDeleteTable}
            qrSettings={{ color1, color2 }}
            slug={restaurant?.slug}
            restaurantLogo={restaurant?.logo}
          />
        ))}
      </div>
    </div>
  );
}
