'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Calculator, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API;
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`px-6 py-4 border-b border-neutral-100 ${className}`}>{children}</div>;
const CardTitle = ({ children }) => <h3 className="font-semibold text-lg text-neutral-900">{children}</h3>;

export default function ProfitLossReport() {
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

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
        `${API_URL}/search-invoice?page=1&limit=1000`,
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
        `${API_URL}/search-purchase-invoice?page=1&limit=1000`,
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
      toast.error('Failed to load profit/loss report data');
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

  // Aggregate function incorporating currency checks
  const aggregateTotal = (invoices, isPurchase = false) => {
    return invoices.reduce((sum, inv) => {
      const payModeString = inv.pay_mode || '';
      const isAed = payModeString.includes('(AED @');
      
      const totalAmount = inv.sub_total - (inv.discount || 0);

      // if AED, multiply by 34 to show in BDT uniformly
      const bdtAmount = isAed ? totalAmount * 34 : totalAmount;
      return sum + bdtAmount;
    }, 0);
  };

  const totalSalesBdt = aggregateTotal(salesData);
  const totalPurchaseBdt = aggregateTotal(purchaseData, true);

  const totalSalesQty = salesData.reduce((acc, inv) => {
    return acc + (inv.sales_details && inv.sales_details.length > 0
      ? inv.sales_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
      : 0);
  }, 0);

  const totalPurchaseQty = purchaseData.reduce((acc, inv) => {
    return acc + (inv.purchase_details && inv.purchase_details.length > 0
      ? inv.purchase_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
      : 0);
  }, 0);

  const avgSellPrice = totalSalesQty > 0 ? totalSalesBdt / totalSalesQty : 0;
  const avgPurchasePrice = totalPurchaseQty > 0 ? totalPurchaseBdt / totalPurchaseQty : 0;
  const stockAvailable = totalPurchaseQty - totalSalesQty;
  
  // Formula: APP * Stock
  const currentStockPrice = avgPurchasePrice * stockAvailable;

  const currentProfit = (avgSellPrice - avgPurchasePrice) * totalSalesQty;

  const negativeStockValuation = -1 * stockAvailable * avgSellPrice;
  const actualProfit = totalSalesQty > totalPurchaseQty 
    ? (currentProfit < 0 ? currentProfit + negativeStockValuation : currentProfit - negativeStockValuation)
    : currentProfit;

  const totalStockCount = purchaseData.reduce((count, inv) => {
    // Attempting a rough stock sum if quantities are available, else we count invoices.
    // If we don't have individual product quantities, we can sum an assumed property or leave as length.
    return count + (inv.products?.length || 1);
  }, 0);

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Profit & Loss Report</h1>
          <p className="hidden sm:block text-sm text-neutral-500 mt-1">Financial overview indicating profit, loss, and aggregate values (Converted to BDT).</p>
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
          <div className="flex items-end self-stretch sm:self-auto pb-[1px]">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="w-full sm:w-auto h-[38px] px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardContent className="flex flex-col gap-0.5 sm:gap-1 p-4 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500">
              <DollarSign size={16} />
              <span className="text-xs sm:text-sm font-medium">Total Sales</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight sm:tracking-normal">BDT {Number(totalSalesBdt).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Avg: {Number(avgSellPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT / Qty</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col gap-0.5 sm:gap-1 p-4 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500">
              <DollarSign size={16} />
              <span className="text-xs sm:text-sm font-medium">Total Purchase</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight sm:tracking-normal">BDT {Number(totalPurchaseBdt).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Avg: {Number(avgPurchasePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT / Qty</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-0.5 sm:gap-1 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-neutral-500">
              {currentProfit >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
              <span className="text-xs sm:text-sm font-medium">Current Profit/Loss</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight sm:tracking-normal ${currentProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              BDT {currentProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Per Qty: {Number(avgSellPrice - avgPurchasePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-0.5 sm:gap-1 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-neutral-500">
              <DollarSign size={16} />
              <span className="text-sm font-medium">Current Stock Price</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              BDT {currentStockPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-0.5 sm:gap-1 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-neutral-500">
              <Package size={16} />
              <span className="text-xs sm:text-sm font-medium">Stock Available</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight sm:tracking-normal">{(totalPurchaseQty - totalSalesQty).toFixed(3)}</div>
          </CardContent>
        </Card>

        {/* Actual Profit/Loss (Mobile Only) */}
        <Card className="sm:hidden">
          <CardContent className="flex flex-col gap-0.5 sm:gap-1 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-neutral-500">
              {actualProfit >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
              <span className="text-xs sm:text-sm font-medium">Actual Profit/Loss</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight sm:tracking-normal ${actualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              BDT {actualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Table */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Sales Activity</CardTitle>
          </CardHeader>
          <div className="p-0">
            {/* Mobile View */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {salesData.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-500 text-sm">No sales data for this month.</div>
              ) : (
                salesData.map((inv) => {
                  const isAed = (inv.pay_mode || '').includes('(AED @');
                  const conversionRate = 34;
                  const originalAmount = inv.sub_total - (inv.discount || 0);
                  const bdtAmount = isAed ? originalAmount * conversionRate : originalAmount;
                  const qty = inv.sales_details && inv.sales_details.length > 0
                    ? inv.sales_details.reduce((acc, item) => acc + (Number(item.qty) || 0), 0)
                    : '-';
                  
                  return (
                    <div key={inv.id} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/60 transition-colors">
                      <div className="flex flex-col min-w-0 pr-2">
                        <p className="font-semibold text-xs text-neutral-900 truncate">{inv.invoice_id}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</p>
                        <div className="mt-1">
                          <span className="inline-block text-[10px] bg-neutral-100 text-neutral-600 font-medium px-1.5 py-0.5 rounded border border-neutral-200">
                            Qty: {qty !== '-' ? Number(qty).toFixed(3) : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end pl-1">
                        <p className="font-bold text-xs text-emerald-600">{Number(bdtAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</p>
                        {isAed && (
                          <span className="text-[10px] text-neutral-500 font-medium mt-0.5">
                            {Number(originalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {salesData.length > 0 && (
                <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-neutral-900">Total:</span>
                    <div className="text-right">
                      <p className="font-bold text-xs text-emerald-600">{Number(totalSalesBdt).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">Qty: {totalSalesQty > 0 ? totalSalesQty.toFixed(3) : '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Invoice</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-center">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No sales data for this month.</td>
                  </tr>
                ) : (
                  salesData.map((inv) => {
                    const isAed = (inv.pay_mode || '').includes('(AED @');
                    const conversionRate = 34; // Fixed 34 as requested
                    const originalAmount = inv.sub_total - (inv.discount || 0);
                    const bdtAmount = isAed ? originalAmount * conversionRate : originalAmount;
                    const qty = inv.sales_details && inv.sales_details.length > 0
                      ? inv.sales_details.reduce((acc, item) => acc + (Number(item.qty) || 0), 0)
                      : '-';
                    
                    return (
                      <tr key={inv.id} className="hover:bg-neutral-50/50">
                        <td className="px-6 py-4 font-medium text-neutral-900">{inv.invoice_id}</td>
                        <td className="px-6 py-4 text-neutral-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center text-neutral-700">{qty !== '-' ? Number(qty).toFixed(3) : '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">
                          {isAed ? (
                            <div className="flex flex-col items-end">
                              <span className="text-emerald-600">{Number(bdtAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</span>
                              <span className="text-[10px] text-black font-medium mt-0.5">
                                {Number(originalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED (Rate: {conversionRate})
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-600">{Number(bdtAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-neutral-50 border-t border-neutral-200">
                <tr>
                  <td colSpan={2} className="px-6 py-4 font-bold text-neutral-900 text-right">Total:</td>
                  <td className="px-6 py-4 font-bold text-neutral-900 text-center">{totalSalesQty > 0 ? totalSalesQty.toFixed(3) : '-'}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 text-right">{Number(totalSalesBdt).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</td>
                </tr>
              </tfoot>
            </table>
          </div>
          </div>
        </Card>

        {/* Purchase Table */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Purchase Activity</CardTitle>
          </CardHeader>
          <div className="p-0">
            {/* Mobile View */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {purchaseData.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-500 text-sm">No purchase data for this month.</div>
              ) : (
                purchaseData.map((inv) => {
                  const isAed = (inv.pay_mode || '').includes('(AED @');
                  const conversionRate = 34; // Fixed 34 as requested
                  const originalAmount = inv.sub_total - (inv.discount || 0);
                  const bdtAmount = isAed ? originalAmount * conversionRate : originalAmount;
                  const qty = inv.purchase_details && inv.purchase_details.length > 0
                    ? inv.purchase_details.reduce((acc, item) => acc + (Number(item.qty) || 0), 0)
                    : '-';
                  
                  return (
                    <div key={inv.id} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/60 transition-colors">
                      <div className="flex flex-col min-w-0 pr-2">
                        <p className="font-semibold text-xs text-neutral-900 truncate">{inv.invoice_id}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</p>
                        <div className="mt-1">
                          <span className="inline-block text-[10px] bg-neutral-100 text-neutral-600 font-medium px-1.5 py-0.5 rounded border border-neutral-200">
                            Qty: {qty !== '-' ? Number(qty).toFixed(3) : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end pl-1">
                        <p className="font-bold text-xs text-rose-600">{Number(bdtAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</p>
                        {isAed && (
                          <span className="text-[10px] text-neutral-500 font-medium mt-0.5">
                            {Number(originalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {purchaseData.length > 0 && (
                <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-neutral-900">Total:</span>
                    <div className="text-right">
                      <p className="font-bold text-xs text-rose-600">{Number(totalPurchaseBdt).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">Qty: {totalPurchaseQty > 0 ? totalPurchaseQty.toFixed(3) : '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Invoice</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-center">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {purchaseData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No purchase data for this month.</td>
                  </tr>
                ) : (
                  purchaseData.map((inv) => {
                    const isAed = (inv.pay_mode || '').includes('(AED @');
                    const conversionRate = 34; // Fixed 34 as requested
                    const originalAmount = inv.sub_total - (inv.discount || 0);
                    const bdtAmount = isAed ? originalAmount * conversionRate : originalAmount;
                    const qty = inv.purchase_details && inv.purchase_details.length > 0
                      ? inv.purchase_details.reduce((acc, item) => acc + (Number(item.qty) || 0), 0)
                      : '-';
                    
                    return (
                      <tr key={inv.id} className="hover:bg-neutral-50/50">
                        <td className="px-6 py-4 font-medium text-neutral-900">{inv.invoice_id}</td>
                        <td className="px-6 py-4 text-neutral-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center text-neutral-700">{qty !== '-' ? Number(qty).toFixed(3) : '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">
                          {isAed ? (
                            <div className="flex flex-col items-end">
                              <span className="text-rose-600">{Number(bdtAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</span>
                              <span className="text-[10px] text-black font-medium mt-0.5">
                                {Number(originalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED (Rate: {conversionRate})
                              </span>
                            </div>
                          ) : (
                            <span className="text-rose-600">{Number(bdtAmount).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-neutral-50 border-t border-neutral-200">
                <tr>
                  <td colSpan={2} className="px-6 py-4 font-bold text-neutral-900 text-right">Total:</td>
                  <td className="px-6 py-4 font-bold text-neutral-900 text-center">{totalPurchaseQty > 0 ? totalPurchaseQty.toFixed(3) : '-'}</td>
                  <td className="px-6 py-4 font-bold text-rose-600 text-right">{Number(totalPurchaseBdt).toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT</td>
                </tr>
              </tfoot>
            </table>
          </div>
          </div>
        </Card>
      {/* Calculation Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="flex items-center gap-2">
            <Calculator size={18} className="text-neutral-500" />
            Calculation Steps Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-neutral-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">1. Average Sell Price</h4>
              <p className="text-neutral-500 text-xs mb-2">Total Sales BDT ÷ Total Sales Qty</p>
              <code className="bg-white px-3 py-2 rounded-md border border-neutral-200 block text-neutral-700 whitespace-pre-wrap">
                {Number(totalSalesBdt).toLocaleString()} ÷ {totalSalesQty.toFixed(3)} = <span className="font-bold text-neutral-900">{Number(avgSellPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">2. Average Purchase Price</h4>
              <p className="text-neutral-500 text-xs mb-2">Total Purchase BDT ÷ Total Purchase Qty</p>
              <code className="bg-white px-3 py-2 rounded-md border border-neutral-200 block text-neutral-700 whitespace-pre-wrap">
                {Number(totalPurchaseBdt).toLocaleString()} ÷ {totalPurchaseQty.toFixed(3)} = <span className="font-bold text-neutral-900">{Number(avgPurchasePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">3. Current Profit / Loss</h4>
              <p className="text-neutral-500 text-xs mb-2">(Avg Sell Price - Avg Purchase Price) × Total Sales Qty</p>
              <code className="bg-white px-3 py-2 rounded-md border border-neutral-200 block text-neutral-700 whitespace-pre-wrap">
                ({Number(avgSellPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} - {Number(avgPurchasePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}) × {totalSalesQty.toFixed(3)} = <span className={`font-bold ${currentProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Number(currentProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">4. Current Stock Price</h4>
              <p className="text-neutral-500 text-xs mb-2">Avg Purchase Price × Stock Available</p>
              <code className="bg-white px-3 py-2 rounded-md border border-neutral-200 block text-neutral-700 whitespace-pre-wrap">
                {Number(avgPurchasePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} × {(totalPurchaseQty - totalSalesQty).toFixed(3)} = <span className="font-bold text-neutral-900">{Number(currentStockPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">5. Negative Stock Valuation</h4>
              <p className="text-neutral-500 text-xs mb-2">-Stock Available × Avg Sell Price</p>
              <code className="bg-white px-3 py-2 rounded-md border border-neutral-200 block text-neutral-700 whitespace-pre-wrap">
                -{(totalPurchaseQty - totalSalesQty).toFixed(3)} × {Number(avgSellPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} = <span className="font-bold text-rose-600">{Number(-1 * stockAvailable * avgSellPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">6. Actual Profit</h4>
              <p className="text-neutral-500 text-xs mb-2">
                {totalSalesQty > totalPurchaseQty ? (currentProfit < 0 ? 'Current Profit + Negative Stock Valuation' : 'Current Profit - Negative Stock Valuation') : 'Current Profit (Sales Qty ≤ Purchase Qty)'}
              </p>
              <code className="bg-white px-3 py-2 rounded-md border border-neutral-200 block text-neutral-700 whitespace-pre-wrap">
                {totalSalesQty > totalPurchaseQty ? (
                  <>
                    {Number(currentProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} {currentProfit < 0 ? '+' : '-'} {Number(negativeStockValuation).toLocaleString(undefined, { maximumFractionDigits: 0 })} = <span className={`font-bold ${actualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Number(actualProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
                  </>
                ) : (
                  <span className={`font-bold ${actualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Number(actualProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</span>
                )}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
