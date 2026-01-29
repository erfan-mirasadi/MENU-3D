import { supabase } from "@/lib/supabase";

const getDateRanges = (range) => {
  const now = new Date();
  // Normalize "now" to start of today 00:00:00 for accurate day diffs
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let currentStart, previousStart, previousEnd;

  switch (range) {
    case "Today":
      currentStart = today; // 00:00 Today
      previousStart = new Date(today);
      previousStart.setDate(today.getDate() - 1); // 00:00 Yesterday
      previousEnd = today; // Ends at 00:00 Today (so fetches full Yesterday)
      break;
    case "Week":
      // Valid assumption: Week starts on Monday
      const day = today.getDay(); // 0 is Sunday
      const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
      
      currentStart = new Date(today);
      currentStart.setDate(diffToMon); // This Monday
      currentStart.setHours(0,0,0,0);

      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7); // Last Monday
      
      previousEnd = currentStart; // Last Week ends when This Week starts
      break;
    case "Month":
      // 1st of Current Month
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // 1st of Last Month
      previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      previousEnd = currentStart;
      break;
    case "3 Months":
      // 1st of Month, 3 months ago
      currentStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      previousStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      previousEnd = currentStart;
      break;
    case "Year":
      // Jan 1st of This Year
      currentStart = new Date(today.getFullYear(), 0, 1);
      
      // Jan 1st of Last Year
      previousStart = new Date(today.getFullYear() - 1, 0, 1);
      
      previousEnd = currentStart;
      break;
    default: // Month
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
      previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      previousEnd = currentStart;
  }
  return { 
      currentStart: currentStart.toISOString(), 
      previousStart: previousStart.toISOString(), 
      previousEnd: previousEnd.toISOString() 
  };
};

// Helper to calculate percentage change
const calculateTrend = (current, previous) => {
    if (previous === 0) return null; // Distinguish "no previous data" from "100% growth"
    return ((current - previous) / previous) * 100;
};

