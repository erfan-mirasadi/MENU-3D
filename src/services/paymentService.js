import { supabase } from "@/lib/supabase";
import { BILL_STATUS, ORDER_STATUS } from "@/lib/constants";

export async function getBill(billId) {
  const { data, error } = await supabase.from("bills").select("*").eq("id", billId).single();
  if (error) throw error;
  return data;
}

export async function getBillBySessionId(sessionId) {
  const { data, error } = await supabase.from("bills").select("*").eq("session_id", sessionId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBill(billData) {
  const { data, error } = await supabase.from("bills").insert([billData]).select().single();
  if (error) throw error;
  return data;
}

export async function updateBill(billId, updates, optimisticPaidAmount = undefined) {
  let query = supabase.from("bills").update(updates).eq("id", billId);
  if (optimisticPaidAmount !== undefined) {
      query = query.eq("paid_amount", optimisticPaidAmount);
  }
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function insertTransactions(transactions) {
  const { data, error } = await supabase.from("transactions").insert(transactions).select();
  if (error) throw error;
  return data;
}

export async function updateSessionStatus(sessionId, status) {
  const { data, error } = await supabase.from("sessions").update({ status }).eq("id", sessionId).select().single();
  if (error) throw error;
  return data;
}

export async function fetchUnpaidSessionItems(billId, sessionId) {
  const { data: pastTxs, error: txError } = await supabase.from("transactions").select("paid_items").eq("bill_id", billId);
  if (txError) throw txError;

  const paidIds = new Set();
  pastTxs?.forEach(tx => {
      if (Array.isArray(tx.paid_items)) {
          tx.paid_items.forEach(pi => paidIds.add(pi.id));
      }
  });

  const { data: allItems, error: itemsError } = await supabase
    .from("order_items")
    .select(`*, product:products (title, price, image_url)`)
    .eq("session_id", sessionId)
    .in("status", [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED])
    .order('created_at', { ascending: true });
  
  if (itemsError) throw itemsError;
  if (!allItems) return [];
  
  return allItems.filter(i => !paidIds.has(i.id));
}

export async function fetchSessionItemsForBill(sessionId) {
  const { data, error } = await supabase
    .from("order_items")
    .select("quantity, unit_price_at_order, status")
    .eq("session_id", sessionId)
    .in("status", [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED]);
  if (error) throw error;
  return data;
}

export async function getBillAdjustments(billId) {
  const { data, error } = await supabase.from("bills").select("adjustments").eq("id", billId).single();
  if (error) throw error;
  return data?.adjustments || [];
}

/**
 * Calculates and updates the bill's total amount.
 */
export async function calculateBillTotalLogic(billId) {
    if (!billId) throw new Error("Bill ID is required");

    const bill = await getBill(billId);
    const orderItems = await fetchSessionItemsForBill(bill.session_id);

    const itemsTotal = orderItems.reduce((acc, item) => {
        return acc + (item.quantity * parseFloat(item.unit_price_at_order));
    }, 0);

    const adjustments = bill.adjustments || [];
    const adjustmentsTotal = adjustments.reduce((acc, adj) => {
        const amount = parseFloat(adj.amount) || 0;
        return adj.type === 'charge' ? acc + amount : acc - amount;
    }, 0);

    const grandTotal = itemsTotal + adjustmentsTotal;

    return await updateBill(billId, { total_amount: grandTotal });
}

/**
 * Appends a new adjustment and recalculates.
 */
export async function addBillAdjustmentLogic(billId, adjustment) {
    if (!billId) throw new Error("Bill ID is required");
    if (!adjustment.amount || !adjustment.title || !adjustment.type) {
        throw new Error("Invalid adjustment data");
    }

    const currentAdjustments = await getBillAdjustments(billId);
    const newAdjustments = [...currentAdjustments, adjustment];

    await updateBill(billId, { adjustments: newAdjustments });
    return await calculateBillTotalLogic(billId);
}

/**
 * Ensures a bill exists, creates if missing, recalculates otherwise.
 */
export async function getOrCreateBillLogic(sessionId) {
    const orderItems = await fetchSessionItemsForBill(sessionId);
    const totalAmount = orderItems.reduce((acc, item) => {
      return acc + (item.quantity * parseFloat(item.unit_price_at_order));
    }, 0);

    let bill = await getBillBySessionId(sessionId);

    if (!bill) {
        bill = await createBill({
            session_id: sessionId,
            total_amount: totalAmount,
            paid_amount: 0,
            status: BILL_STATUS.UNPAID,
        });
    } else {
        return await calculateBillTotalLogic(bill.id);
    }
    return bill;
}

/**
 * Logic to map out FIFO items for a given payment amount
 */
function resolveItemsForPayment(amount, explicitItems, isFull, availableItems) {
    if (isFull) {
        return [...availableItems];
    }

    if (explicitItems && explicitItems.length > 0) {
        const availableIds = new Set(availableItems.map(i => i.id));
        return explicitItems.filter(i => availableIds.has(i.id));
    }

    // For purely monetary, partial/custom payments without explicit items selected,
    // we DO NOT aggressively allocate real items. This prevents items from being falsely 
    // marked as "paid" when only a fraction of the bill was paid by a custom amount.
    return [{
        id: `unallocated-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: "Partial Payment",
        quantity: 1,
        price: amount,
        unit_price_at_order: amount,
        product: { title: "Partial Payment", price: amount }
    }];
}

/**
 * The core orchestrator for payment processing.
 */
export async function processPaymentLogic(sessionId, type, data) {
    if (!sessionId) throw new Error("Session ID is required");

    let bill = await getOrCreateBillLogic(sessionId);
    console.log(`[PaymentLogic] Processing Payment for Session: ${sessionId}, Bill ID: ${bill.id}`);

    const availableItems = await fetchUnpaidSessionItems(bill.id, sessionId);

    let transactionsToRecord = [];
    let paymentTotal = 0;
    
    const currentRemaining = bill.remaining_amount !== undefined 
         ? parseFloat(bill.remaining_amount) 
         : (parseFloat(bill.total_amount) - parseFloat(bill.paid_amount));

    if (type === 'SINGLE') {
        const { method, amount, items, isFullPayment } = data;
        let amt = parseFloat(amount);
        
        const allocatedItems = resolveItemsForPayment(amt, items, isFullPayment, availableItems);
        
        if (amt > currentRemaining + 0.5) { 
             throw new Error(`Payment amount (${amt}) exceeds remaining due (${currentRemaining})`);
        }
        console.log(`[PaymentLogic] Recording SINGLE Transaction: Amount=${amt}, Method=${method}, Items=${allocatedItems.length}`);
        transactionsToRecord.push({ method, amount: amt, items: allocatedItems });
        paymentTotal = amt;
    } 
    else if (type === 'SPLIT') {
        const { payments } = data;
        let runningAvailable = [...availableItems];
        
        for (const p of payments) {
             const pAmt = parseFloat(p.amount);
             const allocated = resolveItemsForPayment(pAmt, p.items, false, runningAvailable);
             
             transactionsToRecord.push({ method: p.method, amount: pAmt, items: allocated });
             paymentTotal += pAmt;
             
             const allocatedIds = new Set(allocated.map(i => i.id));
             runningAvailable = runningAvailable.filter(i => !allocatedIds.has(i.id));
        }
        
        let splitTotal = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        if (splitTotal > currentRemaining + 0.5) {
             throw new Error(`Total split payment (${splitTotal}) exceeds remaining due (${currentRemaining})`);
        }
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const dbTransactions = transactionsToRecord.map(t => ({
        bill_id: bill.id,
        amount: t.amount,
        method: t.method,
        recorded_by: user?.id,
        paid_items: t.items?.map(i => ({
            id: i.id,
            title: i.product?.title || "[DELETED PRODUCT]",
            quantity: i.quantity,
            price: i.unit_price_at_order ? parseFloat(i.unit_price_at_order) : (i.product?.price || 0)
        })) || []
    }));

    console.log(`[PaymentLogic] Inserting ${dbTransactions.length} transaction records into DB...`);
    await insertTransactions(dbTransactions);

    const newPaidAmount = (parseFloat(bill.paid_amount) || 0) + paymentTotal;
    const newRemainingLocal = (parseFloat(bill.total_amount) || 0) - newPaidAmount; 
    const isFullyPaid = newRemainingLocal <= 0.5;

    const updatedBill = await updateBill(bill.id, {
        paid_amount: newPaidAmount,
        status: isFullyPaid ? BILL_STATUS.PAID : BILL_STATUS.UNPAID
    }, bill.paid_amount);

    if (!updatedBill) {
        throw new Error("Payment conflict detected: The bill was updated by another user. Please retry.");
    }

    if (isFullyPaid) {
        await updateSessionStatus(sessionId, ORDER_STATUS.CLOSED);
    }

    return { 
        success: true, 
        billId: bill.id, 
        remaining: Math.max(0, newRemainingLocal), 
        fullyPaid: isFullyPaid 
    };
}