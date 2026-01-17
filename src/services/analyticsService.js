import { supabase } from "@/lib/supabase";

export const analyticsService = {
  // Task 1: Get Orders by Range
  async getOrders(range = "Today") {
    const startDate = this.getStartDate(range);

    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        unit_price_at_order,
        status,
        created_at,
        products (
          title
        ),
        session:sessions (
            id,
            status,
            tables (
                table_number
            )
        )
      `)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });
      // Removed .limit(10) to let user see all data for the selected period

    if (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
    
    // Map to UI friendly format
    return data.map(item => {
        // If session is closed, consider the order completed/paid
        const isSessionClosed = item.session?.status === 'closed';
        // Use 'Completed' if session is closed, otherwise use item status
        // Exception: if item was cancelled, keep it cancelled
        let displayStatus = item.status;
        if (isSessionClosed && item.status !== 'cancelled') {
            displayStatus = 'Completed';
        }

        return {
            id: item.id,
            tableNo: item.session?.tables?.table_number || "N/A",
            menu: item.products?.title?.en || "Unknown Item", 
            quantity: item.quantity,
            total: (item.quantity * (parseFloat(item.unit_price_at_order) || 0)),
            status: displayStatus
        };
    });
  },

  // Task 2: Sales by Category
  async getCategorySales(range = "Month") {
    const startDate = this.getStartDate(range);

    // 1. Fetch sales items with category info
    // Nested join: order_items -> products -> categories
    const { data: items, error } = await supabase
        .from("order_items")
        .select(`
            quantity,
            unit_price_at_order,
            products (
                category_id,
                categories (
                    title,
                    id
                )
            )
        `)
        .neq("status", "cancelled")
        .gte("created_at", startDate);

    if (error) {
        console.error("Error fetching category sales:", error);
        return [];
    }

    // 2. Aggregate by Category
    const categoryMap = {};

    items.forEach(item => {
        const prod = item.products;
        const cat = prod?.categories;
        
        if (!cat) return; // Skip if no category (orphaned product)

        // Title is JSONB, let's assume structure or fallback
        // The user prompt says "categories to get the category title (jsonb)"
        // We'll safely access it.
        const catName = cat.title?.en || "Unknown Category"; 
        const amount = item.quantity * (parseFloat(item.unit_price_at_order) || 0);

        if (!categoryMap[catName]) {
            categoryMap[catName] = 0;
        }
        categoryMap[catName] += amount;
    });

    // 3. Convert to Sorted Array
    const sortedCategories = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 4. Take top 3 + "Others" if needed, or just return top results. 
    // Plan requested top 3.
    const top3 = sortedCategories.slice(0, 3);
    
    // Check if we need "Others"
    /* 
    const othersValue = sortedCategories.slice(3).reduce((acc, curr) => acc + curr.value, 0);
    if (othersValue > 0) {
        top3.push({ name: "Others", value: othersValue });
    }
    */
    
    return top3;
  },

  // Task 3: Hourly Peak Data
  async getHourlyTraffic(range = "Today") {
    const startDate = this.getStartDate(range);

    const { data, error } = await supabase
        .from("order_items")
        .select("created_at")
        .gte("created_at", startDate)
        .neq("status", "cancelled");

    if (error) {
        console.error("Error fetching hourly traffic:", error);
        return Array(24).fill(0);
    }

    // Initialize 24h array
    const hourlyCounts = Array(24).fill(0);

    data.forEach(item => {
        const date = new Date(item.created_at);
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
            hourlyCounts[hour]++;
        }
    });

    return hourlyCounts;
  },

  // Helper
  getStartDate(range) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
        case "Today":
            return today.toISOString();
        case "Week":
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return weekAgo.toISOString();
        case "Month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return monthAgo.toISOString();
        case "3 Months":
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            return threeMonthsAgo.toISOString();
        case "Year":
            const yearAgo = new Date(today);
            yearAgo.setFullYear(today.getFullYear() - 1);
            return yearAgo.toISOString();
        default: // All Time or Default to Month
             const defaultDate = new Date(today);
             defaultDate.setMonth(today.getMonth() - 1);
             return defaultDate.toISOString();
    }
  }
};
