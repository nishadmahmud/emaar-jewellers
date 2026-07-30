'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, TrendingUp, TrendingDown, Gem, Wallet, Store, Loader2, ArrowUpRight, ArrowDownRight, ShoppingCart, ArrowDownToLine } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import useSWR from 'swr';
import Link from 'next/link';
import FinancialOverviewModal from '@/components/dashboard/FinancialOverviewModal';

const formatNumber = (num, decimals = 3) => {
  if (num === null || num === undefined) return '';
  if (num === 0) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowOnly - dateOnly) / (1000 * 60 * 60 * 24));

    let ago;
    if (diffDays === 0) ago = "Today";
    else if (diffDays === 1) ago = "Yesterday";
    else ago = `${diffDays} days ago`;

    return {
      date: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      ago,
    };
  } catch {
    return { date: "N/A", ago: "" };
  }
};

const calculatePayment = (inv) => {
  const sub = Number(inv?.sub_total || 0);
  const vat = Number(inv?.vat || 0);
  const tax = Number(inv?.tax || 0);
  const del = Number(inv?.delivery_fee || 0);
  const disc = Number(inv?.discount || 0);
  const total = sub + vat + tax + del - disc;
  
  const paid = Number(inv?.paid_amount || 0);
  const rawChange = inv?.cash_change;
  const hasChange = rawChange !== null && rawChange !== undefined && rawChange !== "" && Number(rawChange) > 0;
  const change = hasChange ? Number(rawChange) : 0;

  let due = Math.max(total - paid, 0);
  let changeAmount = 0;

  if (change > 0) {
    due = 0;
    changeAmount = change;
  }

  return { total, due, changeAmount };
};

const getDueStatus = (due) => {
  if (due > 0) return { label: `${due.toLocaleString()} AED`, color: "bg-red-100 text-red-800" };
  if (due < 0) return { label: `${Math.abs(due).toLocaleString()} AED`, color: "bg-blue-100 text-blue-800" };
  return { label: "Paid", color: "bg-green-100 text-green-800" };
};

