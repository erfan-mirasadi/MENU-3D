import React from 'react';

export default function ReceiptTemplate({ 
    table, 
    session, 
    items = [], 
    total = 0, 
    restaurant
}) {
    // Current date/time for the receipt
    const printDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Helper to extract string from potential localized object
    const getLocalized = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.en || val.ru || val.tr || Object.values(val)[0] || '';
    };

    return (
        <div className="receipt-container hidden">
            <style jsx global>{`
                @media print {
                    /* Reset everything */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Show only the receipt */
                    .receipt-container, .receipt-container * {
                        visibility: visible;
                    }

                    .receipt-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%; /* For 80mm this usually maps to standard width, or allow auto */
                        display: block !important;
                        background: white;
                        color: black;
                        font-family: 'Courier New', Courier, monospace; /* Monospace is best for receipts */
                        font-size: 12px;
                        line-height: 1.2;
                        padding: 0;
                        margin: 0;
                    }

                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>

            <div className="max-w-[80mm] mx-auto p-4 bg-white text-black">
                {/* Header */}
                <div className="text-center mb-4">
                    {restaurant?.logo && (
                        <img 
                            src={restaurant.logo} 
                            alt={restaurant.name} 
                            className="w-16 h-16 mx-auto mb-2 object-contain"
                        />
                    )}
                    <h1 className="text-xl font-bold mb-1">{restaurant?.name || 'Restaurant Name'}</h1>
                    <div className="text-xs uppercase break-words">
                        {/* Address Placeholder or from restaurant object if available */}
                        Fine Dining & Drinks
                    </div>
                    <div className="text-gray-500 text-[10px] mt-1">
                        --------------------------------
                    </div>
                </div>

                {/* Info */}
                <div className="mb-4 text-xs">
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{printDate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Table:</span>
                        <span className="font-bold">{table?.table_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ref Code:</span>
                        <span className="font-bold font-mono text-base">{session?.id?.slice(-4).toUpperCase() || '---'}</span>
                    </div>
                </div>

                {/* Items Header */}
                <div className="border-b border-black mb-2 pb-1 text-xs font-bold flex">
                    <span className="w-8">Qty</span>
                    <span className="flex-1">Item</span>
                    <span className="w-16 text-right">Price</span>
                </div>

                {/* Items List */}
                <div className="mb-4 space-y-1">
                    {items.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="text-xs flex items-start">
                            <span className="w-8 font-bold">{item.quantity}x</span>
                            <div className="flex-1">
                                <div className="font-semibold">{getLocalized(item.product?.title) || 'Unknown Item'}</div>
                                {item.selected_variants && Object.values(item.selected_variants).length > 0 && (
                                    <div className="text-[10px] text-gray-600 pl-1">
                                        {Object.values(item.selected_variants).map(v => getLocalized(v.name)).join(', ')}
                                    </div>
                                )}
                            </div>
                            <span className="w-16 text-right">
                                {(item.product?.price * item.quantity).toFixed(2)}₺
                            </span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="border-t border-black pt-2 mb-6">
                    <div className="flex justify-between text-sm font-bold">
                        <span>TOTAL</span>
                        <span>{total.toFixed(2)}₺</span>
                    </div>
                    <div className="text-[10px] text-center mt-6">
                        Thank you for dining with us!
                    </div>
                </div>
            </div>
        </div>
    );
}
