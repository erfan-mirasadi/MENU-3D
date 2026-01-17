"use client";
import React, { useState, useEffect } from "react";
import StatsCard from "../analytics/_components/StatsCard"; // reused
import DatePicker from "./_components/DatePicker";
import { FinancialTable, ProductMixTable, SecurityLogTable } from "./_components/ReportTables";
import { reportService } from "@/services/reportService";
import { RiMoneyDollarCircleLine, RiBankCardLine, RiShieldKeyholeLine, RiBillLine } from "react-icons/ri";

const ReportsPage = () => {
  const [filter, setFilter] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("financial");

  const [stats, setStats] = useState({
      grossSales: { value: 0, trend: 0 },
      netCash: { value: 0, trend: 0 },
      netCard: { value: 0, trend: 0 },
      voidedValue: { value: 0, trend: 0 }
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
        <DatePicker filter={filter} setFilter={setFilter} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          icon={RiBillLine}
          loading={loading}
        />
        <StatsCard
          title="Net Card"
          value={`₺${stats.netCard.value.toLocaleString()}`}
          percentage={stats.netCard.trend != null ? stats.netCard.trend.toFixed(1) : null}
          isPositive={stats.netCard.trend != null && stats.netCard.trend >= 0}
          icon={RiBankCardLine}
          loading={loading}
        />
        <StatsCard
          title="Voided Value"
          value={`₺${stats.voidedValue.value.toLocaleString()}`}
          percentage={stats.voidedValue.trend != null ? stats.voidedValue.trend.toFixed(1) : null}
          isPositive={stats.voidedValue.trend != null && stats.voidedValue.trend <= 0} // Less void is positive
          icon={RiShieldKeyholeLine}
          loading={loading}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#393C49] mb-6">
          <button 
            onClick={() => setActiveTab("financial")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'financial' ? 'text-[#EA7C69]' : 'text-[#ABBBC2] hover:text-white'}`}
          >
              Transactional Report
              {activeTab === 'financial' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EA7C69] rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab("product")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'product' ? 'text-[#EA7C69]' : 'text-[#ABBBC2] hover:text-white'}`}
          >
              Product Mix
              {activeTab === 'product' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EA7C69] rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'security' ? 'text-[#EA7C69]' : 'text-[#ABBBC2] hover:text-white'}`}
          >
              Security Log
              {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EA7C69] rounded-t-full"></div>}
          </button>
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