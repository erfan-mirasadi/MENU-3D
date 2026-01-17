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
        const { method, amount } = data;
        const amt = parseFloat(amount);
        // Validation: Cannot pay more than remaining (with tolerance)
        if (amt > currentRemaining + 0.5) { 
             throw new Error(`Payment amount (${amt}) exceeds remaining due (${currentRemaining})`);
        }
        transactionsToRecord.push({ method, amount: amt });
        paymentTotal = amt;
    } 
    else if (type === 'SPLIT') {
        const { payments } = data; 
        paymentTotal = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        
        if (paymentTotal > currentRemaining + 0.5) {
             throw new Error(`Total split payment (${paymentTotal}) exceeds remaining due (${currentRemaining})`);
        }
        transactionsToRecord = payments.map(p => ({ method: p.method, amount: parseFloat(p.amount) }));
    }

    // 4. Record Transactions
    const { data: { user } } = await supabase.auth.getUser();
    
    const dbTransactions = transactionsToRecord.map(t => ({
        bill_id: bill.id,
        amount: t.amount,
        method: t.method, // 'CASH' or 'POS' or 'MIXED'(mapped)
        recorded_by: user?.id
    }));

    const { error: trxError } = await supabase
      .from("transactions")
      .insert(dbTransactions);

    if (trxError) throw trxError;

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
