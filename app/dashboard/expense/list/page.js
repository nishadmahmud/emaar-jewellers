'use client';

import React, { useState } from 'react';
import { Search, Plus, Trash2, Calendar, Loader2, DollarSign, Tag, FileText, Eye, Edit } from 'lucide-react';
import axios from 'axios';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import ExpenseTabNav from '@/components/expense/ExpenseTabNav';
import AddExpenseModal from '@/components/expense/AddExpenseModal';
import EditExpenseModal from '@/components/expense/EditExpenseModal';
import ViewExpenseModal from '@/components/expense/ViewExpenseModal';

const formatBDT = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ExpenseListPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);

  const { data: expenseRes, isLoading, mutate } = useSWR(
    token ? `${API_URL}/expense-history-list?page=1&limit=100` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const expenseList = Array.isArray(expenseRes?.data?.data)
    ? expenseRes.data.data
    : Array.isArray(expenseRes?.data)
    ? expenseRes.data
    : Array.isArray(expenseRes)
    ? expenseRes
    : [];

  const filteredExpenses = expenseList.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const catName = item.catogory_name || item.category_name || item.category?.name || '';
    const note = item.remarks || item.description || item.note || '';
    const date = item.transaction_date || item.date || item.created_at || '';
    return (
      catName.toLowerCase().includes(q) ||
      note.toLowerCase().includes(q) ||
      date.toLowerCase().includes(q) ||
      String(item.amount).includes(q)
    );
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    setDeletingId(id);
    try {
      const res = await axios.post(`${API_URL}/delete-expense`, { id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Expense deleted successfully!');
        mutate();
      } else {
        toast.error(res.data?.message || 'Failed to delete expense.');
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      toast.error(err.response?.data?.message || 'Error deleting expense.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 text-black">
      {/* Tab Header */}
      <ExpenseTabNav activeTab="list" />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-xl font-extrabold text-rose-600 mt-1">BDT {formatBDT(totalExpenseSum)}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Entries</p>
            <p className="text-xl font-extrabold text-neutral-900 mt-1">{filteredExpenses.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Period</p>
            <p className="text-sm font-bold text-neutral-800 mt-1">This Month</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by category, date, note, or amount..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200/90 rounded-xl text-xs sm:text-sm text-black placeholder-neutral-400 outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Table / Mobile Cards List */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-xs">Loading expense list...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm font-medium">
            No expense records found.
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {filteredExpenses.map((expense) => {
                const catName = expense.catogory_name || expense.category_name || expense.category?.name || 'General';
                const dateStr = expense.transaction_date || expense.date || (expense.created_at ? new Date(expense.created_at).toLocaleDateString() : 'N/A');
                const note = expense.remarks || expense.description || expense.note || '-';
                return (
                  <div key={expense.id} className="p-4 space-y-2 hover:bg-neutral-50/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                        <Tag size={12} />
                        {catName}
                      </span>
                      <span className="font-extrabold text-sm text-rose-600">BDT {formatBDT(expense.amount)}</span>
                    </div>

                    <div className="flex justify-between items-end text-xs text-neutral-500 pt-1">
                      <div>
                        <p className="font-medium text-neutral-800">{note}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{dateStr}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingExpense(expense)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingExpense(expense)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          {deletingId === expense.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-100 text-xs">
                  <tr>
                    <th className="py-3.5 px-5">ID</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Remarks / Note</th>
                    <th className="py-3.5 px-5 text-right">Amount (BDT)</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredExpenses.map((expense) => {
                    const catName = expense.catogory_name || expense.category_name || expense.category?.name || 'General';
                    const dateStr = expense.transaction_date || expense.date || (expense.created_at ? new Date(expense.created_at).toLocaleDateString() : 'N/A');
                    const note = expense.remarks || expense.description || expense.note || '-';
                    return (
                      <tr key={expense.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-neutral-500">#{expense.id}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            {catName}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-medium text-neutral-700">{dateStr}</td>
                        <td className="py-3.5 px-5 text-neutral-600 max-w-xs truncate">{note}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-rose-600">BDT {formatBDT(expense.amount)}</td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingExpense(expense)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingExpense(expense)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(expense.id)}
                              disabled={deletingId === expense.id}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              {deletingId === expense.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
      </div>

      {/* Modals */}
      <AddExpenseModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => mutate()}
      />

      <EditExpenseModal
        open={Boolean(editingExpense)}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSuccess={() => mutate()}
      />

      <ViewExpenseModal
        open={Boolean(viewingExpense)}
        expense={viewingExpense}
        onClose={() => setViewingExpense(null)}
      />
    </div>
  );
}
