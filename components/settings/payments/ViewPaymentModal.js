'use client';

import React, { useState } from 'react';
import { X, Plus, Edit3, Trash2, Building2, Briefcase, CreditCard, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function ViewPaymentModal({ isOpen, onClose, method, onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [isAdding, setIsAdding] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [optimisticDeletedAccountIds, setOptimisticDeletedAccountIds] = useState([]);
  
  const [formData, setFormData] = useState({
    payment_category_name: '',
    account_number: '',
    branch_name: '',
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen || !method) return null;

  const resetForm = () => {
    setFormData({ payment_category_name: '', account_number: '', branch_name: '' });
    setIsAdding(false);
    setEditingAccountId(null);
  };

  const handleSaveAdd = async () => {
    if (!formData.payment_category_name) {
      toast.error('Account Name is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        payment_type_id: method.id,
      };
      const res = await axios.post(`${API_URL}/payment-type-category-save`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Account added successfully');
        onSuccess?.();
        resetForm();
      } else {
        toast.error(res.data?.message || 'Failed to add account');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error adding account');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.payment_category_name) {
      toast.error('Account Name is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        id: editingAccountId,
        payment_type_id: method.id,
      };
      const res = await axios.post(`${API_URL}/payment-type-category-update`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Account updated successfully');
        onSuccess?.();
        resetForm();
      } else {
        toast.error(res.data?.message || 'Failed to update account');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/payment-type-category-delete`, { id: accountId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Account deleted successfully');
        setOptimisticDeletedAccountIds(prev => [...prev, accountId]);
        onSuccess?.();
      } else {
        toast.error(res.data?.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error deleting account');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (account) => {
    setEditingAccountId(account.id);
    setIsAdding(false);
    setFormData({
      payment_category_name: account.payment_category_name || '',
      account_number: account.account_number || '',
      branch_name: account.branch_name || '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold text-slate-500 overflow-hidden">
              {method.icon_image ? (
                <img src={method.icon_image.startsWith('http') ? method.icon_image : `${process.env.NEXT_PUBLIC_BASE_URL || API_URL?.replace('/api', '')}/${method.icon_image}`} alt="" className="w-full h-full object-cover" />
              ) : (
                method.icon_letter || method.type_name?.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">{method.type_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  (!method.status || method.status === 'active' || method.status === 1 || method.status === '1') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {(!method.status || method.status === 'active' || method.status === 1 || method.status === '1') ? 'active' : 'inactive'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar bg-slate-50 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Associated Accounts ({method.payment_type_category?.length || 0})</h3>
            {!isAdding && !editingAccountId && (
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Account
              </button>
            )}
          </div>

          {(isAdding || editingAccountId) && (
            <div className="bg-white p-4 rounded-xl border border-neutral-200 mb-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-3">{isAdding ? 'Add New Account' : 'Edit Account'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Account Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.payment_category_name}
                    onChange={(e) => setFormData({ ...formData, payment_category_name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:ring-2 focus:ring-black/5"
                    placeholder="e.g., Main Branch, Personal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:ring-2 focus:ring-black/5"
                    placeholder="e.g., 01700000000"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Branch Details</label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:ring-2 focus:ring-black/5"
                    placeholder="e.g., Dhaka Branch"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={isAdding ? handleSaveAdd : handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 disabled:opacity-70"
                >
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  {isAdding ? 'Save Account' : 'Update Account'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {method.payment_type_category?.filter(acc => !optimisticDeletedAccountIds.includes(acc.id)).map((account) => (
              <div key={account.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-start justify-between group hover:border-neutral-300 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{account.payment_category_name}</span>
                  </div>
                  {account.account_number && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CreditCard size={14} className="text-slate-400" />
                      <span>{account.account_number}</span>
                    </div>
                  )}
                  {account.branch_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 size={14} className="text-slate-400" />
                      <span>{account.branch_name}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(account)}
                    disabled={isAdding || editingAccountId !== null}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    disabled={loading || isAdding || editingAccountId !== null}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {(!method.payment_type_category || method.payment_type_category.filter(acc => !optimisticDeletedAccountIds.includes(acc.id)).length === 0) && !isAdding && (
              <div className="text-center py-8 bg-white border border-neutral-200 border-dashed rounded-xl">
                <p className="text-sm text-slate-500">No accounts configured for this payment method.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
