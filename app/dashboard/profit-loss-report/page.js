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
  
  // Formula: (ASP - APP) * Stock Available * Sell Qty
  const netProfit = (avgSellPrice - avgPurchasePrice) * stockMultiplier * totalSalesQty;

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Profit & Loss Report</h1>
        <p className="text-sm text-neutral-500 mt-1">Monthly financial overview indicating profit, loss, and aggregate values (Converted to BDT).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <DollarSign size={16} />
              <span className="text-sm font-medium">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">BDT {totalSalesBdt.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <DollarSign size={16} />
              <span className="text-sm font-medium">Total Purchase</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">BDT {totalPurchaseBdt.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              {netProfit >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
              <span className="text-sm font-medium">Net Profit / Loss</span>
            </div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              BDT {netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <Package size={16} />
              <span className="text-sm font-medium">Stock Available</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">{(totalPurchaseQty - totalSalesQty).toFixed(3)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Table */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Sales Activity</CardTitle>
          </CardHeader>
          <div className="p-0 overflow-x-auto">
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
        </Card>

        {/* Purchase Table */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Purchase Activity</CardTitle>
          </CardHeader>
          <div className="p-0 overflow-x-auto">
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
        </Card>
      </div>
    </div>
  );
}
