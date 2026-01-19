"use client";
import dynamic from "next/dynamic";

// Dynamically import Chart to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CategorySalesChart = ({ data, loading }) => {
    // Data expected: Array of { name: "Foods", value: 1250.00 }
    
    // Sort by value descending
    const processedData = [...data]
        .sort((a, b) => b.value - a.value);

    // Calculate total from ALL data to get correct percentages
    // Multiply by 1.25 to add a visual "breathing room" so rings are NEVER full circles (max ~80%)
    const totalSales = data.reduce((acc, curr) => acc + curr.value, 0) * 1.25;

    // Extract series (percentages) and labels
    // Guard against divide by zero
    const series = processedData.map(d => totalSales > 0 ? (d.value / totalSales) * 100 : 0);
    const labels = processedData.map(d => d.name);
    
    // Palette
    const colors = ["#65B0F6", "#FFB572", "#FF7CA3", "#50D1AA", "#9290FE"];

    const hasData = series.some(val => val > 0);

  const options = {
    chart: {
      type: "radialBar",
      background: "transparent",
      sparkline: {
        enabled: true,
      }
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
        }
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
            formatter: function (val, { seriesIndex, w }) {
                 // Use the original value from processedData
                 // seriesIndex corresponds to the index in processedData
                 const originalValue = processedData[seriesIndex] ? processedData[seriesIndex].value : 0;
                return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(originalValue);
            }
        }
    }
  };

  return (
    <div className="bg-[#1F1D2B] p-6 rounded-lg flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-white text-lg font-bold">Sales by Category</h2>
      </div>

      <div className="flex items-center justify-center gap-8 flex-1">
         {/* Chart Circle */}
         <div className="relative w-[160px] h-[160px] flex items-center justify-center">
            {loading ? (
                <div className="w-[140px] h-[140px] rounded-full border-8 border-gray-700 border-t-transparent animate-spin"></div>
            ) : hasData ? (
                 <Chart options={options} series={series} type="radialBar" height={220} width={220} style={{ position: 'absolute', top: '-30px', left: '-30px' }} />
            ) : (
                <div className="text-[#ABBBC2] text-xs">No Data</div>
            )}
         </div>

         {/* Legend */}
         <div className="flex flex-col gap-4">
            {processedData.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                    <div 
                        className="w-3 h-3 rounded-full mt-1" 
                        style={{ 
                            backgroundColor: colors[index % colors.length],
                            boxShadow: `0 0 10px ${colors[index % colors.length]}80`
                        }}
                    ></div>
                    <div>
                        <h4 className="text-white text-sm font-semibold">{item.name}</h4>
                        <p className="text-[#ABBBC2] text-xs">
                            {loading ? "..." : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.value)}
                        </p>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default CategorySalesChart;
