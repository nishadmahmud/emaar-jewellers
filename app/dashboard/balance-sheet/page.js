'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';

function todayStartISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayEndISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BalanceSheetPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [filters, setFilters] = useState({
    start_date: todayStartISO(),
    end_date: todayEndISO(),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [aedRate, setAedRate] = useState(34);
  const [stockBalance, setStockBalance] = useState(0);
  
  // Array of user balances: { name: string, bdt: number, aed: number }
  const [userBalances, setUserBalances] = useState([]);

  // Calculate table sums
  const sumBDT = userBalances.reduce((acc, u) => acc + u.bdt, 0);
  const sumAED = userBalances.reduce((acc, u) => acc + u.aed, 0);

  const apply = async () => {
    if (!token) return;
    
    try {
      setIsGenerating(true);
      setUserBalances([]);
      setProgressMsg('Fetching master data (Customers, Vendors, Invoices, Accounts)...');

      // 1. Fetch Master Data
      const currentStart = new Date(filters.start_date);
      const prevStart = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth(), 1, 0, 0, 0, 0));
      const prevEnd = new Date(currentStart.getTime() - 1); 
      const isPrevPeriodValid = prevEnd.getTime() >= prevStart.getTime();

      const baseHeaders = { headers: { Authorization: `Bearer ${token}` } };

      const masterPromises = [
        axios.get(`${API_URL}/customer-lists?page=1&limit=5000`, baseHeaders).then(res => res.data?.data?.data || []),
        axios.get(`${API_URL}/vendor-lists?page=1&limit=5000`, baseHeaders).then(res => res.data?.data?.data || []),
        axios.get(`${API_URL}/payment-type-category-list?t=${Date.now()}`, baseHeaders).then(res => res.data?.data?.data || res.data?.data || res.data || []),
        axios.post(`${API_URL}/search-invoice?page=1&limit=10000`, { keyword: "", nameId: false, emailId: false, phoneId: false, product: false, startDate: filters.start_date, endDate: filters.end_date, dueOnly: false }, baseHeaders).then(res => res.data?.data?.data || []),
        axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=10000`, { keyword: "", nameId: false, emailId: false, phoneId: false, product: false, startDate: filters.start_date, endDate: filters.end_date, dueOnly: false }, baseHeaders).then(res => res.data?.data?.data || []),
      ];

      if (isPrevPeriodValid) {
        masterPromises.push(axios.post(`${API_URL}/search-invoice?page=1&limit=10000`, { keyword: "", nameId: false, emailId: false, phoneId: false, product: false, startDate: prevStart.toISOString(), endDate: prevEnd.toISOString(), dueOnly: false }, baseHeaders).then(res => res.data?.data?.data || []).catch(()=>[]));
        masterPromises.push(axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=10000`, { keyword: "", nameId: false, emailId: false, phoneId: false, product: false, startDate: prevStart.toISOString(), endDate: prevEnd.toISOString(), dueOnly: false }, baseHeaders).then(res => res.data?.data?.data || []).catch(()=>[]));
      }

      const masterResults = await Promise.all(masterPromises);
      
      const customers = masterResults[0];
      const vendors = masterResults[1];
      const accountsRaw = masterResults[2];
      const salesInvoices = masterResults[3];
      const purchaseInvoices = masterResults[4];
      const prevSalesInvoices = isPrevPeriodValid ? masterResults[5] : [];
      const prevPurchaseInvoices = isPrevPeriodValid ? masterResults[6] : [];

      // Build Maps for Invoices
      const salesMap = new Map();
      const purchaseMap = new Map();
      const prevSalesMap = new Map();
      const prevPurchaseMap = new Map();
      
      salesInvoices.forEach(inv => salesMap.set(inv.invoice_id, inv));
      purchaseInvoices.forEach(inv => purchaseMap.set(inv.invoice_id, inv));
      prevPurchaseInvoices.forEach(inv => prevPurchaseMap.set(inv.invoice_id, inv));

      // Calculate Stock Balance (same logic as Profit & Loss report)
      const aggregateTotal = (invoices) => {
        return invoices.reduce((sum, inv) => {
          const payModeString = inv.pay_mode || '';
          const isAed = payModeString.includes('(AED @');
          const totalAmount = Number(inv.sub_total || 0) - Number(inv.discount || 0);
          const bdtAmount = isAed ? totalAmount * 34 : totalAmount;
          return sum + bdtAmount;
        }, 0);
      };

      const totalSalesBdt = aggregateTotal(salesInvoices);
      const totalPurchaseBdt = aggregateTotal(purchaseInvoices);

      const totalSalesQty = salesInvoices.reduce((acc, inv) => {
        return acc + (inv.sales_details && inv.sales_details.length > 0
          ? inv.sales_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
          : 0);
      }, 0);

      const totalPurchaseQty = purchaseInvoices.reduce((acc, inv) => {
        return acc + (inv.purchase_details && inv.purchase_details.length > 0
          ? inv.purchase_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
          : 0);
      }, 0);

      const avgPurchasePrice = totalPurchaseQty > 0 ? totalPurchaseBdt / totalPurchaseQty : 0;
      const stockAvailable = totalPurchaseQty - totalSalesQty;
      const stockMultiplier = stockAvailable === 0 ? 1 : stockAvailable;
      const currentStockPrice = avgPurchasePrice * stockMultiplier;
      
      setStockBalance(currentStockPrice);

      // Flatten Accounts
      const flattenedAccounts = [];
      accountsRaw.forEach((item) => {
        if (Array.isArray(item.payment_type_category)) {
          item.payment_type_category.forEach((acc) => {
            flattenedAccounts.push({ ...acc, actual_payment_type_id: item.id, payment_category_name: acc.payment_category_name || acc.name || item.type_name || "Account" });
          });
        } else {
          flattenedAccounts.push({ ...item, actual_payment_type_id: item.id, payment_category_name: item.payment_category_name || item.name || item.type_name || "Account" });
        }
      });

      // Group entities by Name
      const usersMap = new Map(); // key -> { name, customer_ids: [], vendor_ids: [], accounts: [] }

      const addOrUpdateUser = (nameStr, type, dataObj) => {
          if (!nameStr) return;
          const key = nameStr.trim().toLowerCase();
          if (!usersMap.has(key)) {
              usersMap.set(key, { name: nameStr.trim(), customer_ids: [], vendor_ids: [], accounts: [] });
          }
          if (type === 'customer') usersMap.get(key).customer_ids.push(dataObj.id);
          if (type === 'vendor') usersMap.get(key).vendor_ids.push(dataObj.id);
          if (type === 'account') usersMap.get(key).accounts.push(dataObj);
      };

      customers.forEach(c => addOrUpdateUser(c.name || `Customer #${c.id}`, 'customer', c));
      vendors.forEach(v => addOrUpdateUser(v.name || `Vendor #${v.id}`, 'vendor', v));
      flattenedAccounts.forEach(a => addOrUpdateUser(a.payment_category_name, 'account', a));

      // We need to match Cashbook accounts to names more fuzzily like in fund-transfer, 
      // but let's assume the exact lowercase match is what we want since we are grouping them globally.

      const allUsers = Array.from(usersMap.values());

      // Process in Chunks of 5 to not overwhelm the server
      const CHUNK_SIZE = 5;
      for (let i = 0; i < allUsers.length; i += CHUNK_SIZE) {
        const chunk = allUsers.slice(i, i + CHUNK_SIZE);
        setProgressMsg(`Calculating for users ${i + 1} to ${Math.min(i + CHUNK_SIZE, allUsers.length)} of ${allUsers.length}...`);

        const chunkPromises = [];
        chunk.forEach(user => {
            const payload = { start_date: filters.start_date, end_date: filters.end_date };
            const prevPayload = { start_date: prevStart.toISOString(), end_date: prevEnd.toISOString() };

            user.customer_ids.forEach(cid => {
                chunkPromises.push(axios.post(`${API_URL}/ledger-statement-report`, { ...payload, customer_id: cid }, baseHeaders).then(res => ({ user, type: 'ledger_curr', entityType: 'customer', data: res.data?.data || res.data })).catch(() => ({ user, type: 'ledger_curr', entityType: 'customer', data: null })));
                if (isPrevPeriodValid) chunkPromises.push(axios.post(`${API_URL}/ledger-statement-report`, { ...prevPayload, customer_id: cid }, baseHeaders).then(res => ({ user, type: 'ledger_prev', entityType: 'customer', data: res.data?.data || res.data })).catch(() => ({ user, type: 'ledger_prev', entityType: 'customer', data: null })));
            });

            user.vendor_ids.forEach(vid => {
                chunkPromises.push(axios.post(`${API_URL}/ledger-statement-report`, { ...payload, vendor_id: vid }, baseHeaders).then(res => ({ user, type: 'ledger_curr', entityType: 'vendor', data: res.data?.data || res.data })).catch(() => ({ user, type: 'ledger_curr', entityType: 'vendor', data: null })));
                if (isPrevPeriodValid) chunkPromises.push(axios.post(`${API_URL}/ledger-statement-report`, { ...prevPayload, vendor_id: vid }, baseHeaders).then(res => ({ user, type: 'ledger_prev', entityType: 'vendor', data: res.data?.data || res.data })).catch(() => ({ user, type: 'ledger_prev', entityType: 'vendor', data: null })));
            });

            user.accounts.forEach(acc => {
                const cbPayload = { start_date: payload.start_date, end_date: payload.end_date, view_order: "asc", payment_type_id: Number(acc.payment_type_id || acc.actual_payment_type_id || acc.id) };
                const cbPrevPayload = { start_date: prevPayload.start_date, end_date: prevPayload.end_date, view_order: "asc", payment_type_id: Number(acc.payment_type_id || acc.actual_payment_type_id || acc.id) };
                
                chunkPromises.push(axios.post(`${API_URL}/cash-book-report`, cbPayload, baseHeaders).then(res => ({ user, acc, type: 'cb_curr', data: res.data })).catch(() => ({ user, acc, type: 'cb_curr', data: null })));
                if (isPrevPeriodValid) chunkPromises.push(axios.post(`${API_URL}/cash-book-report`, cbPrevPayload, baseHeaders).then(res => ({ user, acc, type: 'cb_prev', data: res.data })).catch(() => ({ user, acc, type: 'cb_prev', data: null })));
            });
        });

        const chunkResults = await Promise.all(chunkPromises);

        const newBalances = chunk.map(user => {
            let userLedgerAED = 0;
            let userLedgerBDT = 0;
            let userCashAED = 0;
            let userCashBDT = 0;

            // 1. Process Ledger
            // For each customer/vendor id, compute their balance separately and add to running total
            const processLedger = (id, eType) => {
                const currDataList = chunkResults.filter(r => r.user.name === user.name && r.type === 'ledger_curr' && r.entityType === eType && r.data);
                const prevDataList = chunkResults.filter(r => r.user.name === user.name && r.type === 'ledger_prev' && r.entityType === eType && r.data);
                
                currDataList.forEach((currRes, idx) => {
                    const prevRes = prevDataList[idx]; // Assume matching index for same id (technically we should match by ID, but since we pushed them sequentially per user, this is fine. Let's make it robust though)
                    
                    let currentEntries = Array.isArray(currRes?.data?.ledger) ? currRes.data.ledger : [];
                    let prevEntries = Array.isArray(prevRes?.data?.ledger) ? prevRes.data.ledger : [];

                    let prevTotalDebit = 0;
                    let prevTotalCredit = 0;
                    prevEntries.forEach(e => {
                        let amt = Number(e.balance) || Number(e.amount) || Number(e.sub_total) || 0;
                        if (e.invoice_id) {
                            if (e.invoice_id.startsWith("INV-") && prevSalesMap.has(e.invoice_id)) {
                                const inv = prevSalesMap.get(e.invoice_id);
                                amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
                            } else if (e.invoice_id.startsWith("PUR-") && prevPurchaseMap.has(e.invoice_id)) {
                                const inv = prevPurchaseMap.get(e.invoice_id);
                                amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
                            }
                        }
                        if (eType === 'vendor') prevTotalDebit += amt;
                        if (eType === 'customer') prevTotalCredit += amt;
                    });
                    
                    let opBalance = prevTotalCredit - prevTotalDebit;
                    
                    currentEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    
                    let runAed = opBalance;
                    let runBdt = opBalance;

                    currentEntries.forEach(e => {
                        let amt = Number(e.balance) || Number(e.amount) || Number(e.sub_total) || 0;
                        if (e.invoice_id) {
                            if (e.invoice_id.startsWith("INV-") && salesMap.has(e.invoice_id)) {
                                const inv = salesMap.get(e.invoice_id);
                                amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
                            } else if (e.invoice_id.startsWith("PUR-") && purchaseMap.has(e.invoice_id)) {
                                const inv = purchaseMap.get(e.invoice_id);
                                amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
                            }
                        }
                        let debit = eType === 'vendor' ? amt : 0;
                        let credit = eType === 'customer' ? amt : 0;

                        const mode = (e?.pay_mode || "").toUpperCase();
                        if (mode.includes("AED")) {
                            runAed = runAed + credit - debit;
                        } else {
                            runBdt = runBdt + credit - debit;
                        }
                    });

                    userLedgerAED += runAed;
                    userLedgerBDT += runBdt;
                });
            };

            processLedger('any', 'customer');
            processLedger('any', 'vendor');

            // 2. Process Cashbook
            user.accounts.forEach(acc => {
                const cb = chunkResults.find(r => r.user.name === user.name && r.type === 'cb_curr' && r.acc.id === acc.id)?.data;
                const prevCb = chunkResults.find(r => r.user.name === user.name && r.type === 'cb_prev' && r.acc.id === acc.id)?.data;

                let opBal = 0;
                if (isPrevPeriodValid && prevCb) {
                    opBal = Number(prevCb.closing_balance ?? 0);
                }
                
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

                const accName = (acc.payment_category_name || "").toUpperCase();
                if (accName.includes("(DH)") || accName.includes("AED")) {
                    userCashAED += running;
                } else {
                    userCashBDT += running;
                }
            });

            return {
                name: user.name,
                aed: userLedgerAED + userCashAED,
                bdt: userLedgerBDT + userCashBDT
            };
        });

        // Append to state dynamically
        setUserBalances(prev => [...prev, ...newBalances].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setProgressMsg('Completed!');
      setTimeout(() => setProgressMsg(''), 3000);

    } catch (err) {
      console.error(err);
      toast.error("Failed to generate combined balance report");
      setProgressMsg('Error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto text-black p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Balance Sheet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grand Ending Balance for all users.
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 sm:p-6 flex items-center mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 w-full">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Start Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.start_date.slice(0, 10)}
                  onChange={(e) => handleFilterChange("start_date", e.target.value ? `${e.target.value}T00:00:00.000Z` : "")}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-700 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider">
                End Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.end_date.slice(0, 10)}
                  onChange={(e) => handleFilterChange("end_date", e.target.value ? `${e.target.value}T23:59:59.999Z` : "")}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-700 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 max-w-[120px]">
              <label className="text-[11px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider">
                AED Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={aedRate}
                  onChange={(e) => setAedRate(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 sm:py-2.5 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-700 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>
            <button
              onClick={apply}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 bg-black text-white text-xs sm:text-sm font-medium px-8 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[38px] sm:h-[42px]"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Report
            </button>
          </div>
      </div>

      {progressMsg && (
         <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 p-3 rounded-lg animate-pulse mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progressMsg}
         </div>
      )}

      {userBalances.length > 0 && (
         <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-neutral-600">
               <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                 <tr>
                   <th className="px-4 py-2">Name</th>
                   <th className="px-4 py-2 text-right">Grand Ending Balance (BDT)</th>
                   <th className="px-4 py-2 text-right">Grand Ending Balance (AED)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-200">
                 {userBalances.map((user, idx) => (
                   <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                     <td className="px-4 py-2 font-medium text-slate-800">{user.name}</td>
                     <td className={`px-4 py-2 text-right tabular-nums font-semibold ${user.bdt < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                       {fmt2(user.bdt)}
                     </td>
                     <td className={`px-4 py-2 text-right tabular-nums font-semibold ${user.aed < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                       <div className="flex flex-col items-end leading-tight">
                         <span>{fmt2(user.aed)} AED</span>
                         <span className="text-[10px] text-neutral-400 mt-0.5">= {fmt2(user.aed * aedRate)} BDT</span>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-neutral-50 font-bold text-slate-900 border-t-2 border-neutral-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
                 <tr>
                   <td className="px-4 py-3 text-right uppercase tracking-wider text-xs">Total balances</td>
                   <td className={`px-4 py-3 text-right tabular-nums ${sumBDT < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                     {fmt2(sumBDT)}
                   </td>
                   <td className={`px-4 py-3 text-right tabular-nums ${sumAED < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                     <div className="flex flex-col items-end leading-tight">
                         <span>{fmt2(sumAED)} AED</span>
                         <span className="text-[11px] text-neutral-600 mt-1">Total = {fmt2(sumAED)} * {aedRate} = {fmt2(sumAED * aedRate)} BDT</span>
                     </div>
                   </td>
                 </tr>
                 <tr className="border-t border-neutral-200 bg-emerald-50/50">
                   <td className="px-4 py-3 text-right uppercase tracking-wider text-xs text-emerald-800">Stock Balance</td>
                   <td className="px-4 py-3 text-right tabular-nums text-emerald-800">
                     {fmt2(stockBalance)}
                   </td>
                   <td className="px-4 py-3"></td>
                 </tr>
               </tfoot>
             </table>
           </div>
         </div>
      )}

    </div>
  );
}
