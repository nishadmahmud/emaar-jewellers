'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Loader2, Search, Printer, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API;
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`px-6 py-4 border-b border-neutral-100 ${className}`}>{children}</div>;
const CardTitle = ({ children }) => <h3 className="font-semibold text-lg text-neutral-900">{children}</h3>;

export default function DailyProfitLossReport() {
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { data: session } = useSession();

  const todayStart = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  const todayEnd = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };

  const [startDate, setStartDate] = useState(todayStart());
  const [endDate, setEndDate] = useState(todayEnd());

  const fetchReportData = async () => {
    const token = session?.accessToken;
    if (!token) return;

    try {
      setLoading(true);

      // Fetch sales
      const salesRes = await axios.post(
        `${API_URL}/search-invoice?page=1&limit=5000`,
        {
          keyword: '',
          nameId: false,
          emailId: false,
          phoneId: false,
          product: false,
          startDate: startDate,
          endDate: endDate,
          dueOnly: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch purchases
      const purchaseRes = await axios.post(
        `${API_URL}/search-purchase-invoice?page=1&limit=5000`,
        {
          keyword: '',
          nameId: false,
          emailId: false,
          phoneId: false,
          imei: false,
          start_date: startDate,
          end_date: endDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSalesData(salesRes.data?.data?.data || []);
      setPurchaseData(purchaseRes.data?.data?.data || []);

    } catch (err) {
      toast.error('Failed to load daily profit/loss report data');
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const aggregateTotal = (invoices) => {
    return invoices.reduce((sum, inv) => {
      const payModeString = inv.pay_mode || '';
      const isAed = payModeString.includes('(AED @');
      const totalAmount = inv.sub_total - (inv.discount || 0);
      const bdtAmount = isAed ? totalAmount * 34 : totalAmount;
      return sum + bdtAmount;
    }, 0);
  };

  const generateDateRange = (start, end) => {
    if (!start || !end) return [];
    const dates = [];
    let current = new Date(start.substring(0, 10)); // parsed as UTC midnight
    const last = new Date(end.substring(0, 10));

    while (current <= last) {
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, '0');
      const day = String(current.getUTCDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  };

  const dateList = generateDateRange(startDate, endDate);

  const dailyData = dateList.map(dateStr => {
    const daySales = salesData.filter(inv => inv.created_at?.substring(0, 10) === dateStr);
    const dayPurchases = purchaseData.filter(inv => inv.created_at?.substring(0, 10) === dateStr);

    const totalSalesBdt = aggregateTotal(daySales);
    const totalPurchaseBdt = aggregateTotal(dayPurchases);

    const totalSalesQty = daySales.reduce((acc, inv) => {
      return acc + (inv.sales_details && inv.sales_details.length > 0
        ? inv.sales_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
        : 0);
    }, 0);

    const totalPurchaseQty = dayPurchases.reduce((acc, inv) => {
      return acc + (inv.purchase_details && inv.purchase_details.length > 0
        ? inv.purchase_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
        : 0);
    }, 0);

    const avgSellPrice = totalSalesQty > 0 ? totalSalesBdt / totalSalesQty : 0;
    const avgPurchasePrice = totalPurchaseQty > 0 ? totalPurchaseBdt / totalPurchaseQty : 0;
    
    const stockAvailable = totalPurchaseQty - totalSalesQty;
    const currentProfit = (avgSellPrice - avgPurchasePrice) * totalSalesQty;
    
    const negativeStockValuation = -1 * stockAvailable * avgSellPrice;
    
    const actualProfit = totalSalesQty > totalPurchaseQty 
      ? (currentProfit < 0 ? currentProfit + negativeStockValuation : currentProfit - negativeStockValuation)
      : currentProfit;

    return {
      date: dateStr,
      totalSalesQty,
      totalSalesBdt,
      totalPurchaseQty,
      totalPurchaseBdt,
      avgSellPrice,
      avgPurchasePrice,
      currentProfit,
      actualProfit
    };
  });

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Daily Profit & Loss History</h1>
          <p className="hidden sm:block text-sm text-neutral-500 mt-1">Daily breakdown of profit and loss metrics.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate ? startDate.slice(0, 10) : ''}
              onChange={(e) => setStartDate(e.target.value ? `${e.target.value}T00:00:00.000Z` : "")}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate ? endDate.slice(0, 10) : ''}
              onChange={(e) => setEndDate(e.target.value ? `${e.target.value}T23:59:59.999Z` : "")}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-end self-stretch sm:self-auto pb-[1px] gap-2">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="w-full sm:w-auto h-[38px] px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto h-[38px] px-4 bg-white border border-neutral-200 text-black text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-black text-center mb-2">EMAAR Jewellers</h1>
        <h2 className="text-lg font-semibold text-center text-neutral-800">Daily Profit & Loss History</h2>
        <p className="text-sm text-center text-neutral-500 mt-1">
          {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between print:hidden">
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} className="text-neutral-500" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-medium text-center">Sales Qty</th>
                <th className="px-6 py-4 font-medium text-right">Total Sales</th>
                <th className="px-6 py-4 font-medium text-center">Purchase Qty</th>
                <th className="px-6 py-4 font-medium text-right">Total Purchase</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Current Profit</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap text-emerald-700 bg-emerald-50/50">Actual Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {dailyData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">No data found for this date range.</td>
                </tr>
              ) : (
                dailyData.map((day, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap">{new Date(day.date + 'T00:00:00').toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center text-neutral-700">{day.totalSalesQty > 0 ? day.totalSalesQty.toFixed(3) : '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-700">
                      {day.totalSalesBdt > 0 ? `${Number(day.totalSalesBdt).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-700">{day.totalPurchaseQty > 0 ? day.totalPurchaseQty.toFixed(3) : '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-700">
                      {day.totalPurchaseBdt > 0 ? `${Number(day.totalPurchaseBdt).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={day.currentProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {Number(day.currentProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold bg-emerald-50/30">
                      <span className={day.actualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {Number(day.actualProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {dailyData.length > 0 && (
              <tfoot className="bg-neutral-50 border-t border-neutral-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-neutral-900">Total</td>
                  <td className="px-6 py-4 font-bold text-center text-neutral-900">
                    {dailyData.reduce((sum, d) => sum + d.totalSalesQty, 0).toFixed(3)}
                  </td>
                  <td className="px-6 py-4 font-bold text-right text-neutral-900">
                    {Number(dailyData.reduce((sum, d) => sum + d.totalSalesBdt, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT
                  </td>
                  <td className="px-6 py-4 font-bold text-center text-neutral-900">
                    {dailyData.reduce((sum, d) => sum + d.totalPurchaseQty, 0).toFixed(3)}
                  </td>
                  <td className="px-6 py-4 font-bold text-right text-neutral-900">
                    {Number(dailyData.reduce((sum, d) => sum + d.totalPurchaseBdt, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT
                  </td>
                  <td className="px-6 py-4 font-bold text-right">
                    {(() => {
                      const totalCurrentProfit = dailyData.reduce((sum, d) => sum + d.currentProfit, 0);
                      return (
                        <span className={totalCurrentProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {Number(totalCurrentProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 font-bold text-right bg-emerald-50/50">
                    {(() => {
                      const totalActualProfit = dailyData.reduce((sum, d) => sum + d.actualProfit, 0);
                      return (
                        <span className={totalActualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {Number(totalActualProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
