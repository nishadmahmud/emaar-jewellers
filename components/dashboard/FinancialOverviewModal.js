'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, TrendingUp, DollarSign, Package, Scale, Store, Users, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

const fmtAED = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Module-level cache valid for 5 minutes (300,000 ms)
const CACHE_TTL_MS = 5 * 60 * 1000;
let financialDataCache = null;
let financialDataCacheTimestamp = 0;

export default function FinancialOverviewModal({ open, onClose }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false);
  const [dashData, setDashData] = useState(null);
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [profitLossData, setProfitLossData] = useState(null);
  const [cashStatementData, setCashStatementData] = useState(null);

  useEffect(() => {
    // DO NOT call APIs unless modal is opened by user
    if (!open || !token) return;

    const now = Date.now();
    // Check if cache exists and is within 5 minutes TTL
    if (financialDataCache && (now - financialDataCacheTimestamp) < CACHE_TTL_MS) {
      setDashData(financialDataCache.dashData);
      setBalanceSheetData(financialDataCache.balanceSheetData);
      setProfitLossData(financialDataCache.profitLossData);
      setCashStatementData(financialDataCache.cashStatementData);
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      if (!financialDataCache) {
        setLoading(true);
      }

      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const payload = {
          start_date: monthStart.toISOString(),
          end_date: todayEnd.toISOString()
        };

        const [dashRes, balanceRes, profitRes, cashRes] = await Promise.all([
          axios.get(`${API_URL}/web-dashboard?interval=monthly`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          axios.post(`${API_URL}/balance-Sheet-report-history`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          axios.post(`${API_URL}/profit-loss-report`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          axios.post(`${API_URL}/cash-statement-report`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
        ]);

        const freshDash = dashRes?.data?.data || dashRes?.data || {};
        const freshBalance = balanceRes?.data?.data || balanceRes?.data || {};
        const freshProfit = profitRes?.data?.data || profitRes?.data || {};
        const freshCash = cashRes?.data?.data || cashRes?.data || {};

        setDashData(freshDash);
        setBalanceSheetData(freshBalance);
        setProfitLossData(freshProfit);
        setCashStatementData(freshCash);

        financialDataCache = {
          dashData: freshDash,
          balanceSheetData: freshBalance,
          profitLossData: freshProfit,
          cashStatementData: freshCash
        };
        financialDataCacheTimestamp = Date.now();
      } catch (err) {
        console.error('Financial overview load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [open, token, API_URL]);

  if (!open) return null;

  // Extract financial metrics
  const currentMonthExpense = Number(dashData?.expense || profitLossData?.total_expenses || 0);
  const totalStockValue = Number(dashData?.total_accessories_stock_value || balanceSheetData?.total_closing_stock_value || 0);
  const totalStockPcs = Number(dashData?.total_accessories_stock || dashData?.current_stock || 0);
  
  const customerDue = Number(balanceSheetData?.total_customer_due || 0);
  const vendorDue = Number(balanceSheetData?.total_vendor_ || 0);
  
  const grossProfit = Number(profitLossData?.gross_profit || 0);
  const netProfit = Number(profitLossData?.net_profit || 0);
  const totalExpenses = Number(profitLossData?.total_expenses || currentMonthExpense);

  const creditExpenseCreditList = Array.isArray(cashStatementData?.inflow_of_fund?.expense_credit)
    ? cashStatementData.inflow_of_fund.expense_credit
    : [];

  const creditPaymentInflow = creditExpenseCreditList.length > 0
    ? creditExpenseCreditList.reduce((s, r) => s + (Number(r.amount) || Number(r.payment_amount) || Number(r.total_amount) || 0), 0)
    : Number(dashData?.credit_payment || dashData?.total_credit_payment || 0);

  const debitExpenseDebitList = Array.isArray(cashStatementData?.outflow_of_fund?.expense_debit)
    ? cashStatementData.outflow_of_fund.expense_debit
    : [];

  const debitPaymentOutflow = debitExpenseDebitList.length > 0
    ? debitExpenseDebitList.reduce((s, r) => s + (Number(r.amount) || Number(r.payment_amount) || Number(r.total_amount) || 0), 0)
    : Number(dashData?.debit_payment || dashData?.total_debit_payment || 0);

  const monthStartStr = `01/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  const todayStr = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

  // Clean, single-page dedicated PDF export
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=950');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Overview Report</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 10px; background: #fff; font-size: 12px; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 4px; }
            .amount { font-size: 16px; font-weight: 800; color: #0f172a; }
            .text-emerald { color: #059669; }
            .text-rose { color: #dc2626; }
            .text-amber { color: #d97706; }
            .text-purple { color: #7c3aed; }
            .text-blue { color: #2563eb; }
            .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .table th, .table td { padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; }
            .table th { background: #f1f5f9; font-weight: 700; font-size: 11px; }
            .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Financial Overview Report</h1>
              <p class="subtitle">Real-time financial metrics & P/L calculation</p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <p style="margin:0;">Date: ${todayStr}</p>
              <p style="margin:2px 0 0 0;">Period: ${monthStartStr} - ${todayStr}</p>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title text-emerald">Credit Payment / Investment</div>
              <div class="amount">AED {fmtAED(creditPaymentInflow)}</div>
            </div>
            <div class="card">
              <div class="card-title text-blue">Debit Payment / Fixed Asset</div>
              <div class="amount">AED {fmtAED(debitPaymentOutflow)}</div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 12px;">
            <div class="card-title text-amber">Current Month Expense (${monthStartStr} - ${todayStr})</div>
            <div class="amount text-amber">AED {fmtAED(currentMonthExpense)}</div>
          </div>

          <div class="card" style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div class="card-title text-purple">Total Stock Value</div>
                <div style="font-size:11px; color:#64748b;">Jewelry Stock Value (${totalStockPcs} pcs)</div>
              </div>
              <div class="amount text-purple">AED {fmtAED(totalStockValue)}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title text-emerald">Customer Due (Receivable)</div>
              <div class="amount text-emerald">AED {fmtAED(customerDue)}</div>
            </div>
            <div class="card">
              <div class="card-title text-rose">Vendor Due (Payable)</div>
              <div class="amount text-rose">AED {fmtAED(vendorDue)}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom:8px;">Profit / Loss Summary</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th style="text-align:right;">Amount (AED)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gross Profit</td>
                  <td style="text-align:right;" class="text-emerald">AED {fmtAED(grossProfit)}</td>
                </tr>
                <tr>
                  <td>Total Expenses</td>
                  <td style="text-align:right;" class="text-rose">AED {fmtAED(totalExpenses)}</td>
                </tr>
                <tr style="font-weight:bold; background:#f8fafc;">
                  <td>Net Profit</td>
                  <td style="text-align:right;" class="text-blue">AED {fmtAED(netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            Generated automatically on ${new Date().toLocaleString()} | Emaar Jewellers CMS
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 400);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[92vh]">
        {/* Dark Header */}
        <div className="px-3.5 py-3 sm:px-5 sm:py-4 bg-[#0f172a] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight truncate">Financial Overview</h3>
              <p className="hidden sm:block text-xs text-slate-400">Real-time financial metrics & P/L calculation</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4 text-slate-900">
          {loading && !dashData ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-xs">Loading financial overview...</p>
            </div>
          ) : (
            <>
              {/* Row 1: Credit Payment (Investment) & Debit Payment (Fixed Asset) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      CREDIT PAYMENT
                    </span>
                    <span className="text-emerald-500 text-sm sm:text-base">📊</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Investment</p>
                  <p className="text-xs sm:text-base font-bold text-slate-900 mt-1 break-all sm:break-normal">AED {fmtAED(creditPaymentInflow)}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      DEBIT PAYMENT
                    </span>
                    <span className="text-blue-500 text-sm sm:text-base">💳</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Fixed Asset</p>
                  <p className="text-xs sm:text-base font-bold text-slate-900 mt-1 break-all sm:break-normal">AED {fmtAED(debitPaymentOutflow)}</p>
                </div>
              </div>

              {/* Row 2: Current Month Expense */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Current Month Expense</h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">{monthStartStr} - {todayStr}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 max-w-[50%]">
                  <p className="text-xs sm:text-base font-bold text-[#ea580c] break-all sm:break-normal">AED {fmtAED(currentMonthExpense)}</p>
                </div>
              </div>

              {/* Row 3: Total Stock Value (Jewelry) */}
              <div className="bg-white border border-purple-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Total Stock Value</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">Jewelry Stock</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-base font-bold text-[#7c3aed] break-all sm:break-normal shrink-0 max-w-[50%] text-right">AED {fmtAED(totalStockValue)}</p>
                </div>

                <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500">Jewelry Stock Value</p>
                  <p className="text-xs sm:text-sm font-bold text-purple-900 mt-0.5 break-all sm:break-normal">
                    AED {fmtAED(totalStockValue)}{' '}
                    <span className="text-[10px] sm:text-xs font-normal text-purple-600">({totalStockPcs} pcs)</span>
                  </p>
                </div>
              </div>

              {/* Row 4: Customer Due (Receivable) & Vendor Due (Payable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                      RECEIVABLE
                    </span>
                    <span className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Customer Due</p>
                  <p className="text-xs sm:text-base font-bold text-emerald-700 mt-1 break-all sm:break-normal">AED {fmtAED(customerDue)}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] sm:text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-200">
                      PAYABLE
                    </span>
                    <span className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-600">
                      <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Vendor Due</p>
                  <p className="text-xs sm:text-base font-bold text-rose-600 mt-1 break-all sm:break-normal">AED {fmtAED(vendorDue)}</p>
                </div>
              </div>

              {/* Row 5: Profit / Loss Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">Profit / Loss Summary</h4>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
                  <div className="bg-slate-50 p-1.5 sm:p-2.5 rounded-lg border border-slate-200/80 overflow-hidden">
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">Gross Profit</p>
                    <p className="text-[10px] sm:text-xs md:text-sm font-bold text-emerald-600 mt-0.5 break-all sm:break-normal leading-tight">AED {fmtAED(grossProfit)}</p>
                  </div>
                  <div className="bg-slate-50 p-1.5 sm:p-2.5 rounded-lg border border-slate-200/80 overflow-hidden">
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">Total Expenses</p>
                    <p className="text-[10px] sm:text-xs md:text-sm font-bold text-rose-600 mt-0.5 break-all sm:break-normal leading-tight">AED {fmtAED(totalExpenses)}</p>
                  </div>
                  <div className="bg-slate-50 p-1.5 sm:p-2.5 rounded-lg border border-slate-200/80 overflow-hidden">
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">Net Profit</p>
                    <p className="text-[10px] sm:text-xs md:text-sm font-bold text-blue-600 mt-0.5 break-all sm:break-normal leading-tight">AED {fmtAED(netProfit)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
