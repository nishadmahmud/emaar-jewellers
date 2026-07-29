'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, TrendingUp, TrendingDown, Gem, Wallet, Store, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import useSWR from 'swr';
import Link from 'next/link';

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
  if (due > 0) return { label: `${due.toLocaleString()} BDT`, color: "bg-red-100 text-red-800" };
  if (due < 0) return { label: `${Math.abs(due).toLocaleString()} BDT`, color: "bg-blue-100 text-blue-800" };
  return { label: "Paid", color: "bg-green-100 text-green-800" };
};

const RecentInvoiceTable = ({ title, invoices, type, loading }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500">Latest {type === "selling" ? "sales" : "purchase"} transactions</p>
        </div>
        <Link href={type === "selling" ? "/dashboard/sell" : "/dashboard/purchase"} className="text-sm font-medium text-blue-600 hover:underline">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold border-b border-neutral-100">
            <tr>
              <th className="py-3 px-6 font-semibold">Name</th>
              <th className="py-3 px-6 font-semibold">Amount</th>
              <th className="py-3 px-6 font-semibold">Due</th>
              <th className="py-3 px-6 font-semibold">Date/Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-neutral-500">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-neutral-400" />
                  Loading...
                </td>
              </tr>
            ) : (!invoices || invoices.length === 0) ? (
               <tr>
                <td colSpan={4} className="py-12 text-center text-neutral-500">
                  No records found.
                </td>
              </tr>
            ) : invoices.slice(0, 7).map(invoice => {
              const dateInfo = formatDate(invoice.created_at);
              const customerName = type === "selling" ? invoice.customer_name : invoice.vendor_name;
              
              let amountDisplay, dueBadge;

              if (type === "selling") {
                const { total, due, changeAmount } = calculatePayment(invoice);
                amountDisplay = `${total.toLocaleString()} BDT`;
                
                dueBadge = changeAmount > 0 ? (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 font-semibold px-2 py-1 rounded-full">
                    Change {changeAmount.toLocaleString()} BDT
                  </span>
                ) : due > 0 ? (
                  <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">
                    {due.toLocaleString()} BDT
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
                    Paid
                  </span>
                );
              } else {
                const dueAmount = Number.parseFloat(invoice.sub_total || 0) - Number.parseFloat(invoice.paid_amount || 0);
                const status = getDueStatus(dueAmount);
                amountDisplay = `${Number(invoice.sub_total || 0).toLocaleString()} BDT`;
                dueBadge = (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                );
              }

              return (
                <tr key={invoice.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-6">
                    <div>
                      <p className="font-medium text-neutral-900">{invoice.invoice_id}</p>
                      <p className="text-xs text-neutral-500">{customerName || "N/A"}</p>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <p className="font-semibold text-neutral-900">{amountDisplay}</p>
                  </td>
                  <td className="py-3 px-6">{dueBadge}</td>
                  <td className="py-3 px-6">
                     <div>
                        <p className="text-neutral-900">{dateInfo.date}</p>
                        <p className="text-xs text-neutral-500">{dateInfo.ago}</p>
                      </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const DueListTable = ({ title, data, type, loading }) => {
  const rows = Array.isArray(data?.data) ? data.data : [];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full flex flex-col h-full">
      <div className="flex justify-between items-start p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500">Latest {type} due records (last 90 days)</p>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50/50 text-neutral-500 font-bold border-b border-neutral-100">
            <tr>
              <th className="py-3 px-6 font-semibold">Invoice</th>
              <th className="py-3 px-6 font-semibold">Name</th>
              <th className="py-3 px-6 font-semibold text-right">Total Amount</th>
              <th className="py-3 px-6 font-semibold text-right">Paid Amount</th>
              <th className="py-3 px-6 font-semibold text-right text-red-600">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-neutral-500">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-neutral-400" />
                  Loading...
                </td>
              </tr>
            ) : (!rows || rows.length === 0) ? (
               <tr>
                <td colSpan={5} className="py-12 text-center text-neutral-500">
                  No records found.
                </td>
              </tr>
            ) : rows.slice(0, 7).map((r, i) => (
                <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-6 font-medium text-neutral-900">{r.invoice_id}</td>
                  <td className="py-3 px-6 text-neutral-700">{r.name}</td>
                  <td className="py-3 px-6 text-right font-medium">{formatNumber(r.total_amount, 2)}</td>
                  <td className="py-3 px-6 text-right font-medium">{formatNumber(r.paid_amount, 2)}</td>
                  <td className="py-3 px-6 text-right font-bold text-red-600">{formatNumber(r.due, 2)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(res => res.data);

  const { data: dashboardData, isLoading: loading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API}/web-dashboard?interval=daily` : null,
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

  return (
    <div className="space-y-6 text-black">
      {/* Header Area */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Overview</h2>
          <p className="text-sm text-neutral-500 mt-1">Your business performance at a glance.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-date" className="text-sm font-medium text-neutral-600">Select Date:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-neutral-500" />
            </div>
            <input
              id="dashboard-date"
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-black focus:border-black outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center h-32 border border-neutral-200 rounded-xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
          {/* Card 1: Total Account Balance */}
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-[10px] md:text-xs font-medium uppercase tracking-wider">Total Stock Value</h3>
              <div>
                <p className="text-xl md:text-2xl font-bold text-black flex items-center gap-1">{formatNumber(dashboardData?.data?.total_accessories_stock || 0, 0)}</p>
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <Wallet size={110} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 2: Total Stock Value */}
          <div className="bg-black border border-black p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-[10px] md:text-xs font-medium uppercase tracking-wider">Stock Balance</h3>
              <div>
                <p className="text-xl md:text-2xl font-bold text-white flex items-center gap-1">৳ {formatNumber(dashboardData?.data?.total_accessories_stock_value || 0, 2)}</p>
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
              <Gem size={110} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 3: Total Sell */}
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-[10px] md:text-xs font-medium uppercase tracking-wider">Total Sell (CDT)</h3>
              <div>
                <p className="text-xl md:text-2xl font-bold text-black flex items-center gap-1">৳ {formatNumber(dashboardData?.data?.sales || 0, 2)}</p>
                {dashboardData?.data?.sales_change && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{dashboardData.data.sales_change} {dashboardData.data.sales_report}</p>
                )}
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <TrendingUp size={110} strokeWidth={1.5} />
            </div>
          </div>

          {/* Card 4: Total Purchase */}
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm flex justify-between relative overflow-hidden h-[130px]">
            <div className="z-10 relative flex flex-col justify-between">
              <h3 className="text-neutral-400 text-[10px] md:text-xs font-medium uppercase tracking-wider">Total Purchase (DBT)</h3>
              <div>
                <p className="text-xl md:text-2xl font-bold text-black flex items-center gap-1">৳ {formatNumber(dashboardData?.data?.purchase || 0, 2)}</p>
              </div>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <TrendingDown size={110} strokeWidth={1.5} />
            </div>
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
    </div>
  );
}
