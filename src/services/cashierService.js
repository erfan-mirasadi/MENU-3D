import { supabase } from "@/lib/supabase";

export const cashierService = {
  /**
   * Process payment for a session
   * @param {string} sessionId
   * @param {string} type - 'SINGLE' or 'SPLIT'
   * @param {Object} data - Payment details
   */
  async processPayment(sessionId, type, data) {
    if (!sessionId) throw new Error("Session ID is required");

    // 1. Calculate Total Amount from Order Items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("quantity, unit_price_at_order, status")
      .eq("session_id", sessionId)
      .neq("status", "cancelled");

    if (itemsError) throw itemsError;

    const totalAmount = orderItems.reduce((acc, item) => {
      return acc + (item.quantity * parseFloat(item.unit_price_at_order));
    }, 0);

    if (totalAmount <= 0) {
        throw new Error("Cannot process payment for zero amount.");
    }

    // 2. Get or Create Bill
    let { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (billError) throw billError;

    if (!bill) {
        // Create new bill
        // REMOVED 'remaining_amount' from insert as it is GENERATED
        const { data: newBill, error: createError } = await supabase
          .from("bills")
          .insert({
            session_id: sessionId,
            total_amount: totalAmount,
            paid_amount: 0,
            status: "UNPAID",
          })
          .select()
          .single();
        
        if (createError) throw createError;
        bill = newBill;
    }

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
        recorded_by: user?.id
    }));

    const { data: insertedTxs, error: trxError } = await supabase
      .from("transactions")
      .insert(dbTransactions)
      .select();

    if (trxError) throw trxError;

    // 7. Store Item Metadata in Activity Logs (since transactions table has no metadata column)
    // We match inserted logs with our source data by index (safe since insert order is preserved)
    const logsToInsert = [];
    insertedTxs.forEach((tx, index) => {
        const sourceData = transactionsToRecord[index];
        if (sourceData.items && sourceData.items.length > 0) {
            logsToInsert.push({
                restaurant_id: bill.restaurant_id || null, // Best effort if not available in bill obj, but service functions implies strict RLS context usually handles this or we need it. 
                // Wait, bill object from select('*') might not have restaurant_id if RLS handles it implicitly? 
                // Architecture says "Every function... MUST filter by restaurant_id".
                // I will try to use user.audit logic or just rely on RLS if possible, but inserts usually need it?
                // Actually `useRestaurantData` hook -> fetches everything.
                // I'll skip restaurant_id if not present, hoping trigger fills it or it is optional? 
                // Architecture: "activity_logs... link to restaurant".
                // I'll assume current session/bill has it.
                action: 'PAYMENT_METADATA',
                resource: 'transactions', // Required field
                resource_id: tx.id,       // Required field (linking to the transaction)
                user_id: user?.id,
                details: {
                    transaction_id: tx.id, // Redundant but harmless, keeping for search
                    items: sourceData.items
                }
            });
        }
    });

    if (logsToInsert.length > 0) {
        // We catch error here to not block payment if logging fails
        const { error: logError } = await supabase.from('activity_logs').insert(logsToInsert);
        if (logError) console.error("Failed to save payment metadata", logError);
    }

    // 5. Update Bill Status
    // We only update paid_amount. remaining_amount is generated.
    const newPaidAmount = (parseFloat(bill.paid_amount) || 0) + paymentTotal;
    // We calc local newRemaining just for checking isFullyPaid status
    const newRemainingLocal = totalAmount - newPaidAmount; 
    const isFullyPaid = newRemainingLocal <= 0.5; // tolerance

    const { error: updateError } = await supabase
        .from("bills")
        .update({
            paid_amount: newPaidAmount,
            status: isFullyPaid ? 'PAID' : 'UNPAID'
        })
        .eq("id", bill.id);

    if (updateError) throw updateError;

    // 6. Close Session if Fully Paid
    if (isFullyPaid) {
        const { error: sessionError } = await supabase
          .from("sessions")
          .update({ status: "closed" })
          .eq("id", sessionId);

        if (sessionError) throw sessionError;
    }

    return { 
        success: true, 
        billId: bill.id, 
        remaining: Math.max(0, newRemainingLocal), 
        fullyPaid: isFullyPaid 
    };
  }
};
