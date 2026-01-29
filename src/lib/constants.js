export const ORDER_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
    CANCELLED: 'cancelled',
    CLOSED: 'closed' // Added from orderService.js usage
};

export const PAYMENT_METHOD = {
    CASH: 'CASH',
    POS: 'POS',
    MIXED: 'MIXED', // UI state, mapped to SPLIT usually or multiple entries
    ONLINE: 'ONLINE'
};

export const REQUEST_TYPES = {
    CALL_WAITER: 'call_waiter',
    BILL: 'bill',
    CANCEL_ORDER: 'cancel_order'
};

export const BILL_STATUS = {
    PAID: 'PAID',
    UNPAID: 'UNPAID'
};

export const SESSION_STATUS = {
    ACTIVE: 'ordering',
    CLOSED: 'closed'
};
