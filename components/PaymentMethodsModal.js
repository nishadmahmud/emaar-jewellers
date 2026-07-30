'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, CreditCard, Banknote, Building2, CheckCircle2, ChevronDown, Check } from 'lucide-react';

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
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm font-medium flex items-center justify-between text-neutral-800 hover:bg-neutral-100/60 focus:outline-none focus:ring-2 focus:ring-black transition-all"
      >
        <span className={selectedOption ? 'text-black font-semibold' : 'text-neutral-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-black' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1.5 text-black custom-scrollbar animate-in fade-in duration-100">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-400 text-center">No options available</div>
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
                  className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-black text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-800 font-medium'
                  }`}
                >
                  <span>{opt.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function PaymentMethodsModal({
  open,
  onClose,
  total = 0,
  paymentGateways = [],
  savedMethods = [],
  onSave,
}) {
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [primaryAmount, setPrimaryAmount] = useState('');
  const [extraMethods, setExtraMethods] = useState([]);

  const gatewaysList = Array.isArray(paymentGateways)
    ? paymentGateways
    : Array.isArray(paymentGateways?.data?.data)
    ? paymentGateways.data.data
    : Array.isArray(paymentGateways?.data)
    ? paymentGateways.data
    : [];

  // Sync state whenever modal opens or total/savedMethods change
  useEffect(() => {
    if (open) {
      if (savedMethods && savedMethods.length > 0) {
        const first = savedMethods[0];
        setSelectedMethodId(String(first.payment_type_id || ''));
        setSelectedAccountId(String(first.payment_type_category_id || ''));
        setPrimaryAmount(first.payment_amount ?? total);

        if (savedMethods.length > 1) {
          setExtraMethods(
            savedMethods.slice(1).map((m, idx) => ({
              id: Date.now() + idx,
              payment_type_id: String(m.payment_type_id || ''),
              payment_type_category_id: String(m.payment_type_category_id || ''),
              payment_amount: m.payment_amount ?? 0,
            }))
          );
        } else {
          setExtraMethods([]);
        }
      } else {
        const cashGateway = gatewaysList.find(
          (g) => g.type_name?.toLowerCase() === 'cash'
        ) || gatewaysList[0];

        if (cashGateway) {
          setSelectedMethodId(String(cashGateway.id));
          const firstCategory = cashGateway.payment_type_category?.[0];
          setSelectedAccountId(firstCategory ? String(firstCategory.id) : '');
        }
        setPrimaryAmount(total);
        setExtraMethods([]);
      }
    }
  }, [open, total, savedMethods]);

  if (!open) return null;

  const currentGateway = gatewaysList.find(
    (g) => String(g.id) === String(selectedMethodId)
  );

  const categories = currentGateway?.payment_type_category || [];
  const selectedAccount = categories.find(
    (acc) => String(acc.id) === String(selectedAccountId)
  );

  const gatewayOptions = gatewaysList.map((g) => ({
    id: g.id,
    name: g.type_name,
  }));

  const categoryOptions = categories.map((acc) => ({
    id: acc.id,
    name: acc.payment_category_name,
  }));

  const handleGatewayChange = (newId) => {
    setSelectedMethodId(String(newId));
    const gateway = gatewaysList.find((g) => String(g.id) === String(newId));
    const firstAcc = gateway?.payment_type_category?.[0];
    setSelectedAccountId(firstAcc ? String(firstAcc.id) : '');
  };

  const addExtraMethod = () => {
    const defaultGateway = gatewaysList[0];
    const defaultCategory = defaultGateway?.payment_type_category?.[0];

    setExtraMethods((prev) => [
      ...prev,
      {
        id: Date.now(),
        payment_type_id: defaultGateway ? String(defaultGateway.id) : '',
        payment_type_category_id: defaultCategory ? String(defaultCategory.id) : '',
        payment_amount: 0,
      },
    ]);
  };

  const removeExtraMethod = (id) => {
    setExtraMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const updateExtraMethod = (id, field, value) => {
    setExtraMethods((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, [field]: value };
          if (field === 'payment_type_id') {
            const gateway = gatewaysList.find((g) => String(g.id) === String(value));
            const firstCategory = gateway?.payment_type_category?.[0];
            updated.payment_type_category_id = firstCategory ? String(firstCategory.id) : '';
          }
          return updated;
        }
        return m;
      })
    );
  };

  // Preset Handlers
  const handleFullPay = () => {
    setPrimaryAmount(total);
  };

  const handleHalfPay = () => {
    const half = Math.round((Number(total || 0) / 2) * 100) / 100;
    setPrimaryAmount(half);
  };

  const handleFullDue = () => {
    setPrimaryAmount(0);
  };

  // Calculations
  const numericPrimaryAmount = Number(primaryAmount) || 0;
  const extrasTotal = extraMethods.reduce(
    (sum, m) => sum + (Number(m.payment_amount) || 0),
    0
  );
  const totalPaid = numericPrimaryAmount + extrasTotal;
  const rawDiff = totalPaid - total;
  const dueAmount = rawDiff < 0 ? Math.abs(rawDiff) : 0;
  const changeAmount = rawDiff > 0 ? rawDiff : 0;

  const isFullPaid = totalPaid >= total && total > 0;
  const isPartialDue = totalPaid > 0 && totalPaid < total;

  const handleSave = () => {
    const primaryObj = {
      payment_type_id: Number(selectedMethodId) || 1,
      payment_type_category_id: Number(selectedAccountId) || 1,
      payment_amount: numericPrimaryAmount,
      gatewayName: currentGateway?.type_name || 'Cash',
      accountName: selectedAccount?.payment_category_name || '',
      accountNumber: selectedAccount?.account_number || '',
    };

    const extrasObjs = extraMethods.map((m) => {
      const g = gatewaysList.find((gw) => String(gw.id) === String(m.payment_type_id));
      const acc = g?.payment_type_category?.find(
        (c) => String(c.id) === String(m.payment_type_category_id)
      );
      return {
        payment_type_id: Number(m.payment_type_id) || 1,
        payment_type_category_id: Number(m.payment_type_category_id) || 1,
        payment_amount: Number(m.payment_amount) || 0,
        gatewayName: g?.type_name || '',
        accountName: acc?.payment_category_name || '',
        accountNumber: acc?.account_number || '',
      };
    });

    const allMethods = [primaryObj, ...extrasObjs];
    const names = [...new Set(allMethods.map((m) => m.gatewayName).filter(Boolean))].join(' + ');

    if (onSave) {
      onSave({
        totalPaid,
        dueAmount,
        changeAmount,
        methods: allMethods,
        summaryText: names,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-neutral-900">
            <CreditCard className="w-5 h-5 text-neutral-800" />
            <h3 className="font-semibold text-base tracking-tight">Make Payment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-black">
          {/* Primary Payment Section */}
          <div className="border border-neutral-200 p-4 rounded-xl bg-white shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Primary Payment</span>
              <span className="text-xs text-neutral-400 font-medium">Main Gateway</span>
            </div>

            {/* Custom Payment Method Select */}
            <CustomSelect
              label="Payment Gateway / Method"
              options={gatewayOptions}
              value={selectedMethodId}
              onChange={handleGatewayChange}
              placeholder="Select Gateway"
            />

            {/* Custom Bank / Account Details (if Non-Cash & has categories) */}
            {currentGateway?.type_name?.toLowerCase() !== 'cash' && categories.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <CustomSelect
                  label="Company Account Name"
                  options={categoryOptions}
                  value={selectedAccountId}
                  onChange={(id) => setSelectedAccountId(String(id))}
                  placeholder="Select Account"
                />

                {selectedAccount?.account_number && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">Account Number / Details</label>
                    <input
                      type="text"
                      disabled
                      value={selectedAccount.account_number}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-100 text-neutral-700 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Amount with Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Payment Amount</label>
              
              {/* Preset Buttons Row */}
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleFullPay}
                  className="flex-1 text-[11px] py-1.5 rounded-lg font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-colors active:scale-95 text-center whitespace-nowrap"
                >
                  Full Pay
                </button>
                <button
                  type="button"
                  onClick={handleHalfPay}
                  className="flex-1 text-[11px] py-1.5 rounded-lg font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition-colors active:scale-95 text-center whitespace-nowrap"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={handleFullDue}
                  className="flex-1 text-[11px] py-1.5 rounded-lg font-semibold bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 transition-colors active:scale-95 text-center whitespace-nowrap"
                >
                  Full Due (৳0)
                </button>
              </div>

              {/* Amount Input Box */}
              <div className="flex items-center">
                <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3.5 py-2.5 rounded-l-xl text-neutral-500 text-sm font-medium">
                  ৳
                </span>
                <input
                  type="number"
                  value={primaryAmount ?? ''}
                  onChange={(e) => setPrimaryAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-r-xl text-base sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>
          </div>

          {/* Extra Split Methods */}
          {extraMethods.map((method, index) => {
            const extraGateway = gatewaysList.find(
              (g) => String(g.id) === String(method.payment_type_id)
            );
            const extraCategories = extraGateway?.payment_type_category || [];

            const extraGatewayOpts = gatewayOptions;
            const extraCategoryOpts = extraCategories.map((acc) => ({
              id: acc.id,
              name: acc.payment_category_name,
            }));

            return (
              <div
                key={method.id}
                className="border border-neutral-200 p-4 rounded-xl bg-neutral-50/50 space-y-3 relative"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-xs font-semibold text-neutral-600">Extra Payment Line #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeExtraMethod(method.id)}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <CustomSelect
                  label="Gateway"
                  options={extraGatewayOpts}
                  value={method.payment_type_id}
                  onChange={(val) => updateExtraMethod(method.id, 'payment_type_id', String(val))}
                  placeholder="Select Gateway"
                />

                {extraGateway?.type_name?.toLowerCase() !== 'cash' && extraCategories.length > 0 && (
                  <CustomSelect
                    label="Account"
                    options={extraCategoryOpts}
                    value={method.payment_type_category_id}
                    onChange={(val) => updateExtraMethod(method.id, 'payment_type_category_id', String(val))}
                    placeholder="Select Account"
                  />
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Amount</label>
                  <div className="flex items-center">
                    <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3.5 py-2.5 rounded-l-xl text-neutral-500 text-sm font-medium">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={method.payment_amount ?? ''}
                      onChange={(e) => updateExtraMethod(method.id, 'payment_amount', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-r-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Split Method Button */}
          <button
            type="button"
            onClick={addExtraMethod}
            className="w-full py-2.5 border border-dashed border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-neutral-500" /> + Add Split Payment Method
          </button>

          {/* Summary Banner */}
          <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">Payment Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  isFullPaid
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : isPartialDue
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-red-950 text-red-300 border-red-700'
                }`}
              >
                {isFullPaid ? 'Paid In Full' : isPartialDue ? 'Partial Due' : 'Full Due'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <span className="block text-[11px] text-neutral-400 uppercase tracking-wider">Total Payable</span>
                <span className="font-semibold text-sm text-neutral-200">৳{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-x border-neutral-800">
                <span className="block text-[11px] text-neutral-400 uppercase tracking-wider">Total Paid</span>
                <span className="font-semibold text-sm text-blue-400">৳{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="block text-[11px] text-neutral-400 uppercase tracking-wider">
                  {totalPaid < total ? 'Due' : 'Change'}
                </span>
                <span className={`font-semibold text-sm ${totalPaid < total ? 'text-red-400' : 'text-emerald-400'}`}>
                  ৳{(totalPaid < total ? dueAmount : changeAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" /> Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
