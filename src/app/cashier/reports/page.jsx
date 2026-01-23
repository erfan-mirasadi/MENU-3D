"use client";
import React, { useState, useEffect } from "react";
import StatsCard from "../analytics/_components/StatsCard"; // reused
import SegmentedControl from "../_components/SegmentedControl";
import { FinancialTable, ProductMixTable, SecurityLogTable } from "./_components/ReportTables";
import { reportService } from "@/services/reportService";
import { RiMoneyDollarCircleLine, RiBankCard2Line, RiDeleteBin5Line, RiWallet3Line, RiDiscountPercentLine, RiFundsBoxLine } from "react-icons/ri";

const ReportsPage = () => {
  const [filter, setFilter] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("financial");

  const [stats, setStats] = useState({
      grossSales: { value: 0, trend: 0 },
      netCash: { value: 0, trend: 0 },
      netCard: { value: 0, trend: 0 },
      voidedValue: { value: 0, trend: 0 },
      extraCharges: { value: 0, trend: 0 },
      discounts: { value: 0, trend: 0 }
  });

  const [financialData, setFinancialData] = useState([]);
  const [productMixData, setProductMixData] = useState([]);
  const [securityData, setSecurityData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, transRes, mixRes, secRes] = await Promise.all([
             reportService.getFinancialStats(filter),
             reportService.getTransactions(filter),
             reportService.getProductMix(filter),
             reportService.getSecurityLog(filter)
        ]);

        setStats(statsRes);
        setFinancialData(transRes);
        setProductMixData(mixRes);
        setSecurityData(secRes);
      } catch (error) {
        console.error("Error loading reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  return (
    <div className="bg-[#1F1D2B] min-h-screen text-white p-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Financial & Security Reports</h1>
          <p className="text-[#ABBBC2] text-sm">Detailed breakdown for {filter}</p>
        </div>
        {/* Tabs replaced DatePicker */}
        <SegmentedControl 
            options={["Today", "Week", "Month", "3 Months", "Year"]} 
            active={filter} 
            onChange={setFilter} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Gross Sales"
          value={`₺${stats.grossSales.value.toLocaleString()}`}
          percentage={stats.grossSales.trend != null ? stats.grossSales.trend.toFixed(1) : null}
          isPositive={stats.grossSales.trend != null && stats.grossSales.trend >= 0}
          icon={RiMoneyDollarCircleLine}
          loading={loading}
        />
        <StatsCard
          title="Net Cash"
          value={`₺${stats.netCash.value.toLocaleString()}`}
          percentage={stats.netCash.trend != null ? stats.netCash.trend.toFixed(1) : null}
          isPositive={stats.netCash.trend != null && stats.netCash.trend >= 0}
          icon={RiWallet3Line}
          loading={loading}
        />
        <StatsCard
          title="Net Card"
          value={`₺${stats.netCard.value.toLocaleString()}`}
          percentage={stats.netCard.trend != null ? stats.netCard.trend.toFixed(1) : null}
          isPositive={stats.netCard.trend != null && stats.netCard.trend >= 0}
          icon={RiBankCard2Line}
          loading={loading}
        />
        <StatsCard
          title="Voided Value"
          value={`₺${stats.voidedValue.value.toLocaleString()}`}
          percentage={stats.voidedValue.trend != null ? stats.voidedValue.trend.toFixed(1) : null}
          isPositive={stats.voidedValue.trend != null && stats.voidedValue.trend <= 0} // Less void is positive
          icon={RiDeleteBin5Line}
          loading={loading}
        />
        <StatsCard
          title="Extra Charges"
          value={`₺${stats.extraCharges.value.toLocaleString()}`}
          percentage={stats.extraCharges.trend != null ? stats.extraCharges.trend.toFixed(1) : null}
          isPositive={stats.extraCharges.trend != null && stats.extraCharges.trend >= 0}
          icon={RiFundsBoxLine}
          loading={loading}
        />
        <StatsCard
          title="Total Discounts"
          value={`₺${stats.discounts.value.toLocaleString()}`}
          percentage={stats.discounts.trend != null ? stats.discounts.trend.toFixed(1) : null}
          isPositive={stats.discounts.trend != null && stats.discounts.trend <= 0} // Less discounts is usually "better" for revenue, but context varies.
          // Let's assume less discount = better for revenue? Or maybe neutral.
          // Usually Discounts are "bad" for revenue, so negative trend (less discount) is Green (Positive).
          icon={RiDiscountPercentLine}
          loading={loading}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
          <SegmentedControl
            options={[
                { label: "Transactional Report", value: "financial" },
                { label: "Product Mix", value: "product" },
                { label: "Security Log", value: "security" }
            ]}
            active={activeTab}
            onChange={setActiveTab}
            className="w-full md:w-fit"
          />
      </div>

      {/* Tables Content */}
      <div className="min-h-[300px]">
          {activeTab === 'financial' && <FinancialTable data={financialData} loading={loading} />}
          {activeTab === 'product' && <ProductMixTable data={productMixData} loading={loading} />}
          {activeTab === 'security' && <SecurityLogTable data={securityData} loading={loading} />}
      </div>

    </div>
  );
};

export default ReportsPage;