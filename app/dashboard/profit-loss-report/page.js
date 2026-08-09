'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API;
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`px-6 py-4 border-b border-neutral-100 ${className}`}>{children}</div>;
const CardTitle = ({ children }) => <h3 className="font-semibold text-lg text-neutral-900">{children}</h3>;

export default function ProfitLossReport() {
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    const fetchReportData = async () => {
      try {
        setLoading(true);

        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

        // Fetch sales
        const salesRes = await axios.post(
          `${API_URL}/search-invoice?page=1&limit=1000`,
          {
            keyword: '',
            nameId: false,
            emailId: false,
            phoneId: false,
            product: false,
            startDate: currentMonthStart,
            endDate: currentMonthEnd,
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
            start_date: currentMonthStart,
            end_date: currentMonthEnd,
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
      }
    };

    fetchReportData();
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
  
  // If stock is 0, multiply by 1 (so never multiply by 0)
  const stockMultiplier = stockAvailable === 0 ? 1 : stockAvailable;
  
  // Current profit (normal)
  const currentProfit = (avgSellPrice - avgPurchasePrice) * totalSalesQty;

  // Formula: (ASP - APP) * Stock Available * Sell Qty
  const fullStockProfit = (avgSellPrice - avgPurchasePrice) * stockMultiplier * totalSalesQty;

  const totalStockCount = purchaseData.reduce((count, inv) => {
    // Attempting a rough stock sum if quantities are available, else we count invoices.
    // If we don't have individual product quantities, we can sum an assumed property or leave as length.
    return count + (inv.products?.length || 1);
  }, 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Profit & Loss Report</h1>
        <p className="hidden sm:block text-sm text-neutral-500 mt-1">Monthly financial overview indicating profit, loss, and aggregate values (Converted to BDT).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
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
              {fullStockProfit >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
              <span className="text-xs sm:text-sm font-medium">Full Stock Profit/Loss</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight sm:tracking-normal ${fullStockProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              BDT {fullStockProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
      </div>
    </div>
  );
}
