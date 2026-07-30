'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Search, User, Store, CheckCircle2, ChevronDown, Check } from 'lucide-react';
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
                  key={opt.id || 'opt-all'}
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

export default function QuickPaymentModal({ open, onClose, initialMode = 'customer' }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [mode, setMode] = useState(initialMode); // 'customer' | 'vendor'
  const [searchTerm, setSearchTerm] = useState('');
  const [peopleList, setPeopleList] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const [dueInvoices, setDueInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [gatewaysList, setGatewaysList] = useState([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPersonDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch payment gateways on open
  useEffect(() => {
    if (open && token) {
      axios.get(`${API_URL}/payment-type-list`, { headers: { Authorization: `Bearer ${token}` } })
        .then((gwRes) => {
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
          }
        })
        .catch(() => {
          const fallback = [{ id: 1, type_name: 'Cash', payment_type_category: [{ id: 1, payment_category_name: 'Cash Account' }] }];
          setGatewaysList(fallback);
          setSelectedGatewayId('1');
          setSelectedCategoryId('1');
        });
    }
  }, [open, token, API_URL]);

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedPerson(null);
      setDueInvoices([]);
      setSelectedInvoiceId('');
      setPayAmount('');
    }
  }, [open, mode]);

  // Search/fetch people (using /customer-lists and /vendor-lists or search POST endpoints)
  useEffect(() => {
    if (!open || !token) return;
    setLoadingPeople(true);

    const isCustomer = mode === 'customer';
    const hasSearch = Boolean(searchTerm.trim());

    const reqPromise = hasSearch
      ? axios.post(`${API_URL}/${isCustomer ? 'search-customer' : 'search-vendor'}?page=1&limit=50`, { keyword: searchTerm }, { headers: { Authorization: `Bearer ${token}` } })
      : axios.get(`${API_URL}/${isCustomer ? 'customer-lists' : 'vendor-lists'}?page=1&limit=50`, { headers: { Authorization: `Bearer ${token}` } });

    reqPromise
      .then((res) => {
        const list = Array.isArray(res.data?.data?.data)
          ? res.data.data.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setPeopleList(list);
      })
      .catch(() => setPeopleList([]))
      .finally(() => setLoadingPeople(false));
  }, [open, token, mode, searchTerm, API_URL]);

  // Fetch due invoices when a person is selected
  useEffect(() => {
    if (!selectedPerson?.id || !token) {
      setDueInvoices([]);
      return;
    }
    setLoadingInvoices(true);

    const endpoint = mode === 'customer'
      ? `${API_URL}/customer-due-invoice-list/${selectedPerson.id}`
      : `${API_URL}/vendor-due-invoice-list/${selectedPerson.id}`;

    axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const list = Array.isArray(res.data?.data?.data)
          ? res.data.data.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setDueInvoices(list);
      })
      .catch(() => setDueInvoices([]))
      .finally(() => setLoadingInvoices(false));
  }, [selectedPerson, token, mode, API_URL]);

  if (!open) return null;

  const currentGateway = gatewaysList.find((g) => String(g.id) === String(selectedGatewayId));
  const categories = currentGateway?.payment_type_category || [];

  const handleGatewayChange = (gwId) => {
    setSelectedGatewayId(String(gwId));
    const gw = gatewaysList.find((g) => String(g.id) === String(gwId));
    const firstCat = gw?.payment_type_category?.[0];
    setSelectedCategoryId(firstCat ? String(firstCat.id) : '1');
  };

  const totalPersonDue = dueInvoices.reduce((sum, inv) => {
    const dueVal = Number(inv.total_due || inv.due_amount || inv.due || 0);
    return sum + dueVal;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPerson) {
      toast.error(`Please select a ${mode} first.`);
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      const isCustomer = mode === 'customer';
      const endpoint = isCustomer ? `${API_URL}/due-collection` : `${API_URL}/save-vendor-due-collection`;

      const payload = isCustomer
        ? {
            customer_id: Number(selectedPerson.id),
            sale_invoice_id: selectedInvoiceId || null,
            paid_amount: Number(payAmount),
            payment_method: [
              {
                payment_type_id: Number(selectedGatewayId) || 1,
                payment_type_category_id: Number(selectedCategoryId) || 1,
                payment_amount: Number(payAmount),
              }
            ],
            custom_date: date,
          }
        : {
            vendor_id: Number(selectedPerson.id),
            purchase_invoice_id: selectedInvoiceId || null,
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

      const res = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Quick payment saved successfully!');
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to process quick payment.');
      }
    } catch (err) {
      console.error('Quick payment error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const invoiceOptions = [
    { id: '', name: 'All Invoices (General Payment)' },
    ...dueInvoices.map((inv) => {
      const invId = inv.sale_invoice_id || inv.purchase_invoice_id || inv.invoice_id;
      const dueVal = Number(inv.total_due || inv.due_amount || inv.due || 0).toLocaleString();
      return { id: invId, name: `${invId} (Due: AED ${dueVal})` };
    })
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-100 text-black flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-neutral-900">Quick Payment</h3>
            <p className="text-xs text-neutral-500">Collect or make due payments instantly</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle: Customer vs Vendor */}
        <div className="flex bg-neutral-100 p-1.5 mx-6 mt-4 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setMode('customer')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'customer' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <User size={14} />
            Customer Payment
          </button>
          <button
            type="button"
            onClick={() => setMode('vendor')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'vendor' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Store size={14} />
            Vendor Payment
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* Person Live Search / Selector */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
              Select {mode === 'customer' ? 'Customer' : 'Vendor'}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={selectedPerson ? `${selectedPerson.name || selectedPerson.customer_name || selectedPerson.vendor_name} (${selectedPerson.phone || selectedPerson.mobile || 'No Phone'})` : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPerson(null);
                  setShowPersonDropdown(true);
                }}
                onFocus={() => setShowPersonDropdown(true)}
                placeholder={`Search ${mode} by name or phone...`}
                className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all"
              />
              {selectedPerson && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPerson(null);
                    setSearchTerm('');
                    setShowPersonDropdown(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {showPersonDropdown && !selectedPerson && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {loadingPeople ? (
                  <div className="py-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" /> Searching...
                  </div>
                ) : peopleList.length === 0 ? (
                  <div className="py-4 text-center text-xs text-neutral-400">No {mode} found.</div>
                ) : (
                  peopleList.map((person) => {
                    const pName = person.name || person.customer_name || person.vendor_name || 'N/A';
                    const pPhone = person.phone || person.mobile || person.customer_phone || '';
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerson(person);
                          setShowPersonDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg hover:bg-neutral-100 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-neutral-900">{pName}</p>
                          {pPhone && <p className="text-[11px] text-neutral-400">{pPhone}</p>}
                        </div>
                        {person.due !== undefined && (
                          <span className="text-xs font-bold text-rose-600">AED {Number(person.due).toLocaleString()}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Person Total Due Banner */}
          {selectedPerson && (
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">TOTAL {mode.toUpperCase()} DUE</p>
                <p className="text-xs text-rose-600 font-medium">{selectedPerson.name || selectedPerson.customer_name || selectedPerson.vendor_name}</p>
              </div>
              <p className="text-xl font-extrabold text-rose-600">
                {loadingInvoices ? <Loader2 size={16} className="animate-spin inline" /> : `AED ${totalPersonDue.toLocaleString()}`}
              </p>
            </div>
          )}

          {/* Invoice Selector */}
          <CustomSelect
            label="Select Invoice (Optional)"
            options={invoiceOptions}
            value={selectedInvoiceId}
            onChange={setSelectedInvoiceId}
            placeholder="All Invoices (General Payment)"
          />

          {/* Payment Method */}
          <CustomSelect
            label="Payment Method"
            options={gatewaysList.map((g) => ({ id: g.id, name: g.type_name }))}
            value={selectedGatewayId}
            onChange={handleGatewayChange}
          />

          {/* Account Category */}
          {categories.length > 0 && (
            <CustomSelect
              label="Account Category"
              options={categories.map((c) => ({ id: c.id, name: c.payment_category_name }))}
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
            />
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
              Amount Paid (AED)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">AED</span>
              <input
                type="number"
                step="any"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
              Payment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>

          {/* Action Buttons */}
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
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Save Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
