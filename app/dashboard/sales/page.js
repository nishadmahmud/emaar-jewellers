'use client';

import React, { useEffect, useState } from 'react';
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`p-6 ${className || ''}`}>{children}</div>;
import { Search, Loader2, Eye, Receipt } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function SalesHistoryPage() {
  const [invoices, setInvoices] = useState([]);
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
          `${API_URL}/search-invoice?page=1&limit=50`,
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

        if (res.data?.success && res.data?.data?.data) {
          setInvoices(res.data.data.data);
        } else {
          setInvoices([]);
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
  }, [search, session?.accessToken]);

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
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <Receipt className="h-10 w-10 mb-2 opacity-50" />
                        <p>No sales invoices found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
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
                        ৳ {Number(inv.sub_total - inv.discount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">
                        ৳ {Number(inv.paid_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600">
                        ৳ {Math.max((inv.sub_total - inv.discount) - inv.paid_amount, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => router.push(`/dashboard/invoice/sale/${inv.invoice_id}`)}
                          className="inline-flex items-center justify-center p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
                          title="View Invoice"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
