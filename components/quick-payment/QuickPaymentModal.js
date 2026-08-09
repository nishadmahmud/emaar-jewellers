'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, ChevronDown, Check, CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

function CustomSelect({ label, options = [], value, onChange, placeholder = 'Select option...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.id) === String(value));

  return (
    <div className="relative w-full text-black" ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-medium flex items-center justify-between text-neutral-900 hover:bg-neutral-100/70 focus:outline-none focus:ring-2 focus:ring-black transition-all cursor-pointer"
      >
        <span className={selectedOption ? 'text-black font-semibold truncate' : 'text-neutral-400 truncate'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-black' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-52 overflow-y-auto p-1 text-black custom-scrollbar animate-in fade-in duration-100">
          {options.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-neutral-400 text-center">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.id) === String(value);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-black text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function QuickPaymentModal({ open, onClose }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [categories, setCategories] = useState([]);
  const [gatewaysList, setGatewaysList] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedAccountCatId, setSelectedAccountCatId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setAmount('');
      setRemarks('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  useEffect(() => {
    if (open && token) {
      setLoadingInitial(true);

      const fetchCat = axios.get(`${API_URL}/get-payment-expense-type-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchGw = axios.get(`${API_URL}/payment-type-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Promise.all([fetchCat, fetchGw])
        .then(([catRes, gwRes]) => {
          const catList = Array.isArray(catRes.data?.data?.data)
            ? catRes.data.data.data
            : Array.isArray(catRes.data?.data)
            ? catRes.data.data
            : Array.isArray(catRes.data)
            ? catRes.data
            : [];
          setCategories(catList);
          if (catList.length > 0) setSelectedCategoryId(String(catList[0].id));

          let gwArray = Array.isArray(gwRes.data?.data?.data)
            ? gwRes.data.data.data
            : Array.isArray(gwRes.data?.data)
            ? gwRes.data.data
            : Array.isArray(gwRes.data)
            ? gwRes.data
            : [];
          if (gwArray.length === 0) {
            gwArray = [{ id: 1, type_name: 'Cash', payment_type_category: [{ id: 1, payment_category_name: 'Cash Account' }] }];
          }
          setGatewaysList(gwArray);

          const cashGw = gwArray.find((g) => g.type_name?.toLowerCase() === 'cash') || gwArray[0];
          if (cashGw) {
            setSelectedGatewayId(String(cashGw.id));
            const firstCat = cashGw.payment_type_category?.[0];
            setSelectedAccountCatId(firstCat ? String(firstCat.id) : '1');
          }
        })
        .catch(() => {
          const fallback = [{ id: 1, type_name: 'Cash', payment_type_category: [{ id: 1, payment_category_name: 'Cash Account' }] }];
          setGatewaysList(fallback);
          setSelectedGatewayId('1');
          setSelectedAccountCatId('1');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [open, token, API_URL]);

  if (!open) return null;

  const currentGateway = gatewaysList.find((g) => String(g.id) === String(selectedGatewayId));
  const accountCategories = currentGateway?.payment_type_category || [];

  const handleGatewayChange = (gwId) => {
    setSelectedGatewayId(String(gwId));
    const gw = gatewaysList.find((g) => String(g.id) === String(gwId));
    const firstCat = gw?.payment_type_category?.[0];
    setSelectedAccountCatId(firstCat ? String(firstCat.id) : '1');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      toast.error('Please select a quick payment type.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedCategoryName = categories.find((c) => String(c.id) === String(selectedCategoryId))?.expense_name || '';

      const payload = {
        catogory_id: Number(selectedCategoryId),
        expense_type_id: Number(selectedCategoryId),
        catogory_name: selectedCategoryName,
        amount: Number(amount),
        date,
        transaction_date: date,
        remarks: remarks || '',
        description: remarks || '',
        type_id: 0, 
        payment_method: [
          {
            payment_type_id: Number(selectedGatewayId) || 1,
            payment_type_category_id: Number(selectedAccountCatId) || 1,
            payment_amount: Number(amount),
          }
        ]
      };

      const res = await axios.post(`${API_URL}/save-expense`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Quick payment saved successfully!');
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to save quick payment.');
      }
    } catch (err) {
      console.error('Save quick payment error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-100 text-black flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-neutral-900">Add Quick Payment</h3>
            <p className="text-xs text-neutral-500">Record an instant collection or payment</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {loadingInitial ? (
            <div className="py-12 text-center text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-neutral-400" />
              <p className="text-xs font-medium">Loading types...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Category */}
              <CustomSelect
                label="Payment Category"
                options={categories.map((c) => ({ id: c.id, name: c.expense_name || c.name || c.catogory_name }))}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                placeholder="Select Payment Type"
              />

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Amount (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <CustomSelect
                label="Payment Method"
                options={gatewaysList.map((g) => ({ id: g.id, name: g.type_name }))}
                value={selectedGatewayId}
                onChange={handleGatewayChange}
              />

              {/* Account Category */}
              {accountCategories.length > 0 && (
                <CustomSelect
                  label="Account Category"
                  options={accountCategories.map((c) => ({ id: c.id, name: c.payment_category_name }))}
                  value={selectedAccountCatId}
                  onChange={setSelectedAccountCatId}
                />
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Remarks / Description
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional payment note..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  Save Payment
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
