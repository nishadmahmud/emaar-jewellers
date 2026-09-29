'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import DayWiseReportPDF from './day-wise-report-pdf';

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function DayWiseReportPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [date, setDate] = useState(getLocalDateString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [profitLoss, setProfitLoss] = useState({ totalSales: 0, totalPurchase: 0, avgSellPrice: 0, avgPurchasePrice: 0, currentProfit: 0 });
  const [balanceSheet, setBalanceSheet] = useState({ stockBalance: 0, sumBDT: 0, sumAED: 0, aedRate: 34, totalAssetBalance: 0 });

  const apply = async () => {
    if (!token) return;
    
    try {
      setIsGenerating(true);
      setProgressMsg('Fetching daily data (Sales, Purchases, Cashbook)...');

      const startDateFormatted = date;
      const endDateFormatted = date;
      const baseHeaders = { headers: { Authorization: `Bearer ${token}` } };

      const masterPromises = [
        axios.post(`${API_URL}/search-invoice?page=1&limit=10000`, { keyword: "", nameId: false, emailId: false, phoneId: false, product: false, startDate: `${date}T00:00:00.000Z`, endDate: `${date}T23:59:59.999Z`, dueOnly: false }, baseHeaders).then(res => res.data?.data?.data || []),
        axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=10000`, { keyword: "", nameId: false, emailId: false, phoneId: false, imei: false, start_date: `${date}T00:00:00.000Z`, end_date: `${date}T23:59:59.999Z` }, baseHeaders).then(res => res.data?.data?.data || []),
        axios.get(`${API_URL}/payment-type-category-list?t=${Date.now()}`, baseHeaders).then(res => res.data?.data?.data || res.data?.data || res.data || []),
      ];

      const masterResults = await Promise.all(masterPromises);
      const salesInvoices = masterResults[0];
      const purchaseInvoices = masterResults[1];
      const accountsRaw = masterResults[2];

      // Format Sales & Purchases for the list
      const formattedSales = salesInvoices.map(inv => {
        const isAed = (inv.pay_mode || '').includes('(AED @');
        const amount = (inv.sub_total || 0) - (inv.discount || 0);
        return { invoice_id: inv.invoice_id, amount: isAed ? amount * 34 : amount };
      });
      const formattedPurchases = purchaseInvoices.map(inv => {
        const isAed = (inv.pay_mode || '').includes('(AED @');
        const amount = (inv.sub_total || 0) - (inv.discount || 0);
        return { invoice_id: inv.invoice_id, amount: isAed ? amount * 34 : amount };
      });

      setSales(formattedSales);
      setPurchases(formattedPurchases);

      // Calculate Profit Loss
      const totalSalesBdt = formattedSales.reduce((sum, s) => sum + s.amount, 0);
      const totalPurchaseBdt = formattedPurchases.reduce((sum, p) => sum + p.amount, 0);

      const totalSalesQty = salesInvoices.reduce((acc, inv) => acc + (inv.sales_details ? inv.sales_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) : 0), 0);
      const totalPurchaseQty = purchaseInvoices.reduce((acc, inv) => acc + (inv.purchase_details ? inv.purchase_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) : 0), 0);

      const avgSellPrice = totalSalesQty > 0 ? totalSalesBdt / totalSalesQty : 0;
      const avgPurchasePrice = totalPurchaseQty > 0 ? totalPurchaseBdt / totalPurchaseQty : 0;
      const currentProfit = (avgSellPrice - avgPurchasePrice) * totalSalesQty;
      const stockAvailable = totalPurchaseQty - totalSalesQty;
      const stockBalance = avgPurchasePrice * stockAvailable;

      setProfitLoss({ totalSales: totalSalesBdt, totalPurchase: totalPurchaseBdt, avgSellPrice, avgPurchasePrice, currentProfit });

      // Fetch Transaction History (Cashbook) for all accounts for this day
      const flattenedAccounts = [];
      accountsRaw.forEach((item) => {
        if (Array.isArray(item.payment_type_category)) {
          item.payment_type_category.forEach((acc) => {
            flattenedAccounts.push({ ...acc, actual_payment_type_id: item.id });
          });
        } else {
          flattenedAccounts.push({ ...item, actual_payment_type_id: item.id });
        }
      });

      setProgressMsg('Fetching transaction history and calculating balances...');
      
      const cbPromises = flattenedAccounts.map(acc => {
        const cbPayload = { start_date: `${date}T00:00:00.000Z`, end_date: `${date}T23:59:59.999Z`, view_order: "asc", payment_type_id: Number(acc.payment_type_id || acc.actual_payment_type_id || acc.id) };
        return axios.post(`${API_URL}/cash-book-report`, cbPayload, baseHeaders)
          .then(res => ({ acc, data: res.data }))
          .catch(() => ({ acc, data: null }));
      });

      const customerPromises = [
        axios.get(`${API_URL}/customer-lists?page=1&limit=5000`, baseHeaders).then(res => res.data?.data?.data || []),
        axios.get(`${API_URL}/vendor-lists?page=1&limit=5000`, baseHeaders).then(res => res.data?.data?.data || [])
      ];

      const [cbResults, customers, vendors] = await Promise.all([
        Promise.all(cbPromises),
        customerPromises[0],
        customerPromises[1]
      ]);

      // Process Transactions
      const dayTransactions = [];
      cbResults.forEach(res => {
         if (res.data && Array.isArray(res.data.data)) {
            const valid = res.data.data.filter(r => r.date === date);
            valid.forEach(r => {
                dayTransactions.push({
                   type_name: r.type_name || r.type || "-",
                   status: r.status,
                   amount: Number(r.payment_amount || 0)
                });
            });
         }
      });
      setTransactions(dayTransactions);

      setProgressMsg('Processing balance sheet (this may take a moment)...');
      
      // Calculate Balance Sheet
      const usersMap = new Map();
      const addOrUpdateUser = (nameStr, type, dataObj) => {
          if (!nameStr) return;
          let baseName = nameStr.replace(/\(BD\)/i, '').replace(/\(DH\)/i, '').replace(/\(AED\)/i, '').trim();
          const key = baseName.toLowerCase();
          if (!usersMap.has(key)) usersMap.set(key, { name: baseName, accounts: [] });
          if (type === 'account') usersMap.get(key).accounts.push(dataObj);
      };
      customers.forEach(c => addOrUpdateUser(c.name || `Customer #${c.id}`, 'customer', c));
      vendors.forEach(v => addOrUpdateUser(v.name || `Vendor #${v.id}`, 'vendor', v));
      flattenedAccounts.forEach(a => addOrUpdateUser(a.payment_category_name || a.name || "Account", 'account', a));

      const allUsers = Array.from(usersMap.values());
      let sumBDT = 0;
      let sumAED = 0;
      const CHUNK_SIZE = 10;
      
      for (let i = 0; i < allUsers.length; i += CHUNK_SIZE) {
        const chunk = allUsers.slice(i, i + CHUNK_SIZE);
        setProgressMsg(`Calculating balances ${i + 1} to ${Math.min(i + CHUNK_SIZE, allUsers.length)} of ${allUsers.length}...`);

        const chunkPromises = [];
        chunk.forEach(user => {
            chunkPromises.push(axios.post(`${API_URL}/party-ledger-report`, { start_date: date, end_date: date, name: user.name }, baseHeaders).then(res => ({ user, type: 'party_ledger', data: res.data?.ledger || [] })).catch(() => ({ user, type: 'party_ledger', data: [] })));
            chunkPromises.push(axios.post(`${API_URL}/party-book-report`, { date: date, search: user.name }, baseHeaders).then(res => ({ user, type: 'party_book', data: res.data?.data?.[0] || null })).catch(() => ({ user, type: 'party_book', data: null })));
        });

        const chunkResults = await Promise.all(chunkPromises);

        chunk.forEach(user => {
            let uAED = 0;
            let uBDT = 0;

            const partyBookRes = chunkResults.find(r => r.user.name === user.name && r.type === 'party_book');
            if (partyBookRes && partyBookRes.data) {
                uAED = Number(partyBookRes.data.aed?.opening_balance || 0);
                uBDT = Number(partyBookRes.data.cash?.opening_balance || 0);
            }

            const partyLedgerRes = chunkResults.find(r => r.user.name === user.name && r.type === 'party_ledger');
            const ledgerEntries = partyLedgerRes?.data || [];
            ledgerEntries.forEach(e => {
                const credit = Number(e.credit) || 0;
                const debit = Number(e.debit) || 0;
                const mode = (e.pay_mode || "").toUpperCase();
                if (mode.includes("AED")) uAED = uAED + credit - debit;
                else uBDT = uBDT + credit - debit;
            });

            // Cashbook balances from previous fetch
            user.accounts.forEach(acc => {
                const cb = cbResults.find(r => r.acc.id === acc.id)?.data;
                let opBal = Number(cb?.opening_balance ?? 0);
                let rawData = cb?.data || [];
                rawData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                let running = opBal;
                rawData.forEach(r => {
                    const status = (r?.status || "").toLowerCase();
                    const amount = Number(r?.payment_amount ?? 0);
                    const debit = status === "debit" || status === "out" ? amount : 0;
                    const credit = status === "credit" ? amount : 0;
                    running = running + credit - debit;
                });
                const accName = (acc.payment_category_name || acc.name || "").toUpperCase();
                if (accName.includes("(DH)") || accName.includes("AED")) uAED += running;
                else uBDT += running;
            });

            sumAED += uAED;
            sumBDT += uBDT;
        });
      }

      const totalAssetBalance = sumBDT + (sumAED * 34) + stockBalance;
      setBalanceSheet({ stockBalance, sumBDT, sumAED, aedRate: 34, totalAssetBalance });

      setProgressMsg('Completed!');
      setTimeout(() => setProgressMsg(''), 3000);

    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
      setProgressMsg('Error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePDFExport = useCallback(async () => {
    try {
      const blob = await pdf(
        <DayWiseReportPDF
          logoUrl={session?.user?.profile_pic || null}
          user={session?.user}
          date={date}
          sales={sales}
          purchases={purchases}
          transactions={transactions}
          profitLoss={profitLoss}
          balanceSheet={balanceSheet}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Day_Wise_Report_${date}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Error generating PDF.");
    }
  }, [sales, purchases, transactions, profitLoss, balanceSheet, date, session]);

  return (
    <div className="max-w-[95%] mx-auto space-y-4 sm:space-y-6 text-black">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Day Wise Report</h1>
          <p className="text-sm text-neutral-500 mt-1">Consolidated view of the day's activity.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <button
              onClick={apply}
              disabled={isGenerating}
              className="w-full md:w-auto h-[38px] px-6 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Generate
            </button>
          </div>
          <div className="md:ml-auto">
            <button
              onClick={handlePDFExport}
              disabled={isGenerating || (sales.length === 0 && purchases.length === 0 && transactions.length === 0)}
              className="w-full md:w-auto h-[38px] px-6 bg-white text-black border border-neutral-200 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText size={16} className="text-red-500" />
              Export PDF
            </button>
          </div>
        </div>
        {progressMsg && (
          <div className="mt-4 text-sm text-blue-600 font-medium">
            {progressMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Sales */}
        <div className="bg-white border border-neutral-200 rounded-xl flex flex-col max-h-[600px]">
          <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 rounded-t-xl font-bold text-sm text-neutral-800">
            Sales History
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {sales.length === 0 && <div className="p-4 text-center text-sm text-neutral-500">No sales</div>}
            <ul className="divide-y divide-neutral-100">
              {sales.map((s, i) => (
                <li key={i} className="px-4 py-2 flex justify-between text-xs hover:bg-neutral-50">
                  <span className="font-medium">{s.invoice_id}</span>
                  <span>{fmt2(s.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          {sales.length > 0 && (
            <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 rounded-b-xl flex justify-between font-bold text-sm">
              <span>Total</span>
              <span className="text-emerald-600">{fmt2(sales.reduce((acc, s) => acc + s.amount, 0))}</span>
            </div>
          )}
        </div>

        {/* Purchases */}
        <div className="bg-white border border-neutral-200 rounded-xl flex flex-col max-h-[600px]">
          <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 rounded-t-xl font-bold text-sm text-neutral-800">
            Purchase History
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {purchases.length === 0 && <div className="p-4 text-center text-sm text-neutral-500">No purchases</div>}
            <ul className="divide-y divide-neutral-100">
              {purchases.map((p, i) => (
                <li key={i} className="px-4 py-2 flex justify-between text-xs hover:bg-neutral-50">
                  <span className="font-medium">{p.invoice_id}</span>
                  <span>{fmt2(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          {purchases.length > 0 && (
            <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 rounded-b-xl flex justify-between font-bold text-sm">
              <span>Total</span>
              <span className="text-rose-600">{fmt2(purchases.reduce((acc, p) => acc + p.amount, 0))}</span>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-white border border-neutral-200 rounded-xl flex flex-col max-h-[600px]">
          <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 rounded-t-xl font-bold text-sm text-neutral-800">
            Transactions (Cashbook)
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {transactions.length === 0 && <div className="p-4 text-center text-sm text-neutral-500">No transactions</div>}
            <ul className="divide-y divide-neutral-100">
              {transactions.map((t, i) => (
                <li key={i} className="px-4 py-2 flex flex-col text-xs hover:bg-neutral-50">
                  <span className="font-medium truncate" title={t.type_name}>{t.type_name}</span>
                  <span className={`text-right font-semibold ${t.status?.toLowerCase() === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.status?.toLowerCase() === 'credit' ? '+' : '-'}{fmt2(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {transactions.length > 0 && (
            <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-200 rounded-b-xl flex flex-col gap-1 text-xs font-bold">
              <div className="flex justify-between">
                <span>Total In</span>
                <span className="text-emerald-600">{fmt2(transactions.filter(t => t.status?.toLowerCase() === 'credit').reduce((a, b) => a + b.amount, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Out</span>
                <span className="text-rose-600">{fmt2(transactions.filter(t => t.status?.toLowerCase() === 'debit' || t.status?.toLowerCase() === 'out').reduce((a, b) => a + b.amount, 0))}</span>
              </div>
            </div>
          )}
        </div>

        {/* Profit Loss */}
        <div className="bg-white border border-neutral-200 rounded-xl flex flex-col max-h-[600px]">
          <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 rounded-t-xl font-bold text-sm text-neutral-800">
            Profit & Loss
          </div>
          <div className="flex-1 p-0">
            <ul className="divide-y divide-neutral-100">
              <li className="px-4 py-3 flex justify-between text-xs">
                <span className="text-neutral-600">Total Sales</span>
                <span className="font-medium">{fmt2(profitLoss.totalSales)}</span>
              </li>
              <li className="px-4 py-3 flex justify-between text-xs">
                <span className="text-neutral-600">Total Purchase</span>
                <span className="font-medium">{fmt2(profitLoss.totalPurchase)}</span>
              </li>
              <li className="px-4 py-3 flex justify-between text-xs">
                <span className="text-neutral-600">Avg Sell Price</span>
                <span className="font-medium">{fmt2(profitLoss.avgSellPrice)}</span>
              </li>
              <li className="px-4 py-3 flex justify-between text-xs">
                <span className="text-neutral-600">Avg Purch Price</span>
                <span className="font-medium">{fmt2(profitLoss.avgPurchasePrice)}</span>
              </li>
            </ul>
          </div>
          <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 rounded-b-xl flex justify-between font-bold text-sm">
            <span>Est. Profit</span>
            <span className={profitLoss.currentProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>{fmt2(profitLoss.currentProfit)}</span>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="bg-white border border-neutral-200 rounded-xl flex flex-col max-h-[600px]">
          <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 rounded-t-xl font-bold text-sm text-neutral-800">
            Balance Sheet
          </div>
          <div className="flex-1 p-0">
            <ul className="divide-y divide-neutral-100">
              <li className="px-4 py-3 flex flex-col text-xs">
                <span className="text-neutral-600 mb-1">Stock Value</span>
                <span className="font-medium text-right">{fmt2(balanceSheet.stockBalance)}</span>
              </li>
              <li className="px-4 py-3 flex flex-col text-xs">
                <span className="text-neutral-600 mb-1">Party Balances (BDT)</span>
                <span className="font-medium text-right">{fmt2(balanceSheet.sumBDT)}</span>
              </li>
              <li className="px-4 py-3 flex flex-col text-xs">
                <span className="text-neutral-600 mb-1">Party Balances (AED)</span>
                <span className="font-medium text-right">{fmt2(balanceSheet.sumAED)}</span>
              </li>
              <li className="px-4 py-3 flex justify-between text-xs">
                <span className="text-neutral-600">AED Rate</span>
                <span className="font-medium">{fmt2(balanceSheet.aedRate)}</span>
              </li>
            </ul>
          </div>
          <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 rounded-b-xl flex flex-col font-bold text-sm gap-1 text-right">
            <span className="text-xs text-neutral-500 text-left">Grand Asset Total</span>
            <span className="text-blue-600">{fmt2(balanceSheet.totalAssetBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
