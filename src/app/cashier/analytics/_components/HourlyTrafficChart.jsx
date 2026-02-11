"use client";
import React from "react";
import dynamic from "next/dynamic";
import { RiTimeLine } from "react-icons/ri";
import { useLanguage } from "@/context/LanguageContext";

// Dynamically import Chart to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const HourlyTrafficChart = ({ data, loading, filter }) => {
    const { t } = useLanguage();
    // Data expected: Array of 24 integers (count per hour)
    
    const series = [{
        name: t('orders'),
        data: data
    }];

    const options = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent'
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '60%',
                colors: {
                    ranges: [{
                        from: 0,
                        to: 1000,
                        color: '#EA7C69' // Signature Orange/Red
                    }]
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: Array.from({length: 24}, (_, i) => `${i}:00`),
            labels: {
                style: {
                    colors: '#ABBBC2',
                    fontSize: '10px'
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#ABBBC2'
                }
            }
        },
        grid: {
            borderColor: '#393C49',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function (val) {
                    return val + " " + t('orders')
                }
            }
        }
    };

  return (
    <div className="bg-[#1F1D2B] p-6 rounded-lg w-full">
       <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <RiTimeLine className="text-[#EA7C69]" />
            {t('hourlyTraffic')}
        </h2>
        <span className="text-xs text-[#ABBBC2]">
            {filter === "Today" ? t('today') : `${t('peakHours')} (${filter})`}
        </span>
      </div>

      <div className="w-full h-[250px]">
         {loading ? (
             <div className="w-full h-full flex items-center justify-center">
                 <div className="w-10 h-10 border-4 border-gray-700 border-t-[#EA7C69] rounded-full animate-spin"></div>
             </div>
         ) : (
             <Chart options={options} series={series} type="bar" height="100%" width="100%" />
         )}
      </div>
    </div>
  );
};

export default HourlyTrafficChart;
