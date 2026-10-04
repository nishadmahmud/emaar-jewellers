'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import DayWiseReportPDF from './day-wise-report-pdf';
import { extractAedRate } from '@/lib/currency';

import { getDhakaDateString, getDhakaDateTimeStart, getDhakaDateTimeEnd } from '@/lib/dateUtils';

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DayWiseReportPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [date, setDate] = useState(getDhakaDateString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const [salesBdt, setSalesBdt] = useState([]);
  const [salesAed, setSalesAed] = useState([]);
  const [purchasesBdt, setPurchasesBdt] = useState([]);
  const [purchasesAed, setPurchasesAed] = useState([]);
  const [txIn, setTxIn] = useState([]);
  const [txOut, setTxOut] = useState([]);
  const [profitLoss, setProfitLoss] = useState({ totalSalesBdt: 0, totalSalesAed: 0, totalPurchaseBdt: 0, totalPurchaseAed: 0, netProfit: 0 });
  const [balanceSheet, setBalanceSheet] = useState({ stockBalance: 0, sumBDT: 0, sumAED: 0, aedRate: 34, totalAssetBalance: 0 });

  const apply = async () => {
    if (!token) return;
    try {
      setIsGenerating(true);
      setProgressMsg('Fetching daily data...');
      const baseHeaders = { headers: { Authorization: `Bearer ${token}` } };

      const [salesInvoices, purchaseInvoices, accountsRaw] = await Promise.all([
        axios.post(`${API_URL}/search-invoice?page=1&limit=10000`, { keyword: '', nameId: false, emailId: false, phoneId: false, product: false, startDate: getDhakaDateTimeStart(date), endDate: getDhakaDateTimeEnd(date), dueOnly: false }, baseHeaders).then(r => r.data?.data?.data || []),
        axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=10000`, { keyword: '', nameId: false, emailId: false, phoneId: false, imei: false, start_date: getDhakaDateTimeStart(date), end_date: getDhakaDateTimeEnd(date) }, baseHeaders).then(r => r.data?.data?.data || []),
        axios.get(`${API_URL}/payment-type-category-list?t=${Date.now()}`, baseHeaders).then(r => r.data?.data?.data || r.data?.data || r.data || []),
      ]);

      const bdt = [], aed = [];
      salesInvoices.forEach(inv => {
        const isAed = (inv.pay_mode || '').includes('(AED @');
        const amount = (inv.sub_total || 0) - (inv.discount || 0);
        const rate = extractAedRate(inv, session?.user);
        const entry = { invoice_id: inv.invoice_id, name: inv.customer_name || 'Walk-in', isAed, amountBdt: isAed ? amount * rate : amount, amountAed: isAed ? amount : 0, aedRate: rate };
        if (isAed) aed.push(entry); else bdt.push(entry);
      });
      setSalesBdt(bdt); setSalesAed(aed);

      const pbdt = [], paed = [];
      purchaseInvoices.forEach(inv => {
        const isAed = (inv.pay_mode || '').includes('(AED @');
        const amount = (inv.sub_total || 0) - (inv.discount || 0);
        const rate = extractAedRate(inv, session?.user);
        const entry = { invoice_id: inv.invoice_id, name: inv.vendor_name || 'Unknown Vendor', isAed, amountBdt: isAed ? amount * rate : amount, amountAed: isAed ? amount : 0, aedRate: rate };
        if (isAed) paed.push(entry); else pbdt.push(entry);
      });
      setPurchasesBdt(pbdt); setPurchasesAed(paed);

      const totalSalesBdt = [...bdt, ...aed].reduce((s, i) => s + i.amountBdt, 0);
      const totalSalesAed = aed.reduce((s, i) => s + i.amountAed, 0);
      const totalPurchaseBdt = [...pbdt, ...paed].reduce((s, i) => s + i.amountBdt, 0);
      const totalPurchaseAed = paed.reduce((s, i) => s + i.amountAed, 0);
      setProfitLoss({ totalSalesBdt, totalSalesAed, totalPurchaseBdt, totalPurchaseAed, netProfit: totalSalesBdt - totalPurchaseBdt });

      // Flatten accounts
      const flatAccounts = [];
      accountsRaw.forEach(item => {
        if (Array.isArray(item.payment_type_category)) item.payment_type_category.forEach(acc => flatAccounts.push({ ...acc, actual_payment_type_id: item.id }));
        else flatAccounts.push({ ...item, actual_payment_type_id: item.id });
      });

      setProgressMsg('Fetching transactions and balances...');
      const cbResults = await Promise.all(
        flatAccounts.map(acc => axios.post(`${API_URL}/cash-book-report`, { start_date: getDhakaDateTimeStart(date), end_date: getDhakaDateTimeEnd(date), view_order: 'asc', payment_type_id: Number(acc.payment_type_id || acc.actual_payment_type_id || acc.id) }, baseHeaders).then(r => ({ acc, data: r.data })).catch(() => ({ acc, data: null })))
      );

      const inList = [], outList = [];
      cbResults.forEach(res => {
        if (res.data?.data) res.data.data.filter(r => r.date === date).forEach(r => {
          const entry = { type_name: r.type_name || r.type || '—', amount: Number(r.payment_amount || 0) };
          (r.status || '').toLowerCase() === 'debit' ? inList.push(entry) : outList.push(entry);
        });
      });
      setTxIn(inList); setTxOut(outList);

      // Balance Sheet
      setProgressMsg('Calculating balance sheet...');
      const [customers, vendors] = await Promise.all([
        axios.get(`${API_URL}/customer-lists?page=1&limit=5000`, baseHeaders).then(r => r.data?.data?.data || []),
        axios.get(`${API_URL}/vendor-lists?page=1&limit=5000`, baseHeaders).then(r => r.data?.data?.data || []),
      ]);

      const usersMap = new Map();
      const addUser = (nameStr, type, dataObj) => {
        if (!nameStr) return;
        const base = nameStr.replace(/\(BD\)/i, '').replace(/\(DH\)/i, '').replace(/\(AED\)/i, '').trim();
        const key = base.toLowerCase();
        if (!usersMap.has(key)) usersMap.set(key, { name: base, accounts: [] });
        if (type === 'account') usersMap.get(key).accounts.push(dataObj);
      };
      customers.forEach(c => addUser(c.name || `Customer #${c.id}`, 'customer', c));
      vendors.forEach(v => addUser(v.name || `Vendor #${v.id}`, 'vendor', v));
      flatAccounts.forEach(a => addUser(a.payment_category_name || a.name || 'Account', 'account', a));

      const allUsers = Array.from(usersMap.values());
      let sumBDT = 0, sumAED = 0;
      const CHUNK = 10;
      for (let i = 0; i < allUsers.length; i += CHUNK) {
        const chunk = allUsers.slice(i, i + CHUNK);
        setProgressMsg(`Balances ${i + 1}–${Math.min(i + CHUNK, allUsers.length)} of ${allUsers.length}...`);
        const chunkRes = await Promise.all(chunk.flatMap(user => [
          axios.post(`${API_URL}/party-ledger-report`, { start_date: date, end_date: date, name: user.name }, baseHeaders).then(r => ({ user, type: 'pl', data: r.data?.ledger || [] })).catch(() => ({ user, type: 'pl', data: [] })),
          axios.post(`${API_URL}/party-book-report`, { date, search: user.name }, baseHeaders).then(r => ({ user, type: 'pb', data: r.data?.data?.[0] || null })).catch(() => ({ user, type: 'pb', data: null })),
        ]));
        chunk.forEach(user => {
          let uAED = 0, uBDT = 0;
          const pb = chunkRes.find(r => r.user.name === user.name && r.type === 'pb');
          if (pb?.data) { uAED = Number(pb.data.aed?.opening_balance || 0); uBDT = Number(pb.data.cash?.opening_balance || 0); }
          const pl = chunkRes.find(r => r.user.name === user.name && r.type === 'pl');
          (pl?.data || []).forEach(e => {
            const c = Number(e.credit) || 0, d = Number(e.debit) || 0;
            (e.pay_mode || '').toUpperCase().includes('AED') ? (uAED += c - d) : (uBDT += c - d);
          });
          user.accounts.forEach(acc => {
            const cb = cbResults.find(r => r.acc.id === acc.id)?.data;
            let running = Number(cb?.opening_balance ?? 0);
            (cb?.data || []).sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(r => {
              running += ((r?.status || '').toLowerCase() === 'credit' ? 1 : -1) * Number(r?.payment_amount ?? 0);
            });
            (acc.payment_category_name || acc.name || '').toUpperCase().includes('AED') ? (uAED += running) : (uBDT += running);
          });
          sumAED += uAED; sumBDT += uBDT;
        });
      }

      const latestAedRate = [...aed, ...paed].slice(-1)[0]?.aedRate || 34;
      const totalSalesQty = salesInvoices.reduce((a, inv) => a + (inv.sales_details?.reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0), 0);
      const totalPurchaseQty = purchaseInvoices.reduce((a, inv) => a + (inv.purchase_details?.reduce((s, i) => s + (Number(i.qty) || 0), 0) || 0), 0);
      const avgPurchPrice = totalPurchaseQty > 0 ? totalPurchaseBdt / totalPurchaseQty : 0;
      const stockBalance = avgPurchPrice * Math.max(0, totalPurchaseQty - totalSalesQty);
      setBalanceSheet({ stockBalance, sumBDT, sumAED, aedRate: latestAedRate, totalAssetBalance: sumBDT + sumAED * latestAedRate + stockBalance });

      setProgressMsg('Done!');
      setTimeout(() => setProgressMsg(''), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
      setProgressMsg('Error occurred.');
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
          salesBdt={salesBdt} salesAed={salesAed}
          purchasesBdt={purchasesBdt} purchasesAed={purchasesAed}
          txIn={txIn} txOut={txOut}
          profitLoss={profitLoss} balanceSheet={balanceSheet}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Day_Wise_Report_${date}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Error generating PDF.');
    }
  }, [salesBdt, salesAed, purchasesBdt, purchasesAed, txIn, txOut, profitLoss, balanceSheet, date, session]);

  const hasData = salesBdt.length > 0 || salesAed.length > 0 || purchasesBdt.length > 0 || purchasesAed.length > 0;
  const displayDate = date ? date.split('-').reverse().join('/') : '';

  // Compute max rows for each big table section
  const topRows = Math.max(salesBdt.length, purchasesBdt.length, salesAed.length, purchasesAed.length, 1);
  const bottomRows = Math.max(txIn.length, txOut.length, 1);

  const td = 'border border-neutral-300 px-2 py-1 text-xs';
  const tdBold = td + ' font-bold';
  const thSection = 'border border-neutral-300 px-2 py-1.5 text-xs font-bold text-center text-white';
  const thCol = 'border border-neutral-300 px-2 py-1 text-[10px] font-bold text-center bg-neutral-100 uppercase tracking-wide';
  const totalTd = 'border border-neutral-300 px-2 py-1.5 text-xs font-bold bg-neutral-100';

  return (
    <div className="max-w-[98%] mx-auto space-y-4 text-black">

      {/* Controls */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-52 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <button onClick={apply} disabled={isGenerating}
          className="h-[38px] px-6 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-60">
          {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Generate
        </button>
        <button onClick={handlePDFExport} disabled={isGenerating || !hasData}
          className="h-[38px] px-6 bg-white text-black border border-neutral-200 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 disabled:opacity-40 sm:ml-auto">
          <FileText size={15} className="text-red-500" /> Export PDF
        </button>
        {progressMsg && <p className="text-sm text-blue-600 font-medium">{progressMsg}</p>}
      </div>

      {/* ══════════════ MAIN STATEMENT TABLE ══════════════ */}
      <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">

            {/* ── Master header ── */}
            <thead>
              <tr>
                <td colSpan={2} className="border border-neutral-300 px-4 py-3 bg-yellow-400">
                  <span className="text-lg font-extrabold tracking-wide text-neutral-900">DAILY STATEMENT</span>
                </td>
                <td colSpan={2} className="border border-neutral-300 px-3 py-3 bg-yellow-400" />
                <td colSpan={2} className="border border-neutral-300 px-3 py-3 bg-yellow-400" />
                <td colSpan={2} className="border border-neutral-300 px-3 py-3 bg-yellow-400" />
                <td colSpan={2} className="border border-neutral-300 px-4 py-3 bg-yellow-400 text-right">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">DATE:&nbsp;</span>
                  <span className="text-base font-extrabold text-neutral-900">{displayDate}</span>
                </td>
              </tr>

              {/* ── Section labels ── */}
              <tr>
                <th colSpan={2} className={`${thSection} bg-emerald-700`}>Received BDT</th>
                <th colSpan={2} className={`${thSection} bg-rose-700`}>Payment BDT</th>
                <th colSpan={2} className={`${thSection} bg-teal-700`}>Received AED</th>
                <th colSpan={2} className={`${thSection} bg-orange-700`}>Payment AED</th>
                <th colSpan={2} className={`${thSection} bg-blue-700`}>Profit &amp; Loss</th>
              </tr>

              {/* ── Column headers ── */}
              <tr>
                <th className={thCol} style={{ width: '11%' }}>NAME</th>
                <th className={thCol} style={{ width: '6%' }}>AMOUNT</th>
                <th className={thCol} style={{ width: '11%' }}>NAME</th>
                <th className={thCol} style={{ width: '6%' }}>AMOUNT</th>
                <th className={thCol} style={{ width: '8%' }}>NAME</th>
                <th className={thCol} style={{ width: '6%' }}>AED / RATE</th>
                <th className={thCol} style={{ width: '8%' }}>NAME</th>
                <th className={thCol} style={{ width: '6%' }}>AED / RATE</th>
                <th className={thCol} style={{ width: '14%' }}>ITEM</th>
                <th className={thCol} style={{ width: '8%' }}>AMOUNT</th>
              </tr>
            </thead>

            <tbody>
              {/* ── Data rows ── */}
              {Array.from({ length: topRows }).map((_, i) => {
                const sb = salesBdt[i];
                const pb = purchasesBdt[i];
                const sa = salesAed[i];
                const pa = purchasesAed[i];

                // P&L column: show summary items at specific row positions
                const plItems = [
                  { label: 'Sales (BDT)', val: `৳ ${fmt2(salesBdt.reduce((s, x) => s + x.amountBdt, 0))}`, highlight: false },
                  { label: 'Sales AED→BDT', val: `৳ ${fmt2(salesAed.reduce((s, x) => s + x.amountBdt, 0))}`, highlight: false },
                  { label: 'TOTAL SALES', val: `৳ ${fmt2(profitLoss.totalSalesBdt)}`, highlight: 'emerald' },
                  { label: 'Purchase (BDT)', val: `৳ ${fmt2(purchasesBdt.reduce((s, x) => s + x.amountBdt, 0))}`, highlight: false },
                  { label: 'Purchase AED→BDT', val: `৳ ${fmt2(purchasesAed.reduce((s, x) => s + x.amountBdt, 0))}`, highlight: false },
                  { label: 'TOTAL PURCHASE', val: `৳ ${fmt2(profitLoss.totalPurchaseBdt)}`, highlight: 'rose' },
                  { label: 'NET PROFIT', val: `৳ ${fmt2(profitLoss.netProfit)}`, highlight: profitLoss.netProfit >= 0 ? 'emerald' : 'rose' },
                ];
                const plRow = plItems[i] || null;

                return (
                  <tr key={i} className="hover:bg-neutral-50">
                    {/* Received BDT */}
                    <td className={td}>
                      {sb ? <><span className="font-semibold block">{sb.invoice_id}</span><span className="text-neutral-500 text-[10px]">{sb.name}</span></> : ''}
                    </td>
                    <td className={`${td} text-right`}>{sb ? `৳ ${fmt2(sb.amountBdt)}` : ''}</td>

                    {/* Payment BDT */}
                    <td className={td}>
                      {pb ? <><span className="font-semibold block">{pb.invoice_id}</span><span className="text-neutral-500 text-[10px]">{pb.name}</span></> : ''}
                    </td>
                    <td className={`${td} text-right`}>{pb ? `৳ ${fmt2(pb.amountBdt)}` : ''}</td>

                    {/* Received AED */}
                    <td className={td}>
                      {sa ? <><span className="font-semibold block">{sa.invoice_id}</span><span className="text-neutral-500 text-[10px]">{sa.name}</span></> : ''}
                    </td>
                    <td className={`${td} text-right`}>
                      {sa ? <><span className="block">AED {fmt2(sa.amountAed)}</span><span className="text-[10px] text-neutral-500">@{sa.aedRate}</span></> : ''}
                    </td>

                    {/* Payment AED */}
                    <td className={td}>
                      {pa ? <><span className="font-semibold block">{pa.invoice_id}</span><span className="text-neutral-500 text-[10px]">{pa.name}</span></> : ''}
                    </td>
                    <td className={`${td} text-right`}>
                      {pa ? <><span className="block">AED {fmt2(pa.amountAed)}</span><span className="text-[10px] text-neutral-500">@{pa.aedRate}</span></> : ''}
                    </td>

                    {/* P&L (right col) */}
                    <td className={`${td} ${plRow?.highlight === 'emerald' ? 'bg-emerald-50 font-bold' : plRow?.highlight === 'rose' ? 'bg-rose-50 font-bold' : ''}`}>
                      {plRow?.label || ''}
                    </td>
                    <td className={`${td} text-right ${plRow?.highlight === 'emerald' ? 'bg-emerald-50 font-bold text-emerald-700' : plRow?.highlight === 'rose' ? 'bg-rose-50 font-bold text-rose-700' : ''}`}>
                      {plRow?.val || ''}
                    </td>
                  </tr>
                );
              })}

              {/* ── TOTALS row ── */}
              <tr className="bg-neutral-100">
                <td className={totalTd}>TOTAL RECEIVED</td>
                <td className={`${totalTd} text-right text-emerald-700`}>৳ {fmt2(salesBdt.reduce((s, x) => s + x.amountBdt, 0))}</td>
                <td className={totalTd}>TOTAL PAYMENT</td>
                <td className={`${totalTd} text-right text-rose-700`}>৳ {fmt2(purchasesBdt.reduce((s, x) => s + x.amountBdt, 0))}</td>
                <td className={totalTd}>TOTAL AED</td>
                <td className={`${totalTd} text-right text-teal-700`}>AED {fmt2(salesAed.reduce((s, x) => s + x.amountAed, 0))}</td>
                <td className={totalTd}>TOTAL AED</td>
                <td className={`${totalTd} text-right text-orange-700`}>AED {fmt2(purchasesAed.reduce((s, x) => s + x.amountAed, 0))}</td>
                <td className={`${totalTd} font-extrabold`}>NET PROFIT</td>
                <td className={`${totalTd} text-right font-extrabold ${profitLoss.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ৳ {fmt2(profitLoss.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════ TRANSACTIONS + BALANCE SHEET TABLE ══════════════ */}
      <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th colSpan={2} className={`${thSection} bg-blue-700`}>Transactions — Money In</th>
                <th colSpan={2} className={`${thSection} bg-purple-700`}>Transactions — Money Out</th>
                <th colSpan={2} className={`${thSection} bg-slate-700`}>Balance Sheet</th>
              </tr>
              <tr>
                <th className={thCol} style={{ width: '24%' }}>ACCOUNT / TYPE</th>
                <th className={thCol} style={{ width: '10%' }}>AMOUNT (৳)</th>
                <th className={thCol} style={{ width: '24%' }}>ACCOUNT / TYPE</th>
                <th className={thCol} style={{ width: '10%' }}>AMOUNT (৳)</th>
                <th className={thCol} style={{ width: '20%' }}>ITEM</th>
                <th className={thCol} style={{ width: '12%' }}>VALUE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: bottomRows }).map((_, i) => {
                const ti = txIn[i];
                const to = txOut[i];

                const bsItems = [
                  { label: 'Party Balances (BDT)', val: `৳ ${fmt2(balanceSheet.sumBDT)}` },
                  { label: 'Party Balances (AED)', val: `AED ${fmt2(balanceSheet.sumAED)}` },
                  { label: `AED→BDT (Rate: ${balanceSheet.aedRate})`, val: `৳ ${fmt2(balanceSheet.sumAED * balanceSheet.aedRate)}` },
                  { label: 'Stock Value', val: `৳ ${fmt2(balanceSheet.stockBalance)}` },
                  { label: 'GRAND ASSET TOTAL', val: `৳ ${fmt2(balanceSheet.totalAssetBalance)}`, bold: true },
                ];
                const bsRow = bsItems[i] || null;

                return (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className={td}>{ti?.type_name || ''}</td>
                    <td className={`${td} text-right text-emerald-700 font-medium`}>{ti ? `+${fmt2(ti.amount)}` : ''}</td>
                    <td className={td}>{to?.type_name || ''}</td>
                    <td className={`${td} text-right text-rose-700 font-medium`}>{to ? `-${fmt2(to.amount)}` : ''}</td>
                    <td className={`${td} ${bsRow?.bold ? 'font-bold bg-neutral-100' : ''}`}>{bsRow?.label || ''}</td>
                    <td className={`${td} text-right ${bsRow?.bold ? 'font-bold bg-neutral-100' : ''}`}>{bsRow?.val || ''}</td>
                  </tr>
                );
              })}

              {/* Totals */}
              <tr className="bg-neutral-100">
                <td className={totalTd}>TOTAL IN</td>
                <td className={`${totalTd} text-right text-blue-700`}>+{fmt2(txIn.reduce((s, t) => s + t.amount, 0))}</td>
                <td className={totalTd}>TOTAL OUT</td>
                <td className={`${totalTd} text-right text-purple-700`}>-{fmt2(txOut.reduce((s, t) => s + t.amount, 0))}</td>
                <td className={`${totalTd} font-extrabold`}>GRAND ASSET TOTAL</td>
                <td className={`${totalTd} text-right font-extrabold text-slate-700`}>৳ {fmt2(balanceSheet.totalAssetBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
