'use client';

import React, { useState } from 'react';
import { X, Tag, FileText, Loader2, Save } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function AddQuickPaymentCategoryModal({ open, onClose, onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [formData, setFormData] = useState({
    expense_name: '',
    transaction_category: 'Quick Payment',
    expense_description: '',
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expense_name.trim()) {
      toast.error('Please enter a category name.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        expense_name: formData.expense_name.trim(),
        transaction_category: formData.transaction_category || 'Quick Payment',
        expense_description: formData.expense_description.trim(),
        transaction_type_id: 0,
      };

      const res = await axios.post(`${API_URL}/save-expense-type`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Payment category created successfully!');
        setFormData({ expense_name: '', transaction_category: 'Quick Payment', expense_description: '' });
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to create payment category.');
      }
    } catch (err) {
      console.error('Error creating payment category:', err);
      toast.error(err.response?.data?.message || 'Failed to create payment category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Add Payment Category</h3>
              <p className="text-xs text-neutral-500">Create a category for quick payment classification</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Category Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <FileText size={14} className="text-neutral-500" />
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.expense_name}
              onChange={(e) => handleChange('expense_name', e.target.value)}
              placeholder="e.g. Utility, Transfer, Advance..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>

          {/* Transaction Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Tag size={14} className="text-neutral-500" />
              Transaction Category
            </label>
            <select
              value={formData.transaction_category}
              onChange={(e) => handleChange('transaction_category', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black transition-all"
            >
              <option value="Quick Payment">Quick Payment</option>
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <FileText size={14} className="text-neutral-500" />
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.expense_description}
              onChange={(e) => handleChange('expense_description', e.target.value)}
              placeholder="Enter category description..."
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
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
