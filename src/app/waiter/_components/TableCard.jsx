"use client";

import { useMemo } from "react";
import {
  FaUser,
  FaConciergeBell,
  FaUtensils,
  FaCheckCircle,
  FaMugHot, // آیکون جدید برای حالت Dining
} from "react-icons/fa";

export default function TableCard({ table, session, onClick, isTransferMode, isSource }) {
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

    // محاسبه تعداد آیتم‌ها برای تشخیص وضعیت
    const pendingCount =
      session.order_items?.filter((i) => i.status === "pending").length || 0;
    const confirmedCount =
      session.order_items?.filter((i) =>
        ["confirmed", "served"].includes(i.status)
      ).length || 0;
    const hasRequest = session.service_requests?.some(
      (r) => r.status === "pending"
    );

    // ---------------------------------------------------------
    // 2. ALERT (درخواست گارسون) - اولویت اول (قرمز)
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
    // 3. WAITING APPROVAL (منتظر تایید) - اولویت دوم (نارنجی)
    // اگر حتی ۱ آیتم پندینگ باشه، یعنی گارسون باید بره سر میز
    // ---------------------------------------------------------
    if (pendingCount > 0) {
      return {
        type: "waiting",
        baseClasses:
          "bg-orange-600 border-2 border-orange-400 animate-pulse shadow-xl",
        numberColor: "text-white",
        labelColor: "text-orange-50 font-bold uppercase tracking-wider",
        labelText: "Confirm Order",
        icon: <FaUtensils className="text-white text-2xl" />,
        glow: "shadow-orange-500/50",
      };
    }

    // ---------------------------------------------------------
    // 4. DINING (درحال خوردن) - وضعیت جدید (سبز) ✅
    // اگر آیتم تایید شده داریم و هیچی پندینگ نیست
    // ---------------------------------------------------------
    if (confirmedCount > 0) {
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
    // 5. OCCUPIED (تازه نشسته) - (آبی)
    // سشن بازه ولی هنوز هیچی سفارش ندادن (یا همش پاک شده)
    // ---------------------------------------------------------
    return {
      type: "occupied",
      baseClasses: "bg-[#252836] border-2 border-blue-500/30",
      numberColor: "text-blue-100",
      labelColor: "text-blue-400 font-medium",
      labelText: "Seated", // تغییر متن به Seated که منطقی‌تره
      icon: <FaUser className="text-blue-500 text-xl" />,
      glow: "",
    };
  }, [session]);

  return (
    <div
      onClick={() => onClick(table, session)}
      className={`
        relative aspect-square rounded-2xl flex flex-col items-center justify-between p-4 cursor-pointer 
        transition-all duration-300 transform active:scale-95
        ${cardStyle.baseClasses} ${cardStyle.glow}
      `}
    >
      {/* هدر کارت: آیکون وضعیت */}
      <div className="w-full flex justify-between items-start h-8">
        {cardStyle.icon && (
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/5">
            {cardStyle.icon}
          </div>
        )}
        {/* اگر در حالت Dining هستیم، تعداد آیتم‌ها رو ریز نشون بده */}
        {cardStyle.type === "dining" && (
          <span className="text-xs font-mono bg-emerald-900/50 px-2 py-1 rounded text-emerald-200 border border-emerald-500/30">
            Paid: 0
          </span>
        )}
      </div>

      {/* بدنه اصلی: شماره میز */}
      <div className="flex-1 flex items-center justify-center">
        <span
          className={`text-5xl font-black tracking-tighter ${cardStyle.numberColor}`}
        >
          {table.table_number}
        </span>
      </div>

      {/* فوتر: متن وضعیت */}
      <div className="w-full text-center pb-1">
        <span className={`text-[10px] ${cardStyle.labelColor}`}>
          {cardStyle.labelText}
        </span>
      </div>
    </div>
  );
}
