'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, Tag, Calendar, DollarSign, FileText, Loader2, Save } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function EditExpenseModal({ open, expense, onClose, onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && token) {
      setLoadingInitial(true);
      axios
        .get(`${API_URL}/get-expense-type-list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() =>
          axios.get(`${API_URL}/expense-catogory-list`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
        .then((res) => {
          const list = Array.isArray(res.data?.data?.data)
            ? res.data.data.data
            : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setCategories(list);
        })
        .catch((err) => console.error('Failed to load categories', err))
        .finally(() => setLoadingInitial(false));
    }
  }, [open, token, API_URL]);

  useEffect(() => {
    if (expense) {
      setSelectedCategoryId(String(expense.catogory_id || expense.expense_type_id || expense.category_id || ''));
      setAmount(String(expense.amount || ''));
      setDate(expense.transaction_date || expense.date || new Date().toISOString().split('T')[0]);
      setRemarks(expense.remarks || expense.description || expense.note || '');
    }
  }, [expense]);

  if (!open || !expense) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid expense amount.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: expense.id,
        expense_type_id: selectedCategoryId ? Number(selectedCategoryId) : undefined,
        amount: Number(amount),
        transaction_date: date,
        remarks: remarks.trim(),
        description: remarks.trim(),
      };

      const res = await axios.post(`${API_URL}/update-expense/${expense.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Expense updated successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to update expense.');
      }
    } catch (err) {
      console.error('Update expense error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while updating expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Edit Expense Transaction</h3>
              <p className="text-xs text-neutral-500">Update details for expense record #{expense.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        {loadingInitial ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Loading form details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <Tag size={14} className="text-neutral-500" />
                Expense Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.expense_name || cat.name || cat.catogory_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-neutral-500" />
                  Amount (AED) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-neutral-500" />
                  Expense Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <FileText size={14} className="text-neutral-500" />
                Remarks / Note
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional expense note..."
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black transition-all resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold border border-neutral-200 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Update Expense</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