export const reportService = {
  async getStats(range) {
    const { currentStart, previousStart, previousEnd } = getDateRanges(range);

    // 1. Fetch Current Data
    const { data: currentItems, error: currentError } = await supabase
      .from("order_items")
      .select("quantity, unit_price_at_order")
      .neq("status", "cancelled")
      .gte("created_at", currentStart);

    const { count: currentCustomers } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentStart);

    // 2. Fetch Previous Data
    const { data: previousItems, error: previousError } = await supabase
      .from("order_items")
      .select("quantity, unit_price_at_order")
      .neq("status", "cancelled")
      .gte("created_at", previousStart)
      .lt("created_at", previousEnd);
    
    const { count: previousCustomers } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", previousStart)
      .lt("created_at", previousEnd);

    // 3. Calculate Aggregates
    const calculateMetrics = (items) => {
        if (!items) return { revenue: 0, dishes: 0 };
        return items.reduce((acc, item) => ({
            revenue: acc.revenue + (item.quantity * (parseFloat(item.unit_price_at_order) || 0)),
            dishes: acc.dishes + item.quantity
        }), { revenue: 0, dishes: 0 });
    };

    const currentMetrics = calculateMetrics(currentItems);
    const previousMetrics = calculateMetrics(previousItems);

    return {
      revenue: {
          value: currentMetrics.revenue,
          trend: calculateTrend(currentMetrics.revenue, previousMetrics.revenue)
      },
      dishes: {
          value: currentMetrics.dishes,
          trend: calculateTrend(currentMetrics.dishes, previousMetrics.dishes)
      },
      customers: {
          value: currentCustomers || 0,
          trend: calculateTrend(currentCustomers || 0, previousCustomers || 0)
      }
    };
  },

  async getRecentOrders(range) {
    const { currentStart } = getDateRanges(range);
    const startDate = currentStart;

    // 1. Fetch orders without trying to join profiles on the missing FK
    const { data: orders, error } = await supabase
      .from("order_items")
      .select(`
        *,
        products (title, image_url)
      `)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false })
      .limit(10); 

    if (error) {
      console.error("Error fetching recent orders:", error);
      return [];
    }

    if (!orders || orders.length === 0) return [];

    // 2. Extract distinct guest/user IDs to fetch their names manually
    const headerIds = [
        ...new Set(
            orders
            .map(o => o.added_by_guest_id)
            .filter(id => id) // remove nulls
        )
    ];

    let profilesMap = {};

    if (headerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", headerIds);
        
        if (!profilesError && profiles) {
            profiles.forEach(p => {
                profilesMap[p.id] = p.full_name;
            });
        }
    }

    // 3. Map orders to UI format
    return orders.map(order => ({
      id: order.id,
      customer: profilesMap[order.added_by_guest_id] || "Guest",
      avatar: null, 
      menu: order.products?.title || "Unknown Item", // Return raw object
      total: (order.quantity * (parseFloat(order.unit_price_at_order) || 0)),
      status: order.status,
      created_at: order.created_at
    }));
  },

  async getTopSellingItems(range) {
     const { currentStart } = getDateRanges(range);
     
     // Supabase doesn't support aggregate "SUM(quantity) GROUP BY product_id" easily with SDK without RPC.
     // We'll fetch items and aggregate in JS for simplicity unless dataset is huge (Cashier dashboard implies daily active usage, shouldn't be massive in one day/week for client side agg).
     
     const { data, error } = await supabase
       .from("order_items")
       .select(`
         quantity,
         product_id,
         products (title, image_url)
       `)
       .neq("status", "cancelled")
       .gte("created_at", currentStart);

     if (error) return [];

     const aggregation = {};
     data.forEach(item => {
        const pid = item.product_id;
        if (!aggregation[pid]) {
            aggregation[pid] = {
                name: item.products?.title || "Unknown", // Return raw object
                image: item.products?.image_url,
                count: 0
            };
        }
        aggregation[pid].count += item.quantity;
     });

     // Convert to array and sort
     return Object.values(aggregation)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
  },

  async getOrderTypes(range) {
      const { currentStart } = getDateRanges(range);
      
      const { count } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentStart);

      return {
          "Dine In": count || 0,
          "To Go": 0,
          "Delivery": 0
      };
  },

  // --- Financial Reporting ---

  async getFinancialStats(range) {
    const { currentStart, previousStart, previousEnd } = getDateRanges(range);
    
    // Helper to fetch data for a given period
    // Helper to fetch data for a given period
    const fetchPeriodData = async (start, end) => {
        // Bills (Gross Sales, Adjustments)
        const { data: bills } = await supabase
            .from("bills")
            .select("total_amount, status, adjustments")
            .gte("created_at", start)
            .lt("created_at", end || new Date().toISOString());

        const sales = bills
            ?.filter(b => b.status?.toUpperCase() === 'PAID')
            .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;

        // Calculate Adjustments
        let extraCharges = 0;
        let discounts = 0;

        bills?.forEach(b => {
             // Only count adjustments for PAID bills? Or all? 
             // Usually financial reports track accrual or cash basis. 
             // If we count gross sales only for PAID, we should probably align adjustments to PAID too.
             if (b.status?.toUpperCase() === 'PAID' && b.adjustments && Array.isArray(b.adjustments)) {
                 b.adjustments.forEach(adj => {
                     const amt = parseFloat(adj.amount) || 0;
                     if (adj.type === 'charge') extraCharges += amt;
                     if (adj.type === 'discount') discounts += amt;
                 });
             }
        });

        // Transactions (Net Cash/Card)
        const { data: transactions } = await supabase
            .from("transactions")
            .select("amount, method")
            .gte("created_at", start)
            .lt("created_at", end || new Date().toISOString());

        const cash = transactions
            ?.filter(t => t.method?.toLowerCase().includes("cash"))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
            
        const card = transactions
            ?.filter(t => t.method?.toLowerCase().includes("pos") || t.method?.toLowerCase().includes("card"))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

        // Voids
        const { data: voids } = await supabase
            .from("activity_logs")
            .select("details")
            .eq("action", "VOID_ITEM")
            .gte("created_at", start)
            .lt("created_at", end || new Date().toISOString());

        const voidVal = voids?.reduce((sum, v) => {
            const price = parseFloat(v.details?.snapshot?.price) || 0;
            const qty = parseFloat(v.details?.snapshot?.quantity) || 0;
            const voidedQty = parseFloat(v.details?.voided_quantity) || 0;
            const quantityToUse = voidedQty > 0 ? voidedQty : qty;
            return sum + (price * quantityToUse);
        }, 0) || 0;

        return { sales, cash, card, voidVal, extraCharges, discounts };
    };

    const current = await fetchPeriodData(currentStart);
    const previous = await fetchPeriodData(previousStart, previousEnd);

    return {
        grossSales: {
            value: current.sales,
            trend: calculateTrend(current.sales, previous.sales)
        },
        netCash: {
            value: current.cash,
            trend: calculateTrend(current.cash, previous.cash)
        },
        netCard: {
            value: current.card,
            trend: calculateTrend(current.card, previous.card)
        },
        voidedValue: {
            value: current.voidVal,
            trend: calculateTrend(current.voidVal, previous.voidVal)
        },
        extraCharges: {
            value: current.extraCharges,
            trend: calculateTrend(current.extraCharges, previous.extraCharges)
        },
        discounts: {
            value: current.discounts,
            trend: calculateTrend(current.discounts, previous.discounts)
        }
    };
  },

  async getTransactions(range) {
     const { currentStart } = getDateRanges(range);

     const { data, error } = await supabase
        .from("transactions")
        .select(`
            id,
            created_at,
            amount,
            method,
            recorded_by,
            bills (
                id,
                session:sessions (
                     tables (table_number)
                )
            )
        `)
        .gte("created_at", currentStart)
        .order("created_at", { ascending: false });

     if (error) {
         console.error("Error fetching transactions", error);
         return [];
     }

     // Fetch staff profiles manually to be safe against missing FK relations
     const userIds = [...new Set(data.map(t => t.recorded_by).filter(id => id))];
     let profilesMap = {};

     if (userIds.length > 0) {
         const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("id", userIds);
         
         if (!profileError && profiles) {
             profiles.forEach(p => {
                 profilesMap[p.id] = { 
                     name: p.full_name, 
                     role: p.role 
                 };
             });
         }
     }

     return data.map(t => {
         const staffInfo = profilesMap[t.recorded_by];
         let staffDisplay = "Admin/Cashier"; // Default fallback
         
         if (staffInfo) {
             // User requested: Name | Role (e.g. erfan | cashier)
             const role = staffInfo.role || "Unknown Role";
             staffDisplay = `${staffInfo.name || "Unknown"} | ${role}`;
         } else if (t.recorded_by) {
            // If we have an ID but no profile found
             staffDisplay = `User (${t.recorded_by.slice(0, 4)}...)`; 
         }

         return {
            id: t.id,
            time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            billId: t.bills?.id ? `${t.bills.id.slice(-6).toUpperCase()}` : "N/A",
            tableNo: t.bills?.session?.tables?.table_number || "-",
            amount: t.amount,
            method: t.method,
            staff: staffDisplay
         };
     });
  },

  async getProductMix(range) {
      const { currentStart } = getDateRanges(range);
      
      const { data, error } = await supabase
        .from("order_items")
        .select(`
            quantity,
            unit_price_at_order,
            products (
                id,
                title
            )
        `)
        .neq("status", "cancelled")
        .gte("created_at", currentStart);

      if (error) return [];

      const mix = {};
      data.forEach(item => {
          const pid = item.products?.id;
          if (!pid) return;
          
          if (!mix[pid]) {
              mix[pid] = {
                  name: item.products?.title?.en || "Unknown",
                  quantity: 0,
                  revenue: 0
              };
          }
          mix[pid].quantity += item.quantity;
          mix[pid].revenue += (item.quantity * (parseFloat(item.unit_price_at_order) || 0));
      });

      return Object.values(mix).sort((a,b) => b.revenue - a.revenue);
  },



  async getTransactionDetails(transactionId) {
      if (!transactionId) return null;

      // 1. Fetch Transaction & Bill info
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select(`
            id,
            created_at,
            amount,
            method,
            bills (
                id,
                session_id,
                total_amount,
                adjustments,
                sessions (
                    note
                )
            )
        `)
        .eq("id", transactionId)
        .single();
      
      if (txError || !transaction) throw txError || new Error("Transaction not found");

      // Fetch Metadata from Activity Logs (WORKAROUND: transactions table has no metadata)
      const { data: logData } = await supabase
        .from("activity_logs")
        .select("details")
        .eq("action", "PAYMENT_METADATA")
        .filter("details->>transaction_id", "eq", transactionId)
        .maybeSingle();

      const paidItemIds = logData?.details?.items || [];

      const sessionId = transaction.bills?.session_id;
      if (!sessionId) return { 
          items: [], 
          totalAmount: transaction.amount, 
          method: transaction.method, 
          time: new Date(transaction.created_at).toLocaleString(),
          billTotal: 0,
          adjustments: [],
          sessionNote: null 
      };

      // 2. Fetch Order Items for this session
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
            id,
            quantity,
            unit_price_at_order,
            products (
                title,
                image_url,
                original_price
            )
        `)
        .eq("session_id", sessionId)
        .neq("status", "cancelled");

      if (itemsError) throw itemsError;

      // 3. Format Items
      const formattedItems = items.map(item => ({
          id: item.id,
          title: item.products?.title || "Unknown Item", // Return raw object
          image: item.products?.image_url,
          quantity: item.quantity,
          price: parseFloat(item.unit_price_at_order) || 0,
          originalPrice: item.products?.original_price ? parseFloat(item.products.original_price) : null
      }));

      return {
          id: transaction.id,
          time: new Date(transaction.created_at).toLocaleString(),
          method: transaction.method,
          totalAmount: transaction.amount,
          billTotal: transaction.bills?.total_amount || 0,
          adjustments: transaction.bills?.adjustments || [],
          sessionNote: transaction.bills?.sessions?.note || null,
          paidItemIds: paidItemIds,
          items: formattedItems
      };
  },

  async getSecurityLog(range) {
      const { currentStart } = getDateRanges(range);

      // Removed profiles join to prevent 400 error if relation missing
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
            created_at,
            details,
            action,
            user_id
        `)
        .in("action", ["VOID_ITEM", "CANCEL_ORDER", "PARTIAL_VOID"])
        .gte("created_at", currentStart)
        .order("created_at", { ascending: false });

      if (error) return [];

      return data.map(log => {
          let rawItem = log.details?.snapshot?.product || log.details?.snapshot?.product_title || "Unknown Item";
           // Return raw object if available, allowing UI to localize
          
          return {
              time: new Date(log.created_at).toLocaleString(),
              staff: "Staff " + (log.user_id?.slice(0,4) || ""), // Placeholder
              item: rawItem,
              reason: log.details?.reason || "No Reason",
              action: log.action,
              value: (parseFloat(log.details?.snapshot?.price) || 0) * (log.details?.voided_quantity || log.details?.snapshot?.quantity || 1)
          };
      });
  }
};
