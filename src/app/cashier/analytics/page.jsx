"use client";
import React, { useState, useEffect } from "react";
import StatsCard from "./_components/StatsCard";
import OrderReportTable from "./_components/OrderAnalyticsTable";
import MostOrderedList from "./_components/MostOrderedList";
import CategorySalesChart from "./_components/CategorySalesChart";
import HourlyTrafficChart from "./_components/HourlyTrafficChart";
import { RiMoneyDollarCircleLine, RiBookmarkLine, RiGroupLine } from "react-icons/ri";
import { reportService } from "@/services/reportService";
import { analyticsService } from "@/services/analyticsService";

const ReportsPage = () => {
  // Default to Month so user sees data immediately (sample data is from a few days ago)
  const [filter, setFilter] = useState("Today"); 
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
      revenue: { value: 0, trend: 0 },
      dishes: { value: 0, trend: 0 },
      customers: { value: 0, trend: 0 }
  });
  const [orders, setOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [hourlyTraffic, setHourlyTraffic] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, ordersData, topItemsData, categorySalesData, hourlyTrafficData] = await Promise.all([
          reportService.getStats(filter),
          analyticsService.getOrders(filter),
          reportService.getTopSellingItems(filter),
          analyticsService.getCategorySales(filter),
          analyticsService.getHourlyTraffic(filter)
        ]);
        
        setStats(statsData);
        setOrders(ordersData);
        setTopItems(topItemsData);
        setCategorySales(categorySalesData);
        setHourlyTraffic(hourlyTrafficData);
      } catch (error) {
        console.error("Failed to fetch report data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <div className="bg-[#1F1D2B] min-h-screen text-white p-2 overflow-x-hidden pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Analytics</h1>
          <p className="text-[#ABBBC2] text-sm">{new Date().toDateString()}</p>
        </div>
        <div className="flex bg-[#1F1D2B] border border-[#393C49] rounded-lg p-1">
             {["Today", "Week", "Month", "3 Months", "Year"].map(opt => (
                 <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === opt ? 'bg-[#EA7C69] text-white' : 'text-[#ABBBC2] hover:text-white'}`}
                 >
                     {opt}
                 </button>
             ))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left Column (Stats + Order Report) - Spans 2 columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                title="Total Revenue"
                value={`₺${stats.revenue.value.toLocaleString()}`}
                percentage={stats.revenue.trend != null ? stats.revenue.trend.toFixed(2) : null}
                isPositive={stats.revenue.trend != null && stats.revenue.trend >= 0}
                icon={RiMoneyDollarCircleLine}
                loading={loading}
                />
                <StatsCard
                title="Total Dish Ordered"
                value={stats.dishes.value.toLocaleString()}
                percentage={stats.dishes.trend != null ? stats.dishes.trend.toFixed(2) : null}
                isPositive={stats.dishes.trend != null && stats.dishes.trend >= 0}
                icon={RiBookmarkLine}
                loading={loading}
                />
                <StatsCard
                title="Total Customer"
                value={stats.customers.value.toLocaleString()}
                percentage={stats.customers.trend != null ? stats.customers.trend.toFixed(2) : null}
                isPositive={stats.customers.trend != null && stats.customers.trend >= 0}
                icon={RiGroupLine}
                loading={loading}
                />
            </div>

            {/* Order Report Table */}
            <OrderReportTable orders={orders} loading={loading} filter={filter} />
        </div>

        {/* Right Column (Most Ordered + Chart) - Spans 1 column */}
        <div className="flex flex-col gap-6">
            {/* Most Ordered - Top of right column */}
            <MostOrderedList items={topItems} loading={loading} filter={filter} />
            <CategorySalesChart data={categorySales} loading={loading} filter={filter} />
        </div>
      </div>
      
       {/* Hourly Peak Widget - Bottom Full Width or separate row */}
       <div className="grid grid-cols-1 gap-6">
          <HourlyTrafficChart data={hourlyTraffic} loading={loading} />
       </div>
    </div>
  );
};

export default ReportsPage;
