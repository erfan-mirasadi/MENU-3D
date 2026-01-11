import { supabase } from "@/lib/supabase";

export const cashierService = {
  /**
   * Process payment for a session
   * @param {string} sessionId
   * @param {string} paymentMethod - 'CASH' or 'POS'
   * @param {number} amountReceived - Mainly for record keeping or change calc, technically strictly equal to total for POS
   */
  async processPayment(sessionId, paymentMethod, amountReceived) {
    if (!sessionId) throw new Error("Session ID is required");

    // 1. Calculate Total Amount from Order Items
    // We should re-calculate server-side or at least re-fetch to be safe and accurate
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

    // 2. Create Bill Record
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        session_id: sessionId,
        total_amount: totalAmount,
        paid_amount: totalAmount, // Full payment assumed for "Close Table"
        status: "PAID",
      })
      .select()
      .single();

    if (billError) throw billError;

    // 3. Record Transaction
    // Assuming user is authenticated, we might want to record who did this. 
    // Supabase client should handle auth context if configured, defaulting user_id usage if we had it. 
    // The schema has `recorded_by` FK to users. Ideally we get the current user ID.
    const { data: { user } } = await supabase.auth.getUser();

    const { error: trxError } = await supabase
      .from("transactions")
      .insert({
        bill_id: bill.id,
        amount: totalAmount,
        method: paymentMethod, // 'CASH' or 'POS' (Enum or user-defined?) Schema says USER-DEFINED.
        recorded_by: user?.id
      });

    if (trxError) throw trxError;

    // 4. Close Session
    const { error: sessionError } = await supabase
      .from("sessions")
      .update({ status: "closed" })
      .eq("id", sessionId);

    if (sessionError) throw sessionError;

    // 5. Free Table (Optional - Schema doesn't have status on tables table, maybe unrelated or computed from session?)
    // The schema provided for 'tables' has 'layout_data' and standard fields, no explicit status column.
    // Usually 'active session' determines table status. 
    // So closing the session implies table is free. No extra update needed on 'tables' unless logic dictates otherwise.

    return { success: true, billId: bill.id };
  }
};
