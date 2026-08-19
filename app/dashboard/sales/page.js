'use client';

import React, { useEffect, useState } from 'react';
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={className}>{children}</div>;
import { Search, Loader2, Eye, Pencil, Receipt, ShoppingCart, ChevronRight, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function SalesHistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await axios.post(
          `${API_URL}/search-invoice?page=${currentPage}&limit=${limit}`,
          {
            keyword: search,
            nameId: false,
            emailId: false,
            phoneId: false,
            product: false,
            startDate: 0,
            endDate: new Date().toISOString(),
            dueOnly: false,
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.data?.success && res.data?.data) {
          setInvoices(res.data.data.data || []);
          setTotalInvoices(res.data.data.total || 0);
        } else {
          setInvoices([]);
          setTotalInvoices(0);
        }
      } catch (err) {
        toast.error('Failed to load sales history');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchInvoices();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, currentPage, limit, session?.accessToken]);

  const totalPages = Math.ceil(totalInvoices / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sales History</h1>
          <p className="text-sm text-neutral-500 mt-1">View and manage all your past sales invoices.</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search by ID or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <CardContent>
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center text-neutral-400">
                <Receipt className="h-10 w-10 mb-2 opacity-50" />
                <p>No sales invoices found.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="block sm:hidden divide-y divide-neutral-100">
                {invoices.map((inv) => {
                  const payModeString = inv.pay_mode || '';
                  const isAed = payModeString.includes('(AED @');
                  const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
                  const aedRate = isAed && aedRateMatch ? parseFloat(aedRateMatch[1]) : 1;
                  const currency = isAed ? 'AED' : 'BDT';

                  const totalBdt = inv.sub_total - inv.discount;
                  const dueBdt = Math.max(totalBdt - inv.paid_amount, 0);

                  return (
                    <div
                      key={inv.id}
                      onClick={() => router.push(`/dashboard/invoice/sale/${inv.invoice_id}`)}
                      className="px-3 py-3 flex items-center justify-between hover:bg-neutral-50/60 active:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 shrink-0 flex items-center justify-center text-xs font-bold">
                          <ShoppingCart size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-neutral-900 truncate">{inv.invoice_id}</p>
                          <p className="text-xs text-neutral-600 truncate">{inv.customer_name || 'Walk-in Customer'}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                            {new Date(inv.created_at).toLocaleDateString()} {inv.customer_phone && `• ${inv.customer_phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1 pl-1">
                        <div>
                          <p className="font-bold text-xs text-neutral-900">{currency} {Number(totalBdt).toLocaleString(undefined, {minimumFractionDigits: isAed ? 2 : 0})}</p>
                          {dueBdt > 0 ? (
                            <span className="inline-block text-[9px] bg-rose-50 text-rose-700 font-semibold px-1.5 py-0.5 rounded-full border border-rose-200 mt-0.5">
                              Due {currency} {Number(dueBdt).toLocaleString(undefined, {minimumFractionDigits: isAed ? 2 : 0})}
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                              Paid
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/sell/edit/${inv.invoice_id}`); }}
                            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Invoice"
                          >
                            <Pencil size={14} />
                          </button>
                          <ChevronRight size={14} className="text-neutral-400 shrink-0" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Invoice ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium text-right">Total</th>
                      <th className="px-6 py-4 font-medium text-right">Paid</th>
                      <th className="px-6 py-4 font-medium text-right">Due</th>
                      <th className="px-6 py-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {invoices.map((inv) => {
                      const payModeString = inv.pay_mode || '';
                      const isAed = payModeString.includes('(AED @');
                      const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
                      const aedRate = isAed && aedRateMatch ? parseFloat(aedRateMatch[1]) : 1;
                      const currency = isAed ? 'AED' : 'BDT';

                      const totalBdt = inv.sub_total - inv.discount;
                      const paidBdt = inv.paid_amount;
                      const dueBdt = Math.max(totalBdt - paidBdt, 0);

                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-neutral-900">
                            {inv.invoice_id}
                          </td>
                          <td className="px-6 py-4 text-neutral-500">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-neutral-700">
                            {inv.customer_name || 'Walk-in Customer'}
                            {inv.customer_phone && <span className="block text-xs text-neutral-400">{inv.customer_phone}</span>}
                          </td>
                          <td className="px-6 py-4 text-right text-neutral-900 font-medium">
                            {currency} {Number(totalBdt).toLocaleString(undefined, {minimumFractionDigits: isAed ? 2 : 0})}
                          </td>
                          <td className="px-6 py-4 text-right text-green-600">
                            {currency} {Number(paidBdt).toLocaleString(undefined, {minimumFractionDigits: isAed ? 2 : 0})}
                          </td>
                          <td className="px-6 py-4 text-right text-red-600">
                            {currency} {Number(dueBdt).toLocaleString(undefined, {minimumFractionDigits: isAed ? 2 : 0})}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => router.push(`/dashboard/invoice/sale/${inv.invoice_id}`)}
                                className="inline-flex items-center justify-center p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
                                title="View Invoice"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard/sell/edit/${inv.invoice_id}`)}
                                className="inline-flex items-center justify-center p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit Invoice"
                              >
                                <Pencil size={18} />
                              </button>
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
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-neutral-100 bg-neutral-50/30">
            {/* Mobile Pagination */}
            <div className="flex flex-col sm:hidden p-3 gap-2.5">
              <div className="text-xs text-neutral-500 text-center">
                Showing <span className="font-semibold text-neutral-900">{(currentPage - 1) * limit + 1}</span>-
                <span className="font-semibold text-neutral-900">{Math.min(currentPage * limit, totalInvoices)}</span> of{' '}
                <span className="font-semibold text-neutral-900">{totalInvoices}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 disabled:opacity-40 flex items-center justify-center gap-1 active:bg-neutral-100"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs font-semibold text-neutral-800 px-3 py-1 bg-white border border-neutral-200 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 disabled:opacity-40 flex items-center justify-center gap-1 active:bg-neutral-100"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden sm:flex p-4 items-center justify-between">
              <div className="text-sm text-neutral-500">
                Showing <span className="font-medium text-neutral-900">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-medium text-neutral-900">{Math.min(currentPage * limit, totalInvoices)}</span> of{' '}
                <span className="font-medium text-neutral-900">{totalInvoices}</span> results
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-neutral-200 bg-white text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 2)
                  .map((p, i, arr) => (
                    <div key={p} className="flex">
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-2 py-1 text-neutral-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded border text-sm font-medium ${
                          currentPage === p
                            ? 'bg-black border-black text-white'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-neutral-200 bg-white text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
