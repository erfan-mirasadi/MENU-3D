"use client";
import React, { useState, useEffect } from "react";
import StatsCard from "../analytics/_components/StatsCard"; // reused
import SegmentedControl from "../_components/SegmentedControl";
import { FinancialTable, ProductMixTable, SecurityLogTable } from "./_components/ReportTables";
import { reportService } from "@/services/reportService";
import { RiMoneyDollarCircleLine, RiBankCard2Line, RiDeleteBin5Line, RiWallet3Line, RiDiscountPercentLine, RiFundsBoxLine, RiSearchLine } from "react-icons/ri";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const ReportsPage = () => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("financial");
  const [searchQuery, setSearchQuery] = useState("");

  const safeSearch = (text, query) => text?.toString().toLowerCase().includes(query.toLowerCase());

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

  // Filters mapping
  const timeFilters = [
      { label: t('today'), value: "Today" },
      { label: t('week'), value: "Week" },
      { label: t('month'), value: "Month" },
      { label: t('threeMonths'), value: "3 Months" },
      { label: t('year'), value: "Year" },
  ];

  return (
    <div className="bg-[#1F1D2B] min-h-screen text-white p-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('financialReports')}</h1>
          <p className="text-[#ABBBC2] text-sm">{t('detailedBreakdown')} {filter}</p>
        </div>
        
        <div className="flex items-center gap-4">
             <LanguageSwitcher />
             <SegmentedControl 
                options={timeFilters} 
                active={filter} 
                onChange={setFilter} 
             />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title={t('grossSales')}
          value={`${stats.grossSales.value.toLocaleString()}₺`}
          percentage={stats.grossSales.trend != null ? stats.grossSales.trend.toFixed(1) : null}
          isPositive={stats.grossSales.trend != null && stats.grossSales.trend >= 0}
          icon={RiMoneyDollarCircleLine}
          loading={loading}
        />
        <StatsCard
          title={t('netCash')}
          value={`${stats.netCash.value.toLocaleString()}₺`}
          percentage={stats.netCash.trend != null ? stats.netCash.trend.toFixed(1) : null}
          isPositive={stats.netCash.trend != null && stats.netCash.trend >= 0}
          icon={RiWallet3Line}
          loading={loading}
        />
        <StatsCard
          title={t('netCard')}
          value={`${stats.netCard.value.toLocaleString()}₺`}
          percentage={stats.netCard.trend != null ? stats.netCard.trend.toFixed(1) : null}
          isPositive={stats.netCard.trend != null && stats.netCard.trend >= 0}
          icon={RiBankCard2Line}
          loading={loading}
        />
        <StatsCard
          title={t('voidedValue')}
          value={`${stats.voidedValue.value.toLocaleString()}₺`}
          percentage={stats.voidedValue.trend != null ? stats.voidedValue.trend.toFixed(1) : null}
          isPositive={stats.voidedValue.trend != null && stats.voidedValue.trend <= 0} // Less void is positive
          icon={RiDeleteBin5Line}
          loading={loading}
        />
        <StatsCard
          title={t('extraCharges')}
          value={`${stats.extraCharges.value.toLocaleString()}₺`}
          percentage={stats.extraCharges.trend != null ? stats.extraCharges.trend.toFixed(1) : null}
          isPositive={stats.extraCharges.trend != null && stats.extraCharges.trend >= 0}
          icon={RiFundsBoxLine}
          loading={loading}
        />
        <StatsCard
          title={t('totalDiscounts')}
          value={`${stats.discounts.value.toLocaleString()}₺`}
          percentage={stats.discounts.trend != null ? stats.discounts.trend.toFixed(1) : null}
          isPositive={stats.discounts.trend != null && stats.discounts.trend <= 0} // Less discounts is usually "better" for revenue, but context varies.
          // Let's assume less discount = better for revenue? Or maybe neutral.
          // Usually Discounts are "bad" for revenue, so negative trend (less discount) is Green (Positive).
          icon={RiDiscountPercentLine}
          loading={loading}
        />
      </div>

      {/* Tabs & Search */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <SegmentedControl
            options={[
                { label: t('transactionalReport'), value: "financial" },
                { label: t('productMix'), value: "product" },
                { label: t('securityLog'), value: "security" }
            ]}
            active={activeTab}
            onChange={setActiveTab}
            className="w-full md:w-fit"
          />

          {/* Search Input */}
          <div className="relative w-full md:w-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder={t('search') || "Search..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#252836] border border-[#393C49] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#EA7C69] w-full md:w-64"
            />
          </div>
      </div>

      {/* Tables Content */}
      <div className="min-h-[300px]">
          {activeTab === 'financial' && (
            <FinancialTable 
                data={financialData.filter(item => 
                    !searchQuery || 
                    safeSearch(item.billId, searchQuery) ||
                    safeSearch(item.tableNo, searchQuery) ||
                    safeSearch(item.staff, searchQuery) ||
                    safeSearch(item.method, searchQuery) ||
                    safeSearch(item.amount, searchQuery) ||
                    safeSearch(item.time, searchQuery)
                )} 
                loading={loading} 
            />
          )}
          {activeTab === 'product' && (
            <ProductMixTable 
                data={productMixData.filter(item => 
                    !searchQuery || 
                    safeSearch(item.name, searchQuery) ||
                    safeSearch(item.quantity, searchQuery) ||
                    safeSearch(item.revenue, searchQuery)
                )} 
                loading={loading} 
            />
          )}
          {activeTab === 'security' && (
            <SecurityLogTable 
                data={securityData.filter(item => 
                    !searchQuery || 
                    safeSearch(item.staff, searchQuery) ||
                    safeSearch(item.action, searchQuery) ||
                    safeSearch(item.item, searchQuery) ||
                    safeSearch(item.reason, searchQuery) ||
                    safeSearch(item.time, searchQuery) ||
                    safeSearch(item.value, searchQuery)
                )} 
                loading={loading} 
            />
          )}
      </div>

    </div>
  );
};

export default ReportsPage;