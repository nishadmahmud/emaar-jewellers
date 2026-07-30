'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Landmark,
  Package,
  UserX,
  Store,
  Wallet,
  Coins,
  Building2,
  Receipt,
  Scale,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import useSWR from 'swr';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import FinancialOverviewPDF from './financial-overview-pdf';

const fmt = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Shimmer placeholder matching CMS Skeleton pattern
const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
);

export default function FinancialOverviewModal({ open, onClose, dashboardData }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API = process.env.NEXT_PUBLIC_API;
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // --- SWR fetchers ---
  const getFetcher = useMemo(
    () => (url) =>
      axios
        .get(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.data),
    [token]
  );
  const postFetcher = useMemo(
    () => ([url, body]) =>
      axios
        .post(url, body, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.data),
    [token]
  );

  const swrOpts = { dedupingInterval: 120000, revalidateOnFocus: false };
  const canFetch = open && !!token;

  // Current Month Date Range for Expense Report (1st of month to today)
  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return {
      start_date: start.toISOString(),
      end_date: now.toISOString(),
      displayStr: `${start.toLocaleDateString()} - ${now.toLocaleDateString()}`,
    };
  }, []);

  // --- 1. Quick Payment List & Categories (Investment, Fixed Asset) ---
  const { data: qpListRes, isLoading: qpLoading } = useSWR(
    canFetch ? `${API}/get-payment-expense` : null,
    getFetcher,
    swrOpts
  );
  const { data: qpTypesRes } = useSWR(
    canFetch ? `${API}/get-payment-expense-type-list` : null,
    getFetcher,
    swrOpts
  );

  const { investment, fixedAsset } = useMemo(() => {
    const list = qpListRes?.data?.data || [];
    const types = qpTypesRes?.data || [];

    let invSum = 0;
    let assetSum = 0;

    list.forEach((item) => {
      const amount = Number(item?.amount || 0);
      let catType = (item?.transaction_category || '').toLowerCase();

      if (!catType) {
        const matchedType = types.find(
          (t) =>
            String(t.id) === String(item.expense_type_id) ||
            (item?.catogory_name &&
              t.expense_name?.toLowerCase() === item.catogory_name.toLowerCase())
        );
        if (matchedType?.transaction_category) {
          catType = matchedType.transaction_category.toLowerCase();
        }
      }

      if (catType.includes('credit')) {
        invSum += amount;
      } else if (catType.includes('debit')) {
        assetSum += amount;
      } else {
        invSum += amount;
      }
    });

    return { investment: invSum, fixedAsset: assetSum };
  }, [qpListRes, qpTypesRes]);

  // --- 2. Current Month Expense Report ---
  const expenseKey = useMemo(
    () =>
      canFetch
        ? [`${API}/expense-type-wise-report`, { start_date: monthRange.start_date, end_date: monthRange.end_date }]
        : null,
    [canFetch, API, monthRange]
  );
  const { data: expReportRes, isLoading: expLoading } = useSWR(
    expenseKey,
    postFetcher,
    swrOpts
  );
  const monthlyExpense = Number(expReportRes?.grand_total ?? 0);

  // --- 3. Total Stock Value (from parent dashboardData prop) ---
  const totalStockValue = Number(dashboardData?.total_accessories_stock_value || 0);

  // --- 4. Customer Due & Vendor Due ---
  const dueParamsCustomer = useMemo(
    () => ({
      start_date: '2000-01-01T00:00:00.000Z',
      end_date: new Date().toISOString(),
      due: 'customer',
    }),
    []
  );
  const dueParamsVendor = useMemo(
    () => ({
      start_date: '2000-01-01T00:00:00.000Z',
      end_date: new Date().toISOString(),
      due: 'vendor',
    }),
    []
  );

  const { data: custDueRes, isLoading: custDueLoading } = useSWR(
    canFetch ? [`${API}/date-wise-due-list`, dueParamsCustomer] : null,
    postFetcher,
    swrOpts
  );
  const { data: vendDueRes, isLoading: vendDueLoading } = useSWR(
    canFetch ? [`${API}/date-wise-due-list`, dueParamsVendor] : null,
    postFetcher,
    swrOpts
  );

  const customerDue = Number(custDueRes?.total_due ?? 0);
  const vendorDue = Number(vendDueRes?.total_due ?? 0);

  // --- 5. Cash & Bank Balances ---
  const { data: payTypesRes, isLoading: payTypesLoading } = useSWR(
    canFetch ? `${API}/payment-type-list?page=1&limit=100` : null,
    getFetcher,
    swrOpts
  );
  const paymentTypes = payTypesRes?.data?.data || [];

  const cashType = useMemo(
    () => paymentTypes.find((p) => p.type_name?.toLowerCase().includes('cash')),
    [paymentTypes]
  );
  const bankType = useMemo(
    () => paymentTypes.find((p) => p.type_name?.toLowerCase().includes('bank')),
    [paymentTypes]
  );

  const cashBookParams = useMemo(
    () => ({
      start_date: '2000-01-01T00:00:00.000Z',
      end_date: new Date().toISOString(),
      view_order: 'asc',
    }),
    []
  );

  const { data: cashBookRes, isLoading: cashBookLoading } = useSWR(
    canFetch && cashType?.id
      ? [`${API}/cash-book-report`, { ...cashBookParams, payment_type_id: String(cashType.id) }]
      : null,
    postFetcher,
    swrOpts
  );
  const { data: bankBookRes, isLoading: bankBookLoading } = useSWR(
    canFetch && bankType?.id
      ? [`${API}/cash-book-report`, { ...cashBookParams, payment_type_id: String(bankType.id) }]
      : null,
    postFetcher,
    swrOpts
  );

  const cashBalance = Number(cashBookRes?.closing_balance ?? 0);
  const bankBalance = Number(bankBookRes?.closing_balance ?? 0);
  const totalBalance = cashBalance + bankBalance;
  const balanceLoading = payTypesLoading || cashBookLoading || bankBookLoading;

  // --- Accounts Formula ---
  // Total = Fixed Asset + Expense + Stock Value + Customer Due + Total Balance - Vendor Due
  const totalAssetAndLiquidity =
    fixedAsset + monthlyExpense + totalStockValue + customerDue + totalBalance - vendorDue;

  // Net Profit / Loss = Total Asset & Liquidity - Investment
  const netProfitLoss = totalAssetAndLiquidity - investment;
  const isProfit = netProfitLoss >= 0;

  // --- PDF Export ---
  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      const blob = await pdf(
        <FinancialOverviewPDF
          data={{
            investment,
            fixedAsset,
            monthlyExpense,
            totalStockValue,
            customerDue,
            vendorDue,
            cashBalance,
            bankBalance,
            totalBalance,
            totalAssetAndLiquidity,
            netProfitLoss,
            isProfit,
            monthPeriodStr: monthRange.displayStr,
          }}
          user={session?.user}
        />
      ).toBlob();
      saveAs(
        blob,
        `financial-overview-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[88vh]">
        {/* Fixed Header */}
        <div className="shrink-0 bg-slate-900 text-white px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight leading-none text-white">
                  Financial Overview
                </h2>
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  Real-time financial metrics & P/L calculation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isPdfGenerating}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs flex items-center gap-1.5 px-3 py-1.5 font-medium shadow-sm transition-all cursor-pointer"
              >
                {isPdfGenerating ? (
                  <FileText className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isPdfGenerating ? 'PDF...' : 'Download PDF'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3.5 sm:p-4 space-y-3">
          {/* Row 1: Investment & Fixed Asset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {qpLoading ? (
              <Shimmer className="h-24" />
            ) : (
              <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Credit Payment
                  </span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                    <Landmark className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Investment</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  AED {fmt(investment)}
                </p>
              </div>
            )}

            {qpLoading ? (
              <Shimmer className="h-24" />
            ) : (
              <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Debit Payment
                  </span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Fixed Asset</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  AED {fmt(fixedAsset)}
                </p>
              </div>
            )}
          </div>

          {/* Row 2: Monthly Expense Report */}
          <div className="bg-white border border-orange-200/80 rounded-xl p-3.5 shadow-sm">
            {expLoading ? (
              <Shimmer className="h-16" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      Current Month Expense
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {monthRange.displayStr}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  AED {fmt(monthlyExpense)}
                </p>
              </div>
            )}
          </div>

          {/* Row 3: Total Stock Value */}
          <div className="bg-white border border-purple-100 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    Total Stock Value
                  </p>
                  <p className="text-[10px] text-gray-500">Current inventory value</p>
                </div>
              </div>
              <p className="text-xl font-bold text-purple-700">
                AED {fmt(totalStockValue)}
              </p>
            </div>
          </div>

          {/* Row 4: Customer Due & Vendor Due */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {custDueLoading ? (
              <Shimmer className="h-24" />
            ) : (
              <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm hover:border-amber-200 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Receivable
                  </span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                    <UserX className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Customer Due</p>
                <p className="text-xl font-bold text-amber-600 mt-0.5">
                  AED {fmt(customerDue)}
                </p>
              </div>
            )}

            {vendDueLoading ? (
              <Shimmer className="h-24" />
            ) : (
              <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm hover:border-rose-200 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    Payable
                  </span>
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Vendor Due</p>
                <p className="text-xl font-bold text-rose-600 mt-0.5">
                  AED {fmt(vendorDue)}
                </p>
              </div>
            )}
          </div>

          {/* Row 5: Balance Overview (Cash vs Bank) */}
          {balanceLoading ? (
            <Shimmer className="h-28" />
          ) : (
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">
                      Balance Overview
                    </p>
                    <p className="text-[10px] text-slate-400">Cash Book Closing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-medium">Total Balance</p>
                  <p className="text-xl font-bold text-white">
                    AED {fmt(totalBalance)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300 mb-0.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-[11px]">Cash Balance</span>
                  </div>
                  <p className="text-sm font-bold text-white">AED {fmt(cashBalance)}</p>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300 mb-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-[11px]">Bank Balance</span>
                  </div>
                  <p className="text-sm font-bold text-white">AED {fmt(bankBalance)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Row 6: Profit / Loss Calculation Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Scale className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Profit / Loss</h3>
                <p className="text-[10px] text-gray-500">
                  Formula: Fixed Asset + Expense + Stock Value + Customer Due + Total Balance - Vendor Due
                </p>
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Fixed Asset (Debit Amount)</span>
                <span className="font-mono">+ AED {fmt(fixedAsset)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Month Expense</span>
                <span className="font-mono">+ AED {fmt(monthlyExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Stock Value</span>
                <span className="font-mono">+ AED {fmt(totalStockValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Due</span>
                <span className="font-mono">+ AED {fmt(customerDue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Balance (Cash + Bank)</span>
                <span className="font-mono">+ AED {fmt(totalBalance)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Less: Supplier Balance (Vendor Due)</span>
                <span className="font-mono">- AED {fmt(vendorDue)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200 font-semibold text-gray-900">
                <span>Total Asset & Liquidity</span>
                <span className="font-mono">AED {fmt(totalAssetAndLiquidity)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Less: Total Investment</span>
                <span className="font-mono">- AED {fmt(investment)}</span>
              </div>
            </div>

            {/* Net Result Verdict Card */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isProfit
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isProfit ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {isProfit ? 'Net Profit' : 'Net Loss'}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {isProfit
                      ? 'Assets exceed Investment'
                      : 'Investment exceeds Assets'}
                  </p>
                </div>
              </div>
              <p
                className={`text-xl font-bold ${
                  isProfit ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                AED {fmt(Math.abs(netProfitLoss))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
