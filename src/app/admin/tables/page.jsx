"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createTable, deleteTable, getTables } from "@/services/tableService";
import { getRestaurantByOwnerId } from "@/services/restaurantService";
import TableCard from "@/app/admin/_components/tables/TableCard";
import AddCard from "@/app/admin/_components/ui/AddCart";
import QrSettingsPanel from "@/app/admin/_components/tables/QrSettingsPanel";
import Loader from "@/app/admin/_components/ui/Loader";
import toast from "react-hot-toast";

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  
  // QR Code Settings State
  const [color1, setColor1] = useState("#4f46e5");
  const [color2, setColor2] = useState("#ec4899");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get User & Restaurant ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      const restaurant = await getRestaurantByOwnerId(user.id);
      
      if (restaurant) {
        setRestaurantId(restaurant.id);
        setRestaurantSlug(restaurant.slug);
        const fetchedTables = await getTables(restaurant.id);
        setTables(fetchedTables);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
      toast.error("Error loading tables");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!restaurantId) {
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

      // 2. Create Table
      const newTable = await createTable({
          restaurant_id: restaurantId,
          table_number: nextTableNumber,
          qr_token: token
      });

      // 3. Update State
      setTables([...tables, newTable]);
      toast.success(`Table ${nextTableNumber} added!`);

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
        setTables(tables.filter(t => t.id !== id));
        toast.success("Table deleted successfully");
    } catch (error) {
        // error handled in service
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

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
            slug={restaurantSlug}
          />
        ))}
      </div>
    </div>
  );
}
