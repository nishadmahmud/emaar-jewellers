'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Search, Plus, Eye, Loader2, Download, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function normalizeBdMobileInput(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length >= 11 && d.startsWith("880")) return d.slice(-11);
  if (d.length >= 11 && d.startsWith("0")) return d.slice(0, 11);
  if (d.length >= 11) return d.slice(-11);
  return d;
}

export default function CustomerListPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add Customer Modal State
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '', email: '', mobile_number: '', address: '', is_member: 0
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [existingCustList, setExistingCustList] = useState([]);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const fetchCustomers = useCallback(async (searchQuery = "", page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      let res;
      if (searchQuery.trim()) {
        res = await axios.post(`${API_URL}/search-customer?page=${page}&limit=${limit}`, { keyword: searchQuery }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.get(`${API_URL}/customer-lists?page=${page}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const data = res.data?.data;
      setCustomers(data?.data || []);
      setTotalCustomers(data?.total || 0);
    } catch (err) {
      console.error("Failed to fetch customers", err);
      toast.error("Failed to fetch customer list.");
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(keyword, currentPage);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [keyword, currentPage, fetchCustomers]);

  const totalPages = Math.ceil(totalCustomers / limit);

  const handlePrint = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await axios.get(`${API_URL}/customer-lists?page=1&limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const exportData = res.data?.data?.data || [];
      
      if (!exportData.length) {
        toast.error("No data found for export.");
        return;
      }

      const rowsHtml = exportData
        .map(
          (c, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td>${c.name}</td>
            <td>${c.mobile_number || '-'}</td>
            <td class="text-right">${c.total_due_amount?.toLocaleString("en-IN") || 0} BDT</td>
            <td class="text-center">${c.invoice_list_count || 0}</td>
            <td class="text-right">${Number(c.total_purchase_amount || 0).toLocaleString("en-IN")} BDT</td>
          </tr>`
        )
        .join("");

      const win = window.open("", "PRINT", "height=900,width=1200");
      win.document.write(`
        <html>
          <head><title>Customer List</title>
            <style>
              body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 24px; color: #000; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e5e5e5; padding: 10px; font-size: 13px; }
              thead th { background: #f9fafb; font-weight: 600; text-align: left; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              h2 { font-size: 20px; font-weight: 600; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Customer List Report</h2>
            <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Generated on ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th class="text-center">SL</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th class="text-right">Due Amount</th>
                  <th class="text-center">Purchase Count</th>
                  <th class="text-right">Total Purchase (BDT)</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
            <script>window.onload = () => {window.print(); window.close();}</script>
          </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error("Export error", err);
      toast.error("Failed to prepare export.");
    } finally {
      setExporting(false);
    }
  };

  // Add Customer Logic (Reused from sell page)
  const normalizedPhone = normalizeBdMobileInput(newCustomer.mobile_number);
  
  useEffect(() => {
    if (normalizedPhone.length !== 11) {
      setPhoneWarning(false);
      setExistingCustList([]);
      return;
    }
    const delay = setTimeout(() => {
      if (!token) return;
      setIsCheckingPhone(true);
      axios.post(`${API_URL}/search-customer?page=1&limit=5`, { keyword: normalizedPhone }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const found = res.data?.data?.data || [];
        if (found.length > 0) {
          setExistingCustList(found);
          setPhoneWarning(true);
        } else {
          setPhoneWarning(false);
          setExistingCustList([]);
        }
      }).catch(err => {
        console.error("Phone check error", err);
      }).finally(() => setIsCheckingPhone(false));
    }, 500);
    return () => clearTimeout(delay);
  }, [normalizedPhone, token, API_URL]);

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!token) return;
    setSavingCustomer(true);
    axios.post(`${API_URL}/save-customer`, newCustomer, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      toast.success("Customer added successfully!");
      setShowAddCustomer(false);
      setNewCustomer({ name: '', email: '', mobile_number: '', address: '', is_member: 0 });
      fetchCustomers(keyword, currentPage); // Refresh list
    }).catch(err => {
      toast.error("Failed to save customer");
      console.error(err);
    }).finally(() => setSavingCustomer(false));
  };


  return (
    <div className="max-w-7xl mx-auto text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Customer List</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage and view all registered customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={exporting}
            className="flex items-center gap-2 bg-white text-black border border-neutral-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Name, Phone..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <p className="text-sm">No customers found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="bg-neutral-100/50 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200">ID / Name</th>
                  <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200">Mobile</th>
                  <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200 text-right">Due Amount</th>
                  <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200 text-center">Purchases</th>
                  <th className="py-3 px-6 font-semibold text-neutral-900 border-r border-neutral-200 text-right">Total Amount</th>
                  <th className="py-3 px-6 font-semibold text-neutral-900 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-6 border-r border-neutral-100">
                      <div className="font-medium text-neutral-900">#{c.id}</div>
                      <div className="text-xs text-neutral-500">{c.name || 'Unnamed'}</div>
                    </td>
                    <td className="py-3 px-6 border-r border-neutral-100 text-neutral-600">
                      {c.mobile_number || '-'}
                    </td>
                    <td className="py-3 px-6 border-r border-neutral-100 text-right text-red-600 font-medium tabular-nums">
                      {c.total_due_amount?.toLocaleString("en-IN") || 0} BDT
                    </td>
                    <td className="py-3 px-6 border-r border-neutral-100 text-center tabular-nums">
                      {c.invoice_list_count || 0}
                    </td>
                    <td className="py-3 px-6 border-r border-neutral-100 text-right font-medium tabular-nums">
                      {Number(c.total_purchase_amount || 0).toLocaleString("en-IN")} BDT
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Link href={`/dashboard/customers/${c.id}?interval=daily`}>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                          <Eye size={14} /> View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Showing <span className="font-medium text-neutral-900">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-neutral-900">{Math.min(currentPage * limit, totalCustomers)}</span> of <span className="font-medium text-neutral-900">{totalCustomers}</span> results
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-neutral-200 bg-white text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 2).map((p, i, arr) => (
                <div key={p} className="flex">
                  {i > 0 && p - arr[i-1] > 1 && <span className="px-2 py-1 text-neutral-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 rounded border text-sm font-medium ${currentPage === p ? 'bg-black border-black text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    {p}
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-neutral-200 bg-white text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-neutral-800 mb-4 tracking-wide">Add New Customer</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="Customer Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile Number</label>
                <input
                  required
                  type="text"
                  value={newCustomer.mobile_number}
                  onChange={e => setNewCustomer({...newCustomer, mobile_number: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black outline-none ${phoneWarning ? 'border-amber-400 focus:ring-amber-500' : 'border-neutral-200'}`}
                  placeholder="e.g. 01XXXXXXXXX"
                />
                
                {isCheckingPhone && normalizedPhone.length === 11 && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600 text-xs animate-pulse">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Searching for existing customers...
                  </div>
                )}
                
                {phoneWarning && existingCustList.length > 0 && !isCheckingPhone && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-amber-800 font-medium pt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Customer(s) with this phone already exist:</span>
                    </div>
                    {existingCustList.slice(0, 2).map((c) => (
                      <div key={c.id} className="text-xs text-amber-700 ml-6">
                        • {c.name || c.customer_name}
                      </div>
                    ))}
                    {existingCustList.length > 2 && (
                      <div className="text-xs text-amber-600 ml-6">
                        ...and {existingCustList.length - 2} more
                      </div>
                    )}
                    <div className="text-xs text-amber-600 ml-6 mt-1 italic">
                      You can still proceed to add this customer if needed.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="123 Street Name"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 flex items-center"
                >
                  {savingCustomer ? <Loader2 size={16} className="animate-spin mr-2" /> : null} 
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
