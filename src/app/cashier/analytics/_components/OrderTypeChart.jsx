"use client";
import React from "react";
import dynamic from "next/dynamic";
import { RiArrowDownSLine } from "react-icons/ri";

// Dynamically import Chart to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const OrderTypeChart = ({ data, loading, filter }) => {
  // Data expected: { "Dine In": 200, "To Go": 122, "Delivery": 264 }
  // Convert to series [Delivery, To Go, Dine In] (matching design visual order if needed)
  // Design has Blue (Delivery), Orange (To Go), Pink (Dine In).
  // Let's assume series array order renders Outer -> Inner (or vice versa).
  // ApexCharts RadialBar default: Series 0 is Outer.
  // So if Delivery is Blue (Outer), To Go (Middle), Dine In (Inner).

  const deliveryCount = data?.["Delivery"] || 0;
  const toGoCount = data?.["To Go"] || 0;
  const dineInCount = data?.["Dine In"] || 0;

  const series = [deliveryCount, toGoCount, dineInCount];
  const labels = ["Delivery", "To Go", "Dine In"];
  const colors = ["#65B0F6", "#FFB572", "#FF7CA3"];

  // Use a small constant if all zero to avoid empty chart glitch or handle separately
  // If all zero, render empty state or 0s.
  const hasData = deliveryCount + toGoCount + dineInCount > 0;

  const options = {
    chart: {
      type: "radialBar",
      background: "transparent",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 15,
          size: "30%",
        },
        track: {
          background: "#252836",
          margin: 10,
        },
        dataLabels: {
          show: false,
        },
      },
    },
    colors: colors,
    labels: labels,
    stroke: {
      lineCap: "round",
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      theme: "dark",
      y: {
        formatter: function (val) {
          return val + " customers";
        },
      },
    },
  };

  return (
    <div className="bg-dark-800 p-6 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-lg font-bold">Most Type of Order</h2>
        <button className="flex items-center gap-2 text-white border border-[#393C49] px-3 py-1.5 rounded-lg text-sm bg-[#1F1D2B]">
          {filter} <RiArrowDownSLine size={14} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-8 flex-1">
        {/* Chart Circle */}
        <div className="relative w-[160px] h-[160px] flex items-center justify-center">
          {loading ? (
            <div className="w-[140px] h-[140px] rounded-full border-8 border-gray-700 border-t-transparent animate-spin"></div>
          ) : hasData ? (
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={220}
              width={220}
              style={{ position: "absolute", top: "-30px", left: "-30px" }}
            />
          ) : (
            <div className="text-[#ABBBC2] text-xs">No Data</div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-[#FF7CA3] mt-1 shadow-[0_0_10px_rgba(255,124,163,0.5)]"></div>
            <div>
              <h4 className="text-white text-sm font-semibold">Dine In</h4>
              <p className="text-[#ABBBC2] text-xs">
                {loading ? "..." : dineInCount} customers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-[#FFB572] mt-1 shadow-[0_0_10px_rgba(255,181,114,0.5)]"></div>
            <div>
              <h4 className="text-white text-sm font-semibold">To Go</h4>
              <p className="text-[#ABBBC2] text-xs">
                {loading ? "..." : toGoCount} customers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-[#65B0F6] mt-1 shadow-[0_0_10px_rgba(101,176,246,0.5)]"></div>
            <div>
              <h4 className="text-white text-sm font-semibold">Delivery</h4>
              <p className="text-[#ABBBC2] text-xs">
                {loading ? "..." : deliveryCount} customers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeChart;
