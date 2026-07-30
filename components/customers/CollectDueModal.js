'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

// Custom Select Component to avoid native browser dropdown glitches
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

export default function CollectDueModal({ open, onClose, customerId, customerName, totalDue = 0, onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [activeTab, setActiveTab] = useState('pay'); // 'pay', 'discount', 'balance'
  const [dueInvoices, setDueInvoices] = useState([]);
  const [gatewaysList, setGatewaysList] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pay Due Form State
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Due Discount Form State
  const [selectedDiscountInvoice, setSelectedDiscountInvoice] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  // Opening Balance Form State
  const [advanceAmount, setAdvanceAmount] = useState('');

  // Fetch due invoices and payment gateways on modal open
  useEffect(() => {
    if (open && token && customerId) {
      setLoadingInitial(true);

      const fetchInvoices = axios.get(`${API_URL}/customer-due-invoice-list/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchGateways = axios.get(`${API_URL}/payment-type-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Promise.all([fetchInvoices, fetchGateways])
        .then(([invRes, gwRes]) => {
          // Parse invoices array robustly
          const invArray = Array.isArray(invRes.data?.data?.data)
            ? invRes.data.data.data
            : Array.isArray(invRes.data?.data)
            ? invRes.data.data
            : Array.isArray(invRes.data)
            ? invRes.data
            : [];
          setDueInvoices(invArray);

          // Parse gateways array robustly
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
            setSelectedCategoryId(firstCat ? String(firstCat.id) : '1');
          } else {
            setSelectedGatewayId('1');
            setSelectedCategoryId('1');
          }
        })
        .catch((err) => {
          console.error('Error loading due modal data:', err);
          // Default fallback Cash gateway
          const fallback = [{ id: 1, type_name: 'Cash', payment_type_category: [{ id: 1, payment_category_name: 'Cash Account' }] }];
          setGatewaysList(fallback);
          setSelectedGatewayId('1');
          setSelectedCategoryId('1');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [open, token, customerId, API_URL]);

  if (!open) return null;

  const currentGateway = gatewaysList.find((g) => String(g.id) === String(selectedGatewayId));
  const categories = currentGateway?.payment_type_category || [];

  const handleGatewayChange = (gwId) => {
    setSelectedGatewayId(String(gwId));
    const gw = gatewaysList.find((g) => String(g.id) === String(gwId));
    const firstCat = gw?.payment_type_category?.[0];
    setSelectedCategoryId(firstCat ? String(firstCat.id) : '1');
  };

  // Submit Due Collection
  const handleDueSubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: Number(customerId),
        sale_invoice_id: selectedInvoice || null,
        paid_amount: Number(payAmount),
        payment_method: [
          {
            payment_type_id: Number(selectedGatewayId) || 1,
            payment_type_category_id: Number(selectedCategoryId) || 1,
            payment_amount: Number(payAmount),
          }
        ],
        custom_date: date,
      };

      const res = await axios.post(`${API_URL}/due-collection`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Due payment collected successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to submit due collection.');
      }
    } catch (err) {
      console.error('Due collection submit error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving due payment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Due Discount
  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDiscountInvoice) {
      toast.error('Please select an invoice first.');
      return;
    }
    if (!discountAmount || Number(discountAmount) <= 0) {
      toast.error('Please enter a valid discount amount.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        due: 'customer',
        invoice_id: selectedDiscountInvoice,
        discount_amount: Number(discountAmount),
      };

      const res = await axios.post(`${API_URL}/save-due-discount`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Due discount applied successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to apply due discount.');
      }
    } catch (err) {
      console.error('Due discount submit error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving discount.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Opening Balance
  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!advanceAmount || Number(advanceAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: Number(customerId),
        adv_amount: Number(advanceAmount),
      };

      const res = await axios.post(`${API_URL}/save-advance-due`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Advance due added successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to add advance due.');
      }
    } catch (err) {
      console.error('Advance due submit error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving advance due.');
    } finally {
      setSubmitting(false);
    }
  };

  // Options for Invoice Selects
  const invoiceOptions = [
    { id: '', name: 'All Invoices (General Payment)' },
    ...dueInvoices.map((inv) => {
      const idVal = inv.sale_invoice_id || inv.invoice_id;
      const dueVal = Number(inv.total_due || inv.due_amount || 0).toLocaleString();
      return {
        id: idVal,
        name: `${idVal} (Due: ৳ ${dueVal})`
      };
    })
  ];

  const discountInvoiceOptions = [
    { id: '', name: 'Select Invoice ID' },
    ...dueInvoices.map((inv) => {
      const idVal = inv.sale_invoice_id || inv.invoice_id;
      const dueVal = Number(inv.total_due || inv.due_amount || 0).toLocaleString();
      return {
        id: idVal,
        name: `${idVal} (Due: ৳ ${dueVal})`
      };
    })
  ];

  // Options for Gateway Select
  const gatewayOptions = gatewaysList.map((g) => ({
    id: String(g.id),
    name: g.type_name
  }));

  // Options for Category Select
  const categoryOptions = categories.map((c) => ({
    id: String(c.id),
    name: c.payment_category_name || c.account_name || 'Account'
  }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Collect Due Payment</h3>
            <p className="text-xs text-neutral-500">{customerName || 'Customer'} • #{customerId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-100/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('pay')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pay' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Pay Due
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discount')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'discount' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Due Discount
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'balance' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Opening Balance
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar text-black space-y-4">
          {loadingInitial ? (
            <div className="py-12 text-center text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-neutral-400" />
              <p className="text-xs">Loading customer due information...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PAY DUE */}
              {activeTab === 'pay' && (
                <form onSubmit={handleDueSubmit} className="space-y-4">
                  {/* Total Due Badge */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">Total Customer Due</span>
                    <span className="text-base font-bold text-rose-700 tabular-nums">৳ {Number(totalDue).toLocaleString()}</span>
                  </div>

                  {/* Select Invoice */}
                  <CustomSelect
                    label="Select Invoice (Optional)"
                    options={invoiceOptions}
                    value={selectedInvoice}
                    onChange={(val) => setSelectedInvoice(val)}
                    placeholder="All Invoices (General Payment)"
                  />

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Transaction Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-base sm:text-sm text-neutral-900 bg-white focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>

                  {/* Payment Gateway */}
                  <CustomSelect
                    label="Payment Method"
                    options={gatewayOptions}
                    value={selectedGatewayId}
                    onChange={(val) => handleGatewayChange(val)}
                    placeholder="Select Payment Method..."
                  />

                  {/* Payment Account Category (if non-cash) */}
                  {categoryOptions.length > 0 && currentGateway?.type_name?.toLowerCase() !== 'cash' && (
                    <CustomSelect
                      label="Account"
                      options={categoryOptions}
                      value={selectedCategoryId}
                      onChange={(val) => setSelectedCategoryId(val)}
                      placeholder="Select Account..."
                    />
                  )}

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Amount Paid (BDT)</label>
                    <div className="flex items-center">
                      <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3.5 py-2.5 rounded-l-xl text-neutral-500 text-sm font-medium">৳</span>
                      <input
                        required
                        type="number"
                        placeholder="Enter amount"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-r-xl text-base sm:text-sm font-semibold text-neutral-900 focus:ring-2 focus:ring-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {submitting ? 'Saving...' : 'Save Payment'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: DUE DISCOUNT */}
              {activeTab === 'discount' && (
                <form onSubmit={handleDiscountSubmit} className="space-y-4">
                  <CustomSelect
                    label="Select Invoice"
                    options={discountInvoiceOptions}
                    value={selectedDiscountInvoice}
                    onChange={(val) => setSelectedDiscountInvoice(val)}
                    placeholder="Select Invoice ID..."
                  />

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Discount Amount (BDT)</label>
                    <input
                      required
                      type="number"
                      placeholder="Enter discount amount"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-base sm:text-sm font-semibold text-neutral-900 focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {submitting ? 'Applying...' : 'Apply Discount'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: OPENING BALANCE */}
              {activeTab === 'balance' && (
                <form onSubmit={handleAdvanceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Advance / Opening Due Amount</label>
                    <input
                      required
                      type="number"
                      placeholder="Enter opening balance amount"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-base sm:text-sm font-semibold text-neutral-900 focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {submitting ? 'Saving...' : 'Add Advance Due'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
