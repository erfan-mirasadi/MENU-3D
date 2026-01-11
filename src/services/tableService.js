import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export async function getTableByNumber(tableNumber, restaurantId) {
  if (!restaurantId) {
      console.error("getTableByNumber called without restaurantId");
      return null;
  }
  
  let query = supabase
    .from("tables")
    .select("id, table_number, restaurant_id")
    .eq("table_number", tableNumber)
    .eq("restaurant_id", restaurantId);
  // Removed "if (restaurantId)" block since it's now required
    
  const { data, error } = await query.single();

  if (error) {
    console.error("Error fetching table:", error);
    toast.error("Failed to fetch table");
    return null;
  }

  return data;
}

export async function getTables(restaurantId) {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("table_number", { ascending: true });

  if (error) {
    console.error("Error fetching tables:", error);
    toast.error("Failed to fetch tables");
    return [];
  }

  return data || [];
}

export async function createTable(tableData) {
  const { data, error } = await supabase
    .from("tables")
    .insert([tableData])
    .select()
    .single();

  if (error) {
    console.error("Error creating table:", error);
    toast.error("Failed to create table");
    throw error;
  }

  return data;
}

export async function deleteTable(tableId) {
  const { error } = await supabase.from("tables").delete().eq("id", tableId);

  if (error) {
    console.error("Error deleting table:", error);
    toast.error("Failed to delete table");
    throw error;
  }
}
