"use client";

import { useMemo } from "react";
import {
  FaUser,
  FaConciergeBell,
  FaUtensils,
  FaCheckCircle,
  FaMugHot, // آیکون جدید برای حالت Dining
  FaUsers
} from "react-icons/fa";

export default function TableCard({ table, session, onClick, isTransferMode, isSource, role = "waiter" }) {
  const cardStyle = useMemo(() => {
    // ---------------------------------------------------------
    // 0. TRANSFER MODE
    // ---------------------------------------------------------
    if (isTransferMode) {
        if (isSource) {
            return {
                type: 'source',
                baseClasses: "bg-black/60 border-2 border-gray-600 grayscale opacity-50 cursor-not-allowed",
                numberColor: "text-gray-500",
                labelColor: "text-gray-500",
                labelText: "Source",
                icon: null,
                glow: ""
            };
        }
        // Target Logic
        if (session) {
             // Merge Target (Occupied)
             return {
                type: 'merge-target',
                baseClasses: "bg-orange-900/40 border-4 border-dashed border-orange-500 animate-pulse cursor-pointer hover:bg-orange-900/60",
                numberColor: "text-orange-200",
                labelColor: "text-orange-400 font-black uppercase tracking-widest",
                labelText: "MERGE HERE",
                icon: <FaUtensils className="text-orange-500 text-3xl" />,
                glow: "shadow-[0_0_30px_rgba(249,115,22,0.3)]"
             };
        } else {
             // Move Target (Empty)
             return {
                type: 'move-target',
                baseClasses: "bg-green-900/40 border-4 border-dashed border-green-500 animate-pulse cursor-pointer hover:bg-green-900/60",
                numberColor: "text-green-200",
                labelColor: "text-green-400 font-black uppercase tracking-widest",
                labelText: "MOVE HERE",
                icon: <FaCheckCircle className="text-green-500 text-3xl" />,
                glow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]"
             };
        }
    }

    // ---------------------------------------------------------
    // 1. EMPTY (خالی)
    // ---------------------------------------------------------
    if (!session) {
      return {
        type: "empty",
        baseClasses:
          "bg-[#1F1D2B] border-2 border-[#2D303E] opacity-50 hover:opacity-100 hover:border-gray-500",
        numberColor: "text-gray-600",
        labelColor: "text-gray-500",
        labelText: "Empty",
        icon: null,
        glow: "",
      };
    }

    const preparingCount =
      session.order_items?.filter((i) => i.status === "preparing").length || 0;
    const pendingCount =
      session.order_items?.filter((i) => i.status === "pending").length || 0;
    const confirmedCount =
      session.order_items?.filter((i) => i.status === "confirmed").length || 0;
    const servedCount =
      session.order_items?.filter((i) => i.status === "served").length || 0;
    const hasRequest = session.service_requests?.some(
      (r) => r.status === "pending"
    );

    // ---------------------------------------------------------
    // 2. ALERT (Requests)
    // ---------------------------------------------------------
    if (hasRequest) {
      return {
        type: "alert",
        baseClasses:
          "bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400 animate-bounce shadow-xl",
        numberColor: "text-white",
        labelColor: "text-red-100 font-bold",
        labelText: "CALLING!",
        icon: (
          <FaConciergeBell className="text-white text-2xl animate-wiggle" />
        ),
        glow: "shadow-red-600/50",
      };
    }

    // ---------------------------------------------------------
    // 3. ORANGE BLINKING Logic (Priority Attention)
    // - Waiter: Pending Items (User Confirmed -> Needs Waiter)
    // - Cashier: Confirmed Items (Waiter Confirmed -> Needs Kitchen/Cashier Awareness)
    // ---------------------------------------------------------
    const showOrangeBlink = role === 'cashier' 
        ? confirmedCount > 0 
        : pendingCount > 0;

    if (showOrangeBlink) {
         return {
            type: "attention",
            baseClasses:
              "bg-orange-600 border-2 border-orange-400 animate-pulse shadow-xl shadow-orange-900/50",
            numberColor: "text-white",
            labelColor: "text-orange-50 font-bold uppercase tracking-wider",
            labelText: role === 'cashier' ? "KITCHEN SENT" : "NEW ORDER",
            icon: <FaUtensils className="text-white text-2xl" />,
            glow: "shadow-orange-600/50",
         };
    }

    // ---------------------------------------------------------
    // 3. PREPARING (درحال پخت) - (زرد)
    // شف تایید کرده
    // ---------------------------------------------------------
    if (preparingCount > 0) {
      return {
        type: "preparing",
        baseClasses:
          "bg-yellow-600 border-2 border-yellow-400 shadow-xl",
        numberColor: "text-white",
        labelColor: "text-yellow-50 font-bold uppercase tracking-wider",
        labelText: "COOKING",
        icon: <FaUtensils className="text-white text-2xl" />,
        glow: "shadow-yellow-500/50",
      };
    }

    // Fallback for "In Progress" states not covered by blink
    if (pendingCount > 0 || confirmedCount > 0) {
       return {
            type: "active_process",
            baseClasses:
              "bg-orange-800/80 border-2 border-orange-700/50 shadow-lg",
            numberColor: "text-orange-100",
            labelColor: "text-orange-200 font-bold uppercase tracking-wider",
            labelText: "WAITING",
            icon: <FaUtensils className="text-orange-200 text-2xl" />,
            glow: "",
       };
    }

    // ---------------------------------------------------------
    // 5. DINING (Served Only)
    // ---------------------------------------------------------
    if (servedCount > 0) {
      return {
        type: "dining",
        baseClasses: "bg-emerald-700 border-2 border-emerald-500/50 shadow-lg",
        numberColor: "text-emerald-50",
        labelColor: "text-emerald-200 font-bold uppercase tracking-widest",
        labelText: "Dining",
        icon: <FaMugHot className="text-emerald-200 text-2xl" />,
        glow: "shadow-emerald-900/50",
      };
    }

    // ---------------------------------------------------------
    // 6. OCCUPIED (Seated)
    // ---------------------------------------------------------
    return {
      type: "occupied",
      baseClasses: "bg-[#252836] border-2 border-blue-500/30",
      numberColor: "text-blue-100",
      labelColor: "text-blue-400 font-medium",
      labelText: "Seated",
      icon: <FaUser className="text-blue-500 text-xl" />,
      glow: "",
    };
  }, [session, isTransferMode, isSource, role]);

  return (
    <div
      onClick={() => onClick(table, session)}
      className={`
        relative aspect-square rounded-2xl flex flex-col items-center justify-between p-4 cursor-pointer
        transition-all duration-300 transform active:scale-95
        ${cardStyle.baseClasses} ${cardStyle.glow}
      `}
    >
      {/* Header: Icon + Guest Count */}
      <div className="w-full flex justify-between items-start h-8">
        {cardStyle.icon && (
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/5">
            {cardStyle.icon}
          </div>
        )}

        {/* Guest Count Badge */}
        {session && (
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10 text-white/80">
                <FaUsers size={10} />
                <span className="text-xs font-bold">
                  {/* Calculate Guest Count from Unique Guest IDs in Orders */}
                  {(() => {
                      const items = session.order_items || [];
                      const uniqueGuests = new Set(items.map(i => i.added_by_guest_id).filter(Boolean));
                      return uniqueGuests.size || 1; // Default to 1 if no orders yet
                  })()}
                </span>
            </div>
        )}
      </div>

      {/* Body: Table Number */}
      <div className="flex-1 flex items-center justify-center">
        <span
          className={`text-5xl font-black tracking-tighter ${cardStyle.numberColor}`}
        >
          {table.table_number}
        </span>
      </div>

      {/* Footer: Status Label */}
      <div className="w-full text-center pb-1">
        <span className={`text-[10px] ${cardStyle.labelColor}`}>
          {cardStyle.labelText}
        </span>
      </div>
    </div>
  );
}
