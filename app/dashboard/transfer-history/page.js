'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from 'lucide-react';
import Select from 'react-select';
import TransferHistoryPDF from './transfer-history-pdf';

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

export default function TransferHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [filters, setFilters] = useState({
    start_date: todayStartISO(),
    end_date: todayEndISO(),
    view_order: 'asc',
    payment_type_id: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);

  useEffect(() => {
    if (!token) return;
    const fetchPaymentTypes = async () => {
      try {
        const res = await axios.get(`${API_URL}/payment-type-list?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaymentTypes(res.data?.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch payment types', err);
      }
    };
    fetchPaymentTypes();
  }, [token, API_URL]);

  useEffect(() => {
    if (!token) return;
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const body = {
          start_date: appliedFilters.start_date,
          end_date: appliedFilters.end_date,
          view_order: appliedFilters.view_order,
        };
        if (appliedFilters.payment_type_id !== 'all') {
          body.payment_type_id = Number(appliedFilters.payment_type_id);
        }
        const res = await axios.post(`${API_URL}/cash-book-report`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReportData(res.data);
      } catch (err) {
        console.error('Failed to fetch report', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [token, API_URL, appliedFilters]);

  const selectedPayTypeName =
    filters.payment_type_id === 'all'
      ? 'All'
      : paymentTypes.find((p) => String(p.id) === String(filters.payment_type_id))?.type_name || 'All';

  const rawRows = reportData?.data || [];
  const openingBalance = Number(reportData?.opening_balance ?? 0);
  const closingBalance = Number(reportData?.closing_balance ?? 0);
  const totalCreditAPI = Number(reportData?.current_total_credit ?? 0);
  const totalDebitAPI = Number(reportData?.current_total_debit ?? 0);

  const baseRows = useMemo(() => {
    return (rawRows || []).map((r) => {
      const status = (r?.status || '').toLowerCase();
      const amount = Number(r?.payment_amount ?? 0);
      const debit = status === 'debit' || status === 'out' ? amount : 0;
      const credit = status === 'credit' ? amount : 0;
      return {
        date: r?.date || '',
        particulars: r?.particulars || '',
        paymentType: r?.type_name || '',
        vchType: r?.type || '',
        vchNumber: r?.invoice_id || '',
        debit,
        credit,
      };
    });
  }, [rawRows]);

  const ascRows = useMemo(() => {
    return [...baseRows].sort((a, b) => a.date.localeCompare(b.date));
  }, [baseRows]);

  const ascWithBalance = useMemo(() => {
    let running = openingBalance;
    return ascRows.map((r, idx) => {
      running = running + r.credit - r.debit;
      return { ...r, balance: running, _ascIndex: idx + 1 };
    });
  }, [ascRows, openingBalance]);

  const openingRow = useMemo(
    () => ({
      serial: 0,
      date: (appliedFilters?.start_date || '').slice(0, 10),
      particulars: '',
      paymentType: '',
      vchType: 'Opening Balance',
      vchNumber: '',
      debit: 0,
      credit: 0,
      balance: openingBalance,
      isOpening: true,
    }),
    [appliedFilters?.start_date, openingBalance]
  );

  const displayRows = useMemo(() => {
    const order = appliedFilters.view_order || 'asc';
    const data = order === 'desc' ? [...ascWithBalance].reverse() : ascWithBalance;
    return data.map((r, i) => ({
      serial: i + 1,
      ...r,
    }));
  }, [ascWithBalance, appliedFilters.view_order]);

  const [searchTerm, setSearchTerm] = useState('');
  const filteredRows = useMemo(() => {
    if (!searchTerm) return displayRows;
    const q = searchTerm.toLowerCase();
    return displayRows.filter((r) => {
      return (
        (r.particulars || '').toLowerCase().includes(q) ||
        (r.vchNumber || '').toLowerCase().includes(q) ||
        (r.paymentType || '').toLowerCase().includes(q) ||
        (r.vchType || '').toLowerCase().includes(q) ||
        (r.date || '').toLowerCase().includes(q)
      );
    });
  }, [displayRows, searchTerm]);

  const totals = useMemo(() => {
    if (!searchTerm) {
      return {
        debit: totalDebitAPI,
        credit: totalCreditAPI,
        closing: closingBalance,
      };
    }
    const debit = filteredRows.reduce((s, r) => s + r.debit, 0);
    const credit = filteredRows.reduce((s, r) => s + r.credit, 0);
    const closing = openingBalance + credit - debit;
    return { debit, credit, closing };
  }, [
    searchTerm,
    filteredRows,
    totalDebitAPI,
    totalCreditAPI,
    closingBalance,
    openingBalance,
  ]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const apply = () => setAppliedFilters(filters);

  const handleExcelExport = () => {
    const rowsToExport = [openingRow, ...filteredRows];
    const sheetData = rowsToExport.map((r) => ({
      'Serial No': r.serial,
      'Transaction Date': r.date,
      Particulars: r.particulars,
      'Payment Types': r.paymentType,
      'Vch Types': r.vchType,
      'Vch Number': r.vchNumber,
      'Debit (BDT)': r.debit,
      'Credit (BDT)': r.credit,
      'Balance (BDT)': r.balance,
    }));
    sheetData.push({
      'Serial No': '',
      'Transaction Date': '',
      Particulars: 'Totals',
      'Payment Types': '',
      'Vch Types': '',
      'Vch Number': '',
      'Debit (BDT)': totals.debit,
      'Credit (BDT)': totals.credit,
      'Balance (BDT)': totals.closing,
    });

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Book');
    XLSX.writeFile(
      wb,
      `transfer-history-${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handlePDFExport = async () => {
    const blob = await pdf(
      <TransferHistoryPDF
        openingRow={openingRow}
        rows={filteredRows}
        totals={totals}
        filters={appliedFilters}
        user={session?.user}
        payTypeName={selectedPayTypeName}
      />
    ).toBlob();
    saveAs(
      blob,
      `transfer-history-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const tableRef = useRef(null);
  const handlePrintTable = () => {
    if (!tableRef.current) return;
    const content = tableRef.current.innerHTML;
    const w = window.open('', 'PRINT', 'height=900,width=1200');
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Transfer History</title>
          <style>
            * { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            thead th { background: #e8f5c8; }
            th, td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${content}
          <script>window.onload = function(){ window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-black">Transfer History</h1>
            <p className="text-sm text-neutral-500">Ledger of cash movement with running balance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[250px,1fr] gap-4">
        {/* KPI */}
        <div className="bg-emerald-500 text-white p-6 rounded-xl shadow-sm border border-emerald-600 flex flex-col justify-center items-center text-center">
          <p className="text-2xl font-bold break-all">
            {fmt2(totals.closing)} BDT
          </p>
          <p className="text-emerald-100 mt-1 font-medium">Closing Balance</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Start Date</label>
              <input
                type="date"
                value={filters.start_date.slice(0, 10)}
                onChange={(e) => handleFilterChange('start_date', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">End Date</label>
              <input
                type="date"
                value={filters.end_date.slice(0, 10)}
                onChange={(e) => handleFilterChange('end_date', e.target.value ? `${e.target.value}T23:59:59.999Z` : '')}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Payment Type</label>
              <Select
                options={[
                  { value: 'all', label: 'Select All' },
                  ...paymentTypes.map((p) => ({ value: String(p.id), label: p.type_name }))
                ]}
                value={
                  filters.payment_type_id === 'all'
                    ? { value: 'all', label: 'Select All' }
                    : { 
                        value: filters.payment_type_id, 
                        label: paymentTypes.find((p) => String(p.id) === String(filters.payment_type_id))?.type_name || 'Select All'
                      }
                }
                onChange={(option) => handleFilterChange('payment_type_id', option?.value || 'all')}
                isSearchable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#e5e7eb",
                    "&:hover": { borderColor: "#d1d5db" },
                    minHeight: '38px',
                    borderRadius: '0.5rem',
                    backgroundColor: "#f9fafb",
                    fontSize: '0.875rem'
                  }),
                }}
              />
            </div>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Order</label>
                <Select
                  options={[
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' }
                  ]}
                  value={
                    filters.view_order === 'desc'
                      ? { value: 'desc', label: 'Descending' }
                      : { value: 'asc', label: 'Ascending' }
                  }
                  onChange={(option) => handleFilterChange('view_order', option?.value || 'asc')}
                  isSearchable={false}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      "&:hover": { borderColor: "#d1d5db" },
                      minHeight: '38px',
                      borderRadius: '0.5rem',
                      backgroundColor: "#f9fafb",
                      fontSize: '0.875rem'
                    }),
                  }}
                />
              </div>
              <button
                onClick={apply}
                className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all h-9 mt-5"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-neutral-200 gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search particulars, vch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black text-black"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Export Data
          </button>
          
          {isExportOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { handleExcelExport(); setIsExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Excel
                </button>
                <button
                  onClick={() => { handlePDFExport(); setIsExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <FileText size={14} className="text-red-500" /> PDF
                </button>
                <button
                  onClick={() => { handlePrintTable(); setIsExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Printer size={14} className="text-blue-500" /> Print Table
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">Loading data...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <div ref={tableRef} className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Sl</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Particulars</th>
                    <th className="px-4 py-3 font-semibold">Payment Type</th>
                    <th className="px-4 py-3 font-semibold">Vch Type</th>
                    <th className="px-4 py-3 font-semibold">Vch Number</th>
                    <th className="px-4 py-3 font-semibold text-right">Debit</th>
                    <th className="px-4 py-3 font-semibold text-right">Credit</th>
                    <th className="px-4 py-3 font-semibold text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  <tr className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-500">-</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{openingRow.date}</td>
                    <td className="px-4 py-3 text-neutral-900 font-medium">Opening Balance</td>
                    <td className="px-4 py-3 text-neutral-500"></td>
                    <td className="px-4 py-3 text-neutral-500"></td>
                    <td className="px-4 py-3 text-neutral-500"></td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">0.00</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">0.00</td>
                    <td className="px-4 py-3 text-right text-black font-semibold">{fmt2(openingRow.balance)}</td>
                  </tr>
                  
                  {filteredRows.map((r, i) => (
                    <tr key={`${r.serial}-${r.vchNumber}-${r.date}`} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{r.date}</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{r.particulars || '-'}</td>
                      <td className="px-4 py-3 text-neutral-600">{r.paymentType || '-'}</td>
                      <td className="px-4 py-3 text-neutral-600">{r.vchType || '-'}</td>
                      <td className="px-4 py-3 text-neutral-600">{r.vchNumber || '-'}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">{fmt2(r.debit)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{fmt2(r.credit)}</td>
                      <td className="px-4 py-3 text-right text-black font-semibold">{fmt2(r.balance)}</td>
                    </tr>
                  ))}
                  
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50 border-t border-neutral-200">
                    <td colSpan={6} className="px-4 py-3 text-right font-semibold text-neutral-900">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{fmt2(totals.debit)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt2(totals.credit)}</td>
                    <td className="px-4 py-3 text-right font-bold text-black">{fmt2(totals.closing)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
