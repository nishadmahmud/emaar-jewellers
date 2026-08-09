'use client';
// Force Turbopack refresh

import { useState, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import { 
  Loader2, 
  Search, 
  Calendar, 
  Users,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

const formatNumber = (num, decimals = 3) => {
  if (num === null || num === undefined) return '';
  if (num === 0) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

function DueReportContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') || 'customer';
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const past = new Date();
    past.setDate(past.getDate() - 30);
    return {
      start_date: past.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
      due: ['customer', 'vendor', 'wholesaler', 'exporter', 'carrier'].includes(defaultType) ? defaultType : 'customer',
    };
  });

  const dueTypes = [
    { value: 'customer', label: 'Customer Due' },
    { value: 'vendor', label: 'Vendor Due' },
    { value: 'wholesaler', label: 'Wholesaler Due' },
    { value: 'exporter', label: 'Exporter Due' },
    { value: 'carrier', label: 'Carrier Due' },
  ];

  const postFetcher = ([url, body]) => 
    axios.post(url, body, { 
      headers: { Authorization: `Bearer ${session?.accessToken}` } 
    }).then(res => res.data);

  const fetchKey = session?.accessToken 
    ? [`${process.env.NEXT_PUBLIC_API}/date-wise-due-list`, filters] 
    : null;

  const { data, isLoading } = useSWR(fetchKey, postFetcher, {
    revalidateOnFocus: false,
  });

  const rawRows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  // Group & merge rows by customer/vendor name
  const rows = useMemo(() => {
    const map = new Map();
    rawRows.forEach((r) => {
      const nameKey = (r.name || 'Unknown').trim().toLowerCase();
      
      if (searchTerm && !nameKey.includes(searchTerm.toLowerCase())) {
        return;
      }
      
      if (!map.has(nameKey)) {
        map.set(nameKey, {
          name: r.name || 'N/A',
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
      invoice_display: item.invoices.length > 1 
        ? `${item.invoices.length} Invoices` 
        : (item.invoices[0] || 'N/A')
    }));
  }, [rawRows, searchTerm]);

  const totals = useMemo(() => {
    return rows.reduce((acc, curr) => ({
      total: acc.total + curr.total_amount,
      paid: acc.paid + curr.paid_amount,
      due: acc.due + curr.due,
    }), { total: 0, paid: 0, due: 0 });
  }, [rows]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              Due Report History
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              View and filter due records across different categories.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Due Type</label>
            <select 
              name="due" 
              value={filters.due} 
              onChange={handleFilterChange}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none appearance-none"
            >
              {dueTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-40">
            <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Start Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="date" 
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="w-full md:w-40">
            <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">End Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="date" 
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Amount</p>
              <p className="text-xl font-bold text-neutral-900 mt-1">BDT {formatNumber(totals.total, 2)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Paid Amount</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">BDT {formatNumber(totals.paid, 2)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border-rose-200 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-12 h-12 text-rose-600" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-rose-600/80 uppercase tracking-wider">Total Due</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">BDT {formatNumber(totals.due, 2)}</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden flex flex-col min-h-[400px]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-rose-500" />
              <p className="text-sm font-medium">Loading due records...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-base font-semibold text-neutral-900">No records found</p>
              <p className="text-sm mt-1">Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50/80 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-4 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Invoice Info</th>
                    <th className="px-6 py-4 font-semibold text-neutral-700 text-xs uppercase tracking-wider text-right">Total Amount</th>
                    <th className="px-6 py-4 font-semibold text-neutral-700 text-xs uppercase tracking-wider text-right">Paid Amount</th>
                    <th className="px-6 py-4 font-semibold text-rose-600 text-xs uppercase tracking-wider text-right">Due Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-neutral-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">
                        {row.invoice_display}
                        {row.invoices.length > 1 && (
                          <span className="block text-[10px] text-neutral-400 font-normal mt-0.5">
                            Last: {row.invoices[row.invoices.length - 1]}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-neutral-900">
                        {formatNumber(row.total_amount, 2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        {formatNumber(row.paid_amount, 2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 bg-rose-50/30">
                        {formatNumber(row.due, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}

export default function DueReportPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>}>
      <DueReportContent />
    </Suspense>
  );
}
