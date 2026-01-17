import React from "react";
import { RiCalendarLine, RiArrowDownSLine } from "react-icons/ri";

const DatePicker = ({ filter, setFilter }) => {
  const options = ["Today", "Week", "Month"];

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 bg-[#1F1D2B] border border-[#393C49] rounded-lg px-4 py-2 cursor-pointer group">
        <RiCalendarLine className="text-[#ABBBC2]" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-transparent text-white text-sm outline-none appearance-none pr-8 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-[#1F1D2B]">
              {opt}
            </option>
          ))}
        </select>
        <RiArrowDownSLine className="absolute right-3 text-[#ABBBC2] pointer-events-none" />
      </div>
    </div>
  );
};

export default DatePicker;
