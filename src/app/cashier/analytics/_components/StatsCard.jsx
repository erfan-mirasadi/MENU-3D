import React from "react";
import { RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";

const StatsCard = ({ title, value, percentage, isPositive, icon: Icon, loading }) => {
  if (loading) {
     return (
        <div className="bg-[#252836] p-4 rounded-lg flex flex-col gap-4 animate-pulse h-[130px]">
           <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
              <div className="h-6 w-20 bg-gray-700 rounded mt-2"></div>
           </div>
           <div className="h-8 w-32 bg-gray-700 rounded mt-4"></div>
        </div>
     );
  }

  return (
    <div className="bg-[#252836] p-4 rounded-lg flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#1F1D2B] text-[#EA7C69]">
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          {percentage ? (
             <span
                className={`${
                isPositive ? "text-green-500" : "text-red-500"
                } flex items-center gap-1`}
            >
                {percentage}%
                {isPositive ? <RiArrowUpLine size={14} /> : <RiArrowDownLine size={14} />}
            </span>
          ) : (
             <span className="text-[#ABBBC2] text-xs">New</span>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-[#ABBBC2] text-sm">{title}</p>
      </div>
    </div>
  );
};

export default StatsCard;
