"use client";
import React, { useState, useEffect } from "react";
import StatsCard from "./_components/StatsCard";
import OrderReportTable from "./_components/OrderReportTable";
import MostOrderedList from "./_components/MostOrderedList";
import OrderTypeChart from "./_components/OrderTypeChart";
import { RiMoneyDollarCircleLine, RiBookmarkLine, RiGroupLine } from "react-icons/ri";
import { reportService } from "@/services/reportService";

const ReportsPage = () => {
  // Default to Month so user sees data immediately (sample data is from a few days ago)
  const [filter, setFilter] = useState("Month"); 
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
      revenue: { value: 0, trend: 0 },
      dishes: { value: 0, trend: 0 },
      customers: { value: 0, trend: 0 }
  });
  const [orders, setOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [orderTypes, setOrderTypes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, ordersData, topItemsData, orderTypesData] = await Promise.all([
          reportService.getStats(filter),
          reportService.getRecentOrders(filter),
          reportService.getTopSellingItems(filter),
          reportService.getOrderTypes(filter)
        ]);
        
        setStats(statsData);
        setOrders(ordersData);
        setTopItems(topItemsData);
        setOrderTypes(orderTypesData);
      } catch (error) {
        console.error("Failed to fetch report data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <div className="bg-[#1F1D2B] min-h-screen text-white p-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reports</h1>
          <p className="text-[#ABBBC2] text-sm">{new Date().toDateString()}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`₺${stats.revenue.value.toLocaleString()}`}
          percentage={stats.revenue.trend.toFixed(2)}
          isPositive={stats.revenue.trend >= 0}
          icon={RiMoneyDollarCircleLine}
          loading={loading}
        />
        <StatsCard
          title="Total Dish Ordered"
          value={stats.dishes.value.toLocaleString()}
          percentage={stats.dishes.trend.toFixed(2)}
          isPositive={stats.dishes.trend >= 0}
          icon={RiBookmarkLine}
          loading={loading}
        />
        <StatsCard
          title="Total Customer"
          value={stats.customers.value.toLocaleString()}
          percentage={stats.customers.trend.toFixed(2)}
          isPositive={stats.customers.trend >= 0}
          icon={RiGroupLine}
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Order Report) - Spans 2 columns on large screens */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <OrderReportTable orders={orders} loading={loading} filter={filter} />
        </div>

        {/* Right Column (Most Ordered + Chart) - Spans 1 column */}
        <div className="flex flex-col gap-6">
            <MostOrderedList items={topItems} loading={loading} filter={filter} />
            <OrderTypeChart data={orderTypes} loading={loading} filter={filter} />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