const RecentInvoiceTable = ({ title, invoices, type, loading }) => {
  const isSelling = type === "selling";
  const viewAllLink = isSelling ? "/dashboard/sell" : "/dashboard/purchase";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200/80 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-3.5 sm:px-6 sm:py-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500">Latest {isSelling ? "sales" : "purchase"} transactions</p>
        </div>
        <Link href={viewAllLink} className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700">
          View All &rarr;
        </Link>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="py-10 text-center text-neutral-500">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-xs">Loading records...</p>
          </div>
        ) : (!invoices || invoices.length === 0) ? (
          <div className="py-10 text-center text-neutral-500 text-sm">
            No records found.
          </div>
        ) : (
          <>
            {/* Mobile Card List (No horizontal scroll) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {invoices.slice(0, 7).map((invoice) => {
                const dateInfo = formatDate(invoice.created_at);
                const customerName = isSelling ? invoice.customer_name : invoice.vendor_name;

                let amountDisplay, dueBadge;

                if (isSelling) {
                  const { total, due, changeAmount } = calculatePayment(invoice);
                  amountDisplay = `AED ${total.toLocaleString()}`;
                  
                  dueBadge = changeAmount > 0 ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                      Change AED {changeAmount.toLocaleString()}
                    </span>
                  ) : due > 0 ? (
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                      Due AED {due.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                      Paid
                    </span>
                  );
                } else {
                  const dueAmount = Number.parseFloat(invoice.sub_total || 0) - Number.parseFloat(invoice.paid_amount || 0);
                  const status = getDueStatus(dueAmount);
                  amountDisplay = `AED ${Number(invoice.sub_total || 0).toLocaleString()}`;
                  dueBadge = (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  );
                }

                return (
                  <div key={invoice.id} className="px-2.5 py-3 flex items-center justify-between hover:bg-neutral-50/60 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 pr-1.5 flex-1">
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isSelling ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {isSelling ? <ShoppingCart size={15} /> : <ArrowDownToLine size={15} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-neutral-900 truncate">{invoice.invoice_id}</p>
                        <p className="text-xs text-neutral-600 truncate">{customerName || "N/A"}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{dateInfo.date} • {dateInfo.ago}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5 pl-1">
                      <p className="font-bold text-xs text-neutral-900">{amountDisplay}</p>
                      <div>{dueBadge}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50/70 text-neutral-500 font-bold border-b border-neutral-100">
                  <tr>
                    <th className="py-2.5 px-5 font-semibold text-xs">Name</th>
                    <th className="py-2.5 px-5 font-semibold text-xs">Amount</th>
                    <th className="py-2.5 px-5 font-semibold text-xs">Status / Due</th>
                    <th className="py-2.5 px-5 font-semibold text-xs">Date/Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {invoices.slice(0, 7).map((invoice) => {
                    const dateInfo = formatDate(invoice.created_at);
                    const customerName = isSelling ? invoice.customer_name : invoice.vendor_name;

                    let amountDisplay, dueBadge;

                    if (isSelling) {
                      const { total, due, changeAmount } = calculatePayment(invoice);
                      amountDisplay = `AED ${total.toLocaleString()}`;
                      
                      dueBadge = changeAmount > 0 ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                          Change AED {changeAmount.toLocaleString()}
                        </span>
                      ) : due > 0 ? (
                        <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-2 py-0.5 rounded-full">
                          Due AED {due.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                          Paid
                        </span>
                      );
                    } else {
                      const dueAmount = Number.parseFloat(invoice.sub_total || 0) - Number.parseFloat(invoice.paid_amount || 0);
                      const status = getDueStatus(dueAmount);
                      amountDisplay = `AED ${Number(invoice.sub_total || 0).toLocaleString()}`;
                      dueBadge = (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      );
                    }

                    return (
                      <tr key={invoice.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3 px-5">
                          <div>
                            <p className="font-medium text-neutral-900">{invoice.invoice_id}</p>
                            <p className="text-xs text-neutral-500">{customerName || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-5 font-semibold text-neutral-900">{amountDisplay}</td>
                        <td className="py-3 px-5">{dueBadge}</td>
                        <td className="py-3 px-5">
                          <div>
                            <p className="text-neutral-900">{dateInfo.date}</p>
                            <p className="text-[11px] text-neutral-400">{dateInfo.ago}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


const DueListTable = ({ title, data, type, loading }) => {
  const rawRows = Array.isArray(data?.data) ? data.data : [];

  // Group & merge rows by customer/vendor name
  const rows = useMemo(() => {
    const map = new Map();
    rawRows.forEach((r) => {
      const nameKey = (r.name || 'Unknown').trim().toLowerCase();
      if (!map.has(nameKey)) {
        map.set(nameKey, {
          name: r.name || 'N/A',
          invoice_id: r.invoice_id || 'N/A',
          invoices: r.invoice_id ? [r.invoice_id] : [],
          total_amount: Number(r.total_amount || 0),
          paid_amount: Number(r.paid_amount || 0),
          due: Number(r.due || 0),
          customer_id: r.customer_id,
          vendor_id: r.vendor_id,
        });
      } else {
        const existing = map.get(nameKey);
        if (r.invoice_id && !existing.invoices.includes(r.invoice_id)) {
          existing.invoices.push(r.invoice_id);
        }
        existing.total_amount += Number(r.total_amount || 0);
        existing.paid_amount += Number(r.paid_amount || 0);
        existing.due += Number(r.due || 0);
      }
    });

    return Array.from(map.values()).map(item => ({
      ...item,
      invoice_id: item.invoices.length > 1 ? `${item.invoices.length} Invoices (${item.invoices[0]})` : item.invoice_id
    }));
  }, [rawRows]);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200/80 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-3.5 sm:px-6 sm:py-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500">Latest {type} due records (last 90 days)</p>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="py-10 text-center text-neutral-500">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-xs">Loading records...</p>
          </div>
        ) : (!rows || rows.length === 0) ? (
          <div className="py-10 text-center text-neutral-500 text-sm">
            No records found.
          </div>
        ) : (
          <>
            {/* Mobile Card List (No horizontal scroll) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {rows.slice(0, 7).map((r, i) => {
                const targetUrl = type === 'customer'
                  ? (r.customer_id ? `/dashboard/customers/${r.customer_id}?interval=daily` : '/dashboard/customers')
                  : (r.vendor_id ? `/dashboard/vendors` : '/dashboard/vendors');
                return (
                  <Link key={i} href={targetUrl} className="block group">
                    <div className="px-2.5 py-3 flex items-center justify-between group-hover:bg-neutral-50/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 min-w-0 pr-1.5 flex-1">
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 shrink-0 flex items-center justify-center font-bold text-xs">
                          {r.name ? r.name.charAt(0).toUpperCase() : <Users size={15} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-neutral-900 group-hover:text-blue-600 transition-colors truncate">{r.name || "N/A"}</p>
                          <p className="text-[11px] text-neutral-500 font-mono truncate">{r.invoice_id}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                            Paid: AED {formatNumber(r.paid_amount, 2)} / Total: AED {formatNumber(r.total_amount, 2)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-1">
                        <p className="text-[10px] text-neutral-400 font-medium">Due</p>
                        <p className="font-bold text-xs text-rose-600">AED {formatNumber(r.due, 2)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50/70 text-neutral-500 font-bold border-b border-neutral-100">
                  <tr>
                    <th className="py-2.5 px-5 font-semibold text-xs">Invoice</th>
                    <th className="py-2.5 px-5 font-semibold text-xs">Name</th>
                    <th className="py-2.5 px-5 font-semibold text-xs text-right">Total Amount</th>
                    <th className="py-2.5 px-5 font-semibold text-xs text-right">Paid Amount</th>
                    <th className="py-2.5 px-5 font-semibold text-xs text-right text-rose-600">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {rows.slice(0, 7).map((r, i) => {
                    const targetUrl = type === 'customer'
                      ? (r.customer_id ? `/dashboard/customers/${r.customer_id}?interval=daily` : '/dashboard/customers')
                      : (r.vendor_id ? `/dashboard/vendors` : '/dashboard/vendors');
                    return (
                      <tr key={i} className="hover:bg-neutral-50/80 transition-colors cursor-pointer group" onClick={() => window.location.href = targetUrl}>
                        <td className="py-3 px-5 font-medium text-neutral-900">{r.invoice_id}</td>
                        <td className="py-3 px-5 text-neutral-700 group-hover:text-blue-600 font-medium transition-colors">{r.name}</td>
                        <td className="py-3 px-5 text-right font-medium">AED {formatNumber(r.total_amount, 2)}</td>
                        <td className="py-3 px-5 text-right font-medium">AED {formatNumber(r.paid_amount, 2)}</td>
                        <td className="py-3 px-5 text-right font-bold text-rose-600">AED {formatNumber(r.due, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


function StatCard({ title, value, currency, trend, trendText, icon, color, textColor, link }) {
  const parseTrend = (trendValue) => {
    if (trendValue === undefined || trendValue === null || trendValue === '') return null;
    if (typeof trendValue === "string") {
      const parsed = Number.parseFloat(trendValue.replace("%", ""));
      return isNaN(parsed) ? null : parsed;
    }
    return typeof trendValue === 'number' ? trendValue : null;
  };

  const trendNumeric = parseTrend(trend);
  const isPositive = trendNumeric !== null && trendNumeric >= 0;

  const content = (
    <div className={`${color} rounded-lg p-3.5 md:p-4 shadow-sm hover:shadow transition-all flex flex-col justify-between h-full border border-neutral-200/80`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-500 truncate">{title}</p>
          <p className={`text-lg md:text-xl font-bold ${textColor} mt-1 tracking-tight truncate`}>
            {typeof value === 'number' ? formatNumber(value, 2) : (value || 0)}
          </p>
          {currency && <p className="text-[11px] font-medium text-neutral-400 mt-0.5">{currency}</p>}
        </div>
        <span className="text-lg md:text-xl select-none ml-2 shrink-0 opacity-85">{icon}</span>
      </div>

      {trendNumeric !== null && (
        <div className="flex items-center mt-2.5 pt-2 border-t border-neutral-200/50 text-[11px]">
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span className={`ml-0.5 font-semibold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {Math.abs(trendNumeric).toFixed(0)}%
          </span>
          {trendText && (
            <span className="text-neutral-400 ml-1 truncate">{trendText}</span>
          )}
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link href={link} className="block h-full group">{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [interval, setInterval] = useState('daily');
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(res => res.data);

  const { data: dashboardData, isLoading: loading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API}/web-dashboard?interval=${interval}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  );

  const { data: salesData, isLoading: salesLoading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API}/invoice-list?page=1&limit=10` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const { data: purchasesData, isLoading: purchasesLoading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API}/purchase-invoice-list?page=1&limit=10` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const postFetcher = useMemo(() => ([url, body]) => axios.post(url, body, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(res => res.data), [session?.accessToken]);
  const dueListDates = useMemo(() => {
    const now = new Date();
    const past = new Date();
    past.setDate(past.getDate() - 30);
    return { 
      start_date: past.toISOString().split('T')[0], 
      end_date: now.toISOString().split('T')[0] 
    };
  }, []);

  const customerDueKey = useMemo(() => session?.accessToken ? [`${process.env.NEXT_PUBLIC_API}/date-wise-due-list`, { 
    start_date: dueListDates.start_date, 
    end_date: dueListDates.end_date, 
    due: 'customer' 
  }] : null, [session?.accessToken, dueListDates]);

  const vendorDueKey = useMemo(() => session?.accessToken ? [`${process.env.NEXT_PUBLIC_API}/date-wise-due-list`, { 
    start_date: dueListDates.start_date, 
    end_date: dueListDates.end_date, 
    due: 'vendor' 
  }] : null, [session?.accessToken, dueListDates]);

  const { data: customerDueData, isLoading: customerDueLoading } = useSWR(
    customerDueKey,
    postFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: vendorDueData, isLoading: vendorDueLoading } = useSWR(
    vendorDueKey,
    postFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const dash = dashboardData?.data || dashboardData || {};

  const mainMetrics = [
    {
      title: "Total Sales",
      value: dash.sales || 0,
      currency: "AED",
      trend: dash.sales_change !== undefined ? dash.sales_change : "0%",
      trendText: dash.sales_report || "less than last day",
      icon: "📊",
      color: "bg-blue-50/40 border-blue-100/60",
      textColor: "text-blue-900",
      link: "/dashboard/sales",
    },
    {
      title: "Stock Balance",
      value: dash.total_accessories_stock_value || 0,
      currency: "AED",
      icon: "💎",
      color: "bg-cyan-50/40 border-cyan-100/60",
      textColor: "text-cyan-900",
    },
    {
      title: "Current Stock",
      value: dash.total_accessories_stock || 0,
      icon: "🎧",
      color: "bg-teal-50/40 border-teal-100/60",
      textColor: "text-teal-900",
    },
    {
      title: "Total Purchase",
      value: dash.purchase || 0,
      currency: "AED",
      trend: dash.purchase_percentage,
      icon: "🛒",
      color: "bg-amber-50/40 border-amber-100/60",
      textColor: "text-amber-900",
      link: "/dashboard/purchases",
    },
  ];

  return (
    <div className="space-y-4 text-black">
      {/* Financial Overview Button & Interval Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsFinancialModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg font-medium text-xs shadow-sm cursor-pointer transition-all"
        >
          <TrendingUp size={14} />
          <span>Financial Overview</span>
        </button>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200 shadow-sm">
          {[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setInterval(item.value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                interval === item.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center h-40 border border-neutral-200 rounded-lg bg-white shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Main 4 KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {mainMetrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>
        </div>
      )}

      {/* Main Multi-Table Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-8">
        <RecentInvoiceTable 
          title="Recent Purchase Invoice" 
          invoices={purchasesData?.data?.data || purchasesData?.purchase_invoice} 
          type="purchase" 
          loading={purchasesLoading}
        />
        <RecentInvoiceTable 
          title="Recent Selling Invoice" 
          invoices={salesData?.data?.data || salesData?.data} 
          type="selling" 
          loading={salesLoading}
        />
      </div>

      {/* Due List Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        <DueListTable 
          title="Customer Due List" 
          data={customerDueData} 
          type="customer" 
          loading={customerDueLoading}
        />
        <DueListTable 
          title="Vendor Due List" 
          data={vendorDueData} 
          type="vendor" 
          loading={vendorDueLoading}
        />
      </div>

      {/* Financial Overview Modal */}
      <FinancialOverviewModal
        open={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />
    </div>
  );
}
