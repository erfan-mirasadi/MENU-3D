import { supabase } from "@/lib/supabase";
import { ORDER_STATUS, PAYMENT_METHOD, BILL_STATUS } from "@/lib/constants";

export const cashierService = {
  /**
   * Process payment for a session
   * @param {string} sessionId
   * @param {string} type - 'SINGLE' or 'SPLIT'
   * @param {Object} data - Payment details
   */
  async processPayment(sessionId, type, data) {
    if (!sessionId) throw new Error("Session ID is required");

    let bill = await this.getOrCreateBill(sessionId);

    // 3. Prepare Transactions
    let transactionsToRecord = [];
    let paymentTotal = 0;

    // Calc pseudo-remaining for validation logic only
    // If bill just created, remaining is effectively totalAmount.
    // If fetched, bill.remaining_amount *should* be there if generated column returns it.
    // If not returned by insert/select immediately, fallback to calc.
    const currentRemaining = bill.remaining_amount !== undefined 
         ? parseFloat(bill.remaining_amount) 
         : (parseFloat(bill.total_amount) - parseFloat(bill.paid_amount));

    if (type === 'SINGLE') {
        const { method, amount, items } = data;
        const amt = parseFloat(amount);
        // Validation: Cannot pay more than remaining (with tolerance)
        if (amt > currentRemaining + 0.5) { 
             throw new Error(`Payment amount (${amt}) exceeds remaining due (${currentRemaining})`);
        }
        transactionsToRecord.push({ method, amount: amt, items });
        paymentTotal = amt;
    } 
    else if (type === 'SPLIT') {
        const { payments } = data; 
        paymentTotal = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        
        if (paymentTotal > currentRemaining + 0.5) {
             throw new Error(`Total split payment (${paymentTotal}) exceeds remaining due (${currentRemaining})`);
        }
        transactionsToRecord = payments.map(p => ({ method: p.method, amount: parseFloat(p.amount), items: p.items }));
    }

    // 4. Record Transactions
    const { data: { user } } = await supabase.auth.getUser();
    
    const dbTransactions = transactionsToRecord.map(t => ({
        bill_id: bill.id,
        amount: t.amount,
        method: t.method, // 'CASH' or 'POS' or 'MIXED'(mapped)
        recorded_by: user?.id,
        paid_items: t.items?.map(i => ({
            id: i.id,
            title: i.product?.title || "[DELETED PRODUCT]",
            quantity: i.quantity,
            price: i.unit_price_at_order ? parseFloat(i.unit_price_at_order) : (i.product?.price || 0)
        })) || []
    }));

    const { data: insertedTxs, error: trxError } = await supabase
      .from("transactions")
      .insert(dbTransactions)
      .select();

    if (trxError) throw trxError;

    // 5. Update Bill Status
    // We only update paid_amount. remaining_amount is generated.
    const newPaidAmount = (parseFloat(bill.paid_amount) || 0) + paymentTotal;
    // We calc local newRemaining just for checking isFullyPaid status
    const newRemainingLocal = (parseFloat(bill.total_amount) || 0) - newPaidAmount; 
    const isFullyPaid = newRemainingLocal <= 0.5; // tolerance

    const { error: updateError } = await supabase
        .from("bills")
        .update({
            paid_amount: newPaidAmount,
            status: isFullyPaid ? BILL_STATUS.PAID : BILL_STATUS.UNPAID
        })
        .eq("id", bill.id);

    if (updateError) throw updateError;

    // 6. Close Session if Fully Paid
    if (isFullyPaid) {
        const { error: sessionError } = await supabase
          .from("sessions")
          .update({ status: ORDER_STATUS.CLOSED })
          .eq("id", sessionId);

        if (sessionError) throw sessionError;
    }

    return { 
        success: true, 
        billId: bill.id, 
        remaining: Math.max(0, newRemainingLocal), 
        fullyPaid: isFullyPaid 
    };
  },

  /**
   * Recalculates the bill total based on order items and adjustments.
   * Updates total_amount and remaining_amount in the DB.
   * @param {string} billId 
   */
  async calculateBillTotal(billId) {
    if (!billId) throw new Error("Bill ID is required");

    // 1. Fetch Bill (to get adjustments and paid_amount)
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("id", billId)
      .single();

    if (billError) throw billError;

    // 2. Fetch Order Items (to calculate base total)
    // We include all items that are liable for payment (confirmed, served, preparing, ready)
    // We distinctively EXCLUDE 'cancelled' and 'pending' (drafts)
    const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("quantity, unit_price_at_order, status")
        .eq("session_id", bill.session_id)
        .in("status", [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED]);

    if (itemsError) throw itemsError;

    // 3. Calculate Totals
    const itemsTotal = orderItems.reduce((acc, item) => {
        return acc + (item.quantity * parseFloat(item.unit_price_at_order));
    }, 0);

    const adjustments = bill.adjustments || [];
    const adjustmentsTotal = adjustments.reduce((acc, adj) => {
        const amount = parseFloat(adj.amount) || 0;
        return adj.type === 'charge' ? acc + amount : acc - amount;
    }, 0);

    const grandTotal = itemsTotal + adjustmentsTotal;
    // Ensure accurate paid_amount from DB
    const paidAmount = parseFloat(bill.paid_amount) || 0; 
    const remainingAmount = grandTotal - paidAmount;

    // 4. Update Bill in DB
    const { data: updatedBill, error: updateError } = await supabase
        .from("bills")
        .update({
            total_amount: grandTotal
        })
        .eq("id", billId)
        .select()
        .single();

    if (updateError) throw updateError;
    return updatedBill;
  },

  /**
   * Adds an adjustment (Extra Charge or Discount) to the bill.
   * @param {string} billId 
   * @param {Object} adjustment - { title: string, amount: number, type: 'charge'|'discount' }
   */
  async addBillAdjustment(billId, adjustment) {
    if (!billId) throw new Error("Bill ID is required");
    if (!adjustment.amount || !adjustment.title || !adjustment.type) {
        throw new Error("Invalid adjustment data");
    }

    // 1. Fetch current adjustments
    const { data: bill, error: fetchError } = await supabase
        .from("bills")
        .select("adjustments")
        .eq("id", billId)
        .single();
    
    if (fetchError) throw fetchError;

    const currentAdjustments = bill.adjustments || [];
    const newAdjustments = [...currentAdjustments, adjustment];

    // 2. Update adjustments in DB
    const { error: updateError } = await supabase
        .from("bills")
        .update({ adjustments: newAdjustments })
        .eq("id", billId);

    if (updateError) throw updateError;

    // 3. Trigger Recalculation
    return await this.calculateBillTotal(billId);
  },

  /**
   * Ensures a bill exists for the session and returns it with up-to-date totals.
   * @param {string} sessionId 
   */
  async getOrCreateBill(sessionId) {
    // 1. Calculate Total Amount from Order Items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("quantity, unit_price_at_order, status")
      .eq("session_id", sessionId)
      .neq("status", ORDER_STATUS.CANCELLED);

    if (itemsError) throw itemsError;

    const totalAmount = orderItems.reduce((acc, item) => {
      return acc + (item.quantity * parseFloat(item.unit_price_at_order));
    }, 0);

    // Allow creating bill even if total is 0? Maybe adjustments will add to it.
    // user check for <= 0 was here previously. Let's keep it but maybe lenient.
    // Actually, creating a bill for 0 amount is fine, it just means fully paid/no due.
    
    // 2. Get or Create Bill
    let { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (billError) throw billError;

    if (!bill) {
        // Create new bill
        const { data: newBill, error: createError } = await supabase
          .from("bills")
          .insert({
            session_id: sessionId,
            total_amount: totalAmount,
            paid_amount: 0,
            status: BILL_STATUS.UNPAID,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        bill = newBill;
    } else {
        // Fix: Ensure bill.total_amount is up-to-date with actual order items
        // If items were added after bill creation, bill.total_amount might be stale.
        // Also check if adjustments need to be factored in (calculateBillTotal does this better).
        // Let's just run calculateBillTotal to be safe and authoritative.
        // It sums items + adjustments and updates DB.
        
        return await this.calculateBillTotal(bill.id);
    }

    return bill;
  },
}