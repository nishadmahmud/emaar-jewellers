'use client';

import React from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, ShoppingCart, ArrowDownToLine, Wallet, Package, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (typeof num === 'string') {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return num;
    return parsed.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const parseTrend = (trendValue) => {
  if (trendValue === undefined || trendValue === null || trendValue === '') return null;
  if (typeof trendValue === 'string') {
    const parsed = Number.parseFloat(trendValue.replace('%', ''));
    return isNaN(parsed) ? null : parsed;
  }
  return typeof trendValue === 'number' ? trendValue : null;
};

export default function FinancialOverviewModal({ open, onClose, data = {}, interval = 'daily', setInterval }) {
  if (!open) return null;

  const dash = data?.data || data || {};

  const metrics = [
    {
      title: 'Total Sales',
      value: dash.sales || 0,
      currency: 'BDT',
      trend: dash.sales_change !== undefined ? dash.sales_change : '0%',
      trendText: dash.sales_report || 'vs last period',
      icon: '📊',
      color: 'bg-blue-50/70 border-blue-200/80',
      textColor: 'text-blue-900',
      link: '/dashboard/sales',
    },
    {
      title: 'Total Revenue',
      value: dash.revenue || 0,
      currency: 'BDT',
      trend: dash.revenue_percentage !== undefined ? dash.revenue_percentage : '0%',
      trendText: dash.revenue_report || 'vs last period',
      icon: '💰',
      color: 'bg-emerald-50/70 border-emerald-200/80',
      textColor: 'text-emerald-900',
    },
    {
      title: 'Total Expense',
      value: dash.expense || 0,
      currency: 'BDT',
      trend: dash.expense_percentage !== undefined ? dash.expense_percentage : '0%',
      trendText: dash.expense_report || 'vs last period',
      icon: '💸',
      color: 'bg-rose-50/70 border-rose-200/80',
      textColor: 'text-rose-900',
    },
    {
      title: 'Total Purchase',
      value: dash.purchase || 0,
      currency: 'BDT',
      trend: dash.purchase_percentage,
      icon: '🛒',
      color: 'bg-amber-50/70 border-amber-200/80',
      textColor: 'text-amber-900',
      link: '/dashboard/purchases',
    },
    {
      title: 'Total Balance',
      value: dash.balance || 0,
      currency: 'BDT',
      trend: dash.balance_percentage !== undefined ? dash.balance_percentage : '0%',
      trendText: dash.balance_report || 'vs last period',
      icon: '💵',
      color: 'bg-indigo-50/70 border-indigo-200/80',
      textColor: 'text-indigo-900',
    },
    {
      title: 'Total Orders',
      value: dash.order || 0,
      trend: dash.order_percentage !== undefined ? dash.order_percentage : '0%',
      icon: '📦',
      color: 'bg-purple-50/70 border-purple-200/80',
      textColor: 'text-purple-900',
    },
    {
      title: 'New Customers',
      value: dash.new_customer || 0,
      trend: dash.customer_percentage !== undefined ? dash.customer_percentage : '0%',
      icon: '👥',
      color: 'bg-teal-50/70 border-teal-200/80',
      textColor: 'text-teal-900',
      link: '/dashboard/customers',
    },
    {
      title: 'Current Stock',
      value: dash.total_accessories_stock || dash.current_stock || 0,
      icon: '📦',
      color: 'bg-cyan-50/70 border-cyan-200/80',
      textColor: 'text-cyan-900',
    },
    {
      title: 'Stock Value',
      value: dash.total_accessories_stock_value || 0,
      currency: 'BDT',
      icon: '💎',
      color: 'bg-amber-50/70 border-amber-200/80',
      textColor: 'text-amber-900',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Financial Overview</h3>
              <p className="text-xs text-neutral-500">Live store performance and stock summary</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interval Selector Bar */}
        <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-100/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Time Period</span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200 shadow-2xs">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setInterval && setInterval(item.value)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  interval === item.value
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body - Metric Cards Grid */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar text-black">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {metrics.map((m, idx) => {
              const trendNumeric = parseTrend(m.trend);
              const isPositive = trendNumeric !== null && trendNumeric >= 0;

              const cardElement = (
                <div key={idx} className={`p-4 rounded-xl border ${m.color} transition-all hover:shadow-sm flex flex-col justify-between h-full`}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-600 truncate">{m.title}</p>
                      <p className={`text-base sm:text-xl font-extrabold ${m.textColor} mt-1 tracking-tight truncate`}>
                        {formatNumber(m.value)}
                      </p>
                      {m.currency && <p className="text-[10px] font-medium text-neutral-500 mt-0.5">{m.currency}</p>}
                    </div>
                    <span className="text-xl shrink-0 ml-1 select-none">{m.icon}</span>
                  </div>

                  {trendNumeric !== null && (
                    <div className="flex items-center mt-3 pt-2 border-t border-neutral-200/60 text-[11px]">
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className={`ml-0.5 font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Math.abs(trendNumeric).toFixed(0)}%
                      </span>
                      {m.trendText && <span className="text-neutral-400 ml-1 truncate">{m.trendText}</span>}
                    </div>
                  )}
                </div>
              );

              if (m.link) {
                return (
                  <Link key={idx} href={m.link} onClick={onClose} className="block group">
                    {cardElement}
                  </Link>
                );
              }
              return cardElement;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
