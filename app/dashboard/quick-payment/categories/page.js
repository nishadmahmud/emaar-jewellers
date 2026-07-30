'use client';

import React, { useState } from 'react';
import { Search, Plus, Trash2, Tag, Eye, Edit, Loader2 } from 'lucide-react';
import axios from 'axios';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import QuickPaymentTabNav from '@/components/quick-payment/QuickPaymentTabNav';
import AddQuickPaymentCategoryModal from '@/components/quick-payment/AddQuickPaymentCategoryModal';
import EditQuickPaymentCategoryModal from '@/components/quick-payment/EditQuickPaymentCategoryModal';
import ViewQuickPaymentCategoryModal from '@/components/quick-payment/ViewQuickPaymentCategoryModal';

export default function PaymentCategoriesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetcher = async (url) => {
    try {
      const res = await axios.get(`${API_URL}/get-payment-expense-type-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch {
      const fallbackRes = await axios.get(`${API_URL}/expense-catogory-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return fallbackRes.data;
    }
  };

  const { data: categoryRes, isLoading, mutate } = useSWR(
    token ? `${API_URL}/quick-payment-categories` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const categoryList = Array.isArray(categoryRes?.data?.data)
    ? categoryRes.data.data
    : Array.isArray(categoryRes?.data)
    ? categoryRes.data
    : Array.isArray(categoryRes)
    ? categoryRes
    : [];

  const filteredCategories = categoryList.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = item.expense_name || item.name || item.catogory_name || '';
    const transCat = item.transaction_category || '';
    const desc = item.expense_description || item.description || '';
    return name.toLowerCase().includes(q) || transCat.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  });

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment category?')) return;
    setDeletingId(id);
    try {
      const res = await axios.post(
        `${API_URL}/delete-expense-type`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Payment category deleted successfully!');
        mutate();
      } else {
        toast.error(res.data?.message || 'Failed to delete payment category.');
      }
    } catch (err) {
      console.error('Delete category error:', err);
      toast.error(err.response?.data?.message || 'Error deleting category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 text-black">
      {/* Tab Header */}
      <QuickPaymentTabNav activeTab="categories" />

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payment category by name, type, description..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200/90 rounded-xl text-xs sm:text-sm text-black placeholder-neutral-400 outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Payment Category</span>
        </button>
      </div>

      {/* Table / Mobile Cards List */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-xs">Loading payment categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm font-medium">
            No payment categories found.
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {filteredCategories.map((category) => {
                const name = category.expense_name || category.name || category.catogory_name || 'General';
                const transCat = category.transaction_category || 'Quick Payment';
                const desc = category.expense_description || category.description || '-';

                return (
                  <div key={category.id} className="p-4 space-y-2 hover:bg-neutral-50/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900">{name}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <Tag size={12} />
                        {transCat}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-2">{desc}</p>

                    <div className="flex justify-between items-center pt-1.5 border-t border-neutral-100">
                      <span className="text-[11px] font-mono text-neutral-400">#{category.id}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingCategory(category)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title="View Category"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(category)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          {deletingId === category.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
                    <th className="py-3.5 px-5">Category Name</th>
                    <th className="py-3.5 px-5">Transaction Category</th>
                    <th className="py-3.5 px-5">Description</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredCategories.map((category) => {
                    const name = category.expense_name || category.name || category.catogory_name || 'General';
                    const transCat = category.transaction_category || 'Quick Payment';
                    const desc = category.expense_description || category.description || '-';

                    return (
                      <tr key={category.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-neutral-500">#{category.id}</td>
                        <td className="py-3.5 px-5 font-bold text-neutral-900">{name}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {transCat}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-neutral-600 max-w-xs truncate">{desc}</td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingCategory(category)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title="View Category"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategory(category)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category.id)}
                              disabled={deletingId === category.id}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              {deletingId === category.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
      <AddQuickPaymentCategoryModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => mutate()}
      />

      <EditQuickPaymentCategoryModal
        open={Boolean(editingCategory)}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSuccess={() => mutate()}
      />

      <ViewQuickPaymentCategoryModal
        open={Boolean(viewingCategory)}
        category={viewingCategory}
        onClose={() => setViewingCategory(null)}
      />
    </div>
  );
}
