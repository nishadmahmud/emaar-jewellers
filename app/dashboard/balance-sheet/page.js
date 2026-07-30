'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { FileText, Download, Calendar, Loader2, Search, AlertCircle } from 'lucide-react';

const fmtBDT = (n) =>
  Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });

export default function BalanceSheetPage() {
  const { data: session } = useSession();
  const API_URL = process.env.NEXT_PUBLIC_API;

  // Default date range: today
  const getDefaultDates = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = d.toISOString().split('T')[0];
    d.setHours(23, 59, 59, 999);
    const end = d.toISOString().split('T')[0];
    return {
      start_date: start,
      end_date: end,
    };
  };

  const [startDate, setStartDate] = useState(getDefaultDates().start_date);
  const [endDate, setEndDate] = useState(getDefaultDates().end_date);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_URL}/balance-Sheet-report-history`,
        { 
          start_date: startDate ? `${startDate}T00:00:00.000Z` : '', 
          end_date: endDate ? `${endDate}T23:59:59.999Z` : '' 
        },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      setData(res.data);
      setHasFetched(true);
    } catch (err) {
      console.error('Balance sheet fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch balance sheet data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, API_URL, startDate, endDate]);

  // Auto-fetch on mount when session is available
  useEffect(() => {
    if (session?.accessToken && !hasFetched) {
      fetchReport();
    }
  }, [session?.accessToken, fetchReport, hasFetched]);

  // Derived Values
  const totalClosingStock = Number(data?.total_closing_stock_value ?? 0);
  const availableBalances = Array.isArray(data?.available_balance)
    ? data.available_balance
    : [];
  const totalCustomerDue = Number(data?.total_customer_due ?? 0);
  const totalVendor = Number(data?.total_vendor_ ?? 0);

  const availableBalanceTotal = useMemo(
    () =>
      availableBalances.reduce(
        (sum, a) => sum + Number(a?.available_balance ?? 0),
        0
      ),
    [availableBalances]
  );

  // Assets (right side)
  const assetsRows = useMemo(() => {
    const balanceRows = availableBalances.map((a) => ({
      label: a?.type_name || "Unknown",
      amount: Number(a?.available_balance ?? 0),
    }));

    const receivableRow = totalCustomerDue
      ? [{ label: "Customer Due", amount: totalCustomerDue }]
      : [];

    const inventoryRow = totalClosingStock
      ? [{ label: "Inventory (Closing Stock)", amount: totalClosingStock }]
      : [];

    return [
      { label: "Current Assets", isGroup: true },
      ...balanceRows,
      ...receivableRow,
      ...inventoryRow,
    ];
  }, [availableBalances, totalCustomerDue, totalClosingStock]);

  const assetsTotal = useMemo(
    () => availableBalanceTotal + totalCustomerDue + totalClosingStock,
    [availableBalanceTotal, totalCustomerDue, totalClosingStock]
  );

  // Liabilities & Equity (left side)
  const liabilitiesRows = useMemo(() => {
    const paidUpCapital = assetsTotal - totalVendor;
    const vendorRow =
      typeof totalVendor === "number"
        ? [{ label: "Vendor Payable", amount: totalVendor }]
        : [];
    return [{ label: "Paid up Capital", amount: paidUpCapital }, ...vendorRow];
  }, [assetsTotal, totalVendor]);

  const liabilitiesTotal = useMemo(
    () => liabilitiesRows.reduce((sum, r) => sum + Number(r?.amount ?? 0), 0),
    [liabilitiesRows]
  );

  const tableRows = useMemo(() => {
    return Array.from(
      { length: Math.max(liabilitiesRows.length, assetsRows.length) },
      (_, i) => {
        return {
          L: liabilitiesRows[i],
          A: assetsRows[i]
        };
      }
    );
  }, [liabilitiesRows, assetsRows]);

  return (
    <div className="max-w-7xl mx-auto text-black">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold sm:font-medium tracking-wide">Balance Sheet</h2>
        </div>
        <button
          className="flex items-center gap-1.5 bg-black text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm shrink-0"
          onClick={() => window.print()}
        >
          <Download size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Export PDF</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[30%,70%] gap-4 mb-6">
        {/* Left: KPIs */}
        <div className="bg-orange-500 text-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col justify-center">
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-lg sm:text-2xl font-extrabold tabular-nums">{fmtBDT(assetsTotal)} BDT</p>
            <p className="text-xs sm:text-sm font-medium opacity-90">Assets Total (Computed)</p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] sm:text-xs">
            <p className="opacity-90">Available Balance:<br/><span className="font-semibold text-xs sm:text-[13px] tabular-nums opacity-100">{fmtBDT(availableBalanceTotal)} BDT</span></p>
            <p className="opacity-90">Customer Due:<br/><span className="font-semibold text-xs sm:text-[13px] tabular-nums opacity-100">{fmtBDT(totalCustomerDue)} BDT</span></p>
            <p className="opacity-90">Vendor Payable:<br/><span className="font-semibold text-xs sm:text-[13px] tabular-nums opacity-100">{fmtBDT(totalVendor)} BDT</span></p>
            <p className="opacity-90">Closing Stock:<br/><span className="font-semibold text-xs sm:text-[13px] tabular-nums opacity-100">{fmtBDT(totalClosingStock)} BDT</span></p>
          </div>
        </div>

        {/* Right: Date Range Picker */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 sm:p-6 flex items-center">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 w-full">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Start Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-700 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider">
                End Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-700 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                />
              </div>
            </div>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-black text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[38px] sm:h-[42px]"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Report
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="font-semibold text-base sm:text-lg text-neutral-800">Balance Sheet Details</h3>
        </div>
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <Loader2 size={28} className="animate-spin mb-2" />
              <p className="text-xs sm:text-sm">Loading balance sheet data...</p>
            </div>
          ) : !hasFetched ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <FileText size={28} className="mb-2" />
              <p className="text-xs sm:text-sm">Select a date range and generate the report.</p>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <FileText size={28} className="mb-2" />
              <p className="text-xs sm:text-sm">No data found for the selected date range.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Clean Section Cards (No horizontal scroll) */}
              <div className="block sm:hidden p-3 space-y-4">
                {/* Section 1: Liabilities & Equity */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-neutral-100/70 px-3 py-2 border-b border-neutral-200 font-bold text-xs text-neutral-900 flex justify-between">
                    <span>Liabilities & Equity</span>
                    <span>Amount (BDT)</span>
                  </div>
                  <div className="divide-y divide-neutral-100 text-xs">
                    {liabilitiesRows.map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center px-3 py-2.5 hover:bg-neutral-50/50">
                        <span className="text-neutral-700 font-medium">{row.label}</span>
                        <span className="font-semibold text-neutral-900 tabular-nums">{fmtBDT(row.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-neutral-100/80 px-3 py-2.5 border-t border-neutral-200 font-bold text-xs flex justify-between text-neutral-900">
                    <span>Total Liabilities:</span>
                    <span className="tabular-nums">{fmtBDT(liabilitiesTotal)} BDT</span>
                  </div>
                </div>

                {/* Section 2: Assets */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-neutral-100/70 px-3 py-2 border-b border-neutral-200 font-bold text-xs text-neutral-900 flex justify-between">
                    <span>Assets</span>
                    <span>Amount (BDT)</span>
                  </div>
                  <div className="divide-y divide-neutral-100 text-xs">
                    {assetsRows.map((row, idx) => (
                      row.isGroup ? (
                        <div key={idx} className="bg-neutral-50 px-3 py-1.5 font-bold text-[11px] text-neutral-500 uppercase tracking-wider">
                          {row.label}
                        </div>
                      ) : (
                        <div key={idx} className="flex justify-between items-center px-3 py-2.5 hover:bg-neutral-50/50">
                          <span className="text-neutral-700 font-medium">{row.label}</span>
                          <span className="font-semibold text-neutral-900 tabular-nums">{fmtBDT(row.amount)}</span>
                        </div>
                      )
                    ))}
                  </div>
                  <div className="bg-neutral-100/80 px-3 py-2.5 border-t border-neutral-200 font-bold text-xs flex justify-between text-neutral-900">
                    <span>Total Assets:</span>
                    <span className="tabular-nums">{fmtBDT(assetsTotal)} BDT</span>
                  </div>
                </div>
              </div>

              {/* Desktop View: Side by Side Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                  <thead className="bg-neutral-100/50 border-b border-neutral-200">
                    <tr>
                      <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200 w-1/4">Liabilities & Equity</th>
                      <th className="py-3 px-6 font-semibold text-neutral-900 text-right border-r border-neutral-200 w-1/4">Amount (BDT)</th>
                      <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200 w-1/4">Assets</th>
                      <th className="py-3 px-6 font-semibold text-neutral-900 text-right w-1/4">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {tableRows.map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                        {/* Liabilities */}
                        <td className={`py-3 px-6 border-r border-neutral-100 text-neutral-800 ${row.L?.isGroup ? 'font-semibold bg-neutral-50' : ''}`}>
                          {row.L ? row.L.label : ''}
                        </td>
                        <td className={`py-3 px-6 border-r border-neutral-100 text-right tabular-nums ${row.L?.isGroup ? 'bg-neutral-50' : ''}`}>
                          {row.L && !row.L.isGroup ? fmtBDT(row.L.amount) : ''}
                        </td>

                        {/* Assets */}
                        <td className={`py-3 px-6 border-r border-neutral-100 text-neutral-800 ${row.A?.isGroup ? 'font-semibold bg-neutral-50' : ''}`}>
                          {row.A ? row.A.label : ''}
                        </td>
                        <td className={`py-3 px-6 text-right tabular-nums ${row.A?.isGroup ? 'bg-neutral-50' : ''}`}>
                          {row.A && !row.A.isGroup ? fmtBDT(row.A.amount) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-100/80 border-t border-neutral-200 font-bold">
                    <tr>
                      <td className="py-4 px-6 border-r border-neutral-200">Total:</td>
                      <td className="py-4 px-6 border-r border-neutral-200 text-right tabular-nums">{fmtBDT(liabilitiesTotal)}</td>
                      <td className="py-4 px-6 border-r border-neutral-200">Total:</td>
                      <td className="py-4 px-6 text-right tabular-nums">{fmtBDT(assetsTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
