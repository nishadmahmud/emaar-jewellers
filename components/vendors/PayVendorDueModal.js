'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, ChevronDown, Check, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

// Custom Select Component with Eye icon for invoice items preview
function CustomSelect({ label, options = [], value, onChange, placeholder = 'Select option...', onViewInvoice }) {
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
              const hasInvoiceId = Boolean(opt.id);
              return (
                <button
                  key={opt.id || 'all'}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-black text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <span className="truncate mr-2">{opt.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasInvoiceId && onViewInvoice && (
                      <span
                        title="View Invoice Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          onViewInvoice(opt.id);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isSelected ? 'hover:bg-neutral-800 text-white' : 'hover:bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// In-memory cache for invoice details
const invoiceDetailsCache = {};

// Small Purchase Details Popup Modal
function PurchaseDetailsModal({ invoiceId, onClose, token, API_URL }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!invoiceId || !token) return;

    if (invoiceDetailsCache[invoiceId]) {
      setItems(invoiceDetailsCache[invoiceId]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const extractItems = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      const target = data.data || data;
      if (Array.isArray(target)) return target;
      return (
        target.purchase_details ||
        target.purchases_details ||
        target.sales_details ||
        target.sale_details ||
        target.product_details ||
        target.details ||
        target.items ||
        target.products ||
        target.purchases_products ||
        []
      );
    };

    const cacheAndSet = (list) => {
      invoiceDetailsCache[invoiceId] = list;
      setItems(list);
    };

    const isPurchaseInv = String(invoiceId).toUpperCase().startsWith('PUR');

    const extractFromSearchRes = (resData) => {
      const firstInvoice = resData?.data?.data?.[0] || resData?.data?.[0] || resData?.[0];
      if (firstInvoice) {
        return extractItems(firstInvoice);
      }
      return [];
    };

    if (isPurchaseInv) {
      // For purchase invoices, use /search-purchase-invoice to get items without triggering SalesController error
      axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=10`, { keyword: invoiceId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const list = extractFromSearchRes(res.data);
        if (list.length > 0) {
          cacheAndSet(list);
        } else {
          // Fallback to GET /get-invoice-details
          axios.get(`${API_URL}/get-invoice-details/${encodeURIComponent(invoiceId)}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then((res2) => cacheAndSet(extractItems(res2.data)))
          .catch(() => cacheAndSet([]));
        }
      })
      .catch(() => {
        axios.get(`${API_URL}/get-invoice-details/${encodeURIComponent(invoiceId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res2) => cacheAndSet(extractItems(res2.data)))
        .catch(() => cacheAndSet([]));
      })
      .finally(() => setLoading(false));
    } else {
      // For sales invoices, try POST /invoice-details first
      axios.post(`${API_URL}/invoice-details`, { invoice_id: invoiceId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const productList = extractItems(res.data);
        if (productList.length > 0) {
          cacheAndSet(productList);
        } else {
          axios.get(`${API_URL}/get-invoice-details/${encodeURIComponent(invoiceId)}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then((res2) => cacheAndSet(extractItems(res2.data)))
          .catch(() => cacheAndSet([]));
        }
      })
      .catch(() => {
        axios.get(`${API_URL}/get-invoice-details/${encodeURIComponent(invoiceId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res2) => cacheAndSet(extractItems(res2.data)))
        .catch(() => cacheAndSet([]));
      })
      .finally(() => setLoading(false));
    }
  }, [invoiceId, token, API_URL]);

  if (!invoiceId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 text-black flex flex-col max-h-[85vh]">
        <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div>
            <h4 className="font-bold text-sm text-neutral-900">Purchase Details</h4>
            <p className="text-xs text-neutral-500 font-mono">{invoiceId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-8 text-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
              <p className="text-xs">Loading purchase details...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">No product items found.</div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Total Stock</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {items.map((item, idx) => {
                    const name =
                      item.product_info?.name ||
                      item.product_name ||
                      item.name ||
                      item.product?.name ||
                      'N/A';
                    const qty = item.qty || item.quantity || item.stock || 1;
                    const rate = Number(item.price || item.purchase_price || item.rate || 0);
                    return (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-3 text-neutral-900">{name}</td>
                        <td className="py-2.5 px-3 text-center text-neutral-700 font-semibold">{qty}</td>
                        <td className="py-2.5 px-3 text-right text-neutral-900 font-bold">BDT {rate.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayVendorDueModal({ open, onClose, vendorId, vendorName, totalDue = 0, onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [activeTab, setActiveTab] = useState('pay'); // 'pay', 'discount', 'balance'
  const [dueInvoices, setDueInvoices] = useState([]);
  const [gatewaysList, setGatewaysList] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);

  // Pay Vendor Due Form State
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('BDT');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open && token && vendorId) {
      setLoadingInitial(true);

      const fetchInvoices = axios.get(`${API_URL}/vendor-due-invoice-list/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchGateways = axios.get(`${API_URL}/payment-type-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Promise.all([fetchInvoices, fetchGateways])
        .then(([invRes, gwRes]) => {
          const invArray = Array.isArray(invRes.data?.data?.data)
            ? invRes.data.data.data
            : Array.isArray(invRes.data?.data)
            ? invRes.data.data
            : Array.isArray(invRes.data)
            ? invRes.data
            : [];
          setDueInvoices(invArray);

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
        .catch(() => {
          const fallback = [{ id: 1, type_name: 'Cash', payment_type_category: [{ id: 1, payment_category_name: 'Cash Account' }] }];
          setGatewaysList(fallback);
          setSelectedGatewayId('1');
          setSelectedCategoryId('1');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [open, token, vendorId, API_URL]);

  if (!open) return null;

  const currentGateway = gatewaysList.find((g) => String(g.id) === String(selectedGatewayId));
  const categories = currentGateway?.payment_type_category || [];

  const handleGatewayChange = (gwId) => {
    setSelectedGatewayId(String(gwId));
    const gw = gatewaysList.find((g) => String(g.id) === String(gwId));
    const firstCat = gw?.payment_type_category?.[0];
    setSelectedCategoryId(firstCat ? String(firstCat.id) : '1');
  };

  const handleSavePayDue = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const finalAmount = Number(payAmount) * Number(exchangeRate);
      
      const payload = {
        vendor_id: Number(vendorId),
        purchase_invoice_id: selectedInvoice || null,
        paid_amount: finalAmount,
        payment_method: [
          {
            payment_type_id: Number(selectedGatewayId) || 1,
            payment_type_category_id: Number(selectedCategoryId) || 1,
            payment_amount: finalAmount,
          }
        ],
        custom_date: date,
      };

      const res = await axios.post(`${API_URL}/due-collection`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || 'Vendor due payment saved successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to save vendor due payment.');
      }
    } catch (err) {
      console.error('Vendor due payment error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving payment.');
    } finally {
      setSubmitting(false);
    }
  };

  let calcAedDue = 0, calcBdtDue = 0;
  let hasDueInvoices = dueInvoices && dueInvoices.length > 0;
  
  const invoiceOptions = [
    { id: '', name: 'All Invoices (General Payment)' },
    ...dueInvoices.map((inv) => {
      const invId = inv.purchase_invoice_id || inv.invoice_id || inv.id;
      
      const payModeString = inv.pay_mode || '';
      const isAed = payModeString.includes('(AED @');
      const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
      const invoiceAedRate = isAed && aedRateMatch ? parseFloat(aedRateMatch[1]) : 1;
      const displayCurrency = isAed ? 'AED' : 'BDT';

      const dueAmtBdt = Number(inv.total_due || inv.due_amount || inv.due || 0);
      const dueAmt = isAed ? dueAmtBdt / invoiceAedRate : dueAmtBdt;
      
      if (isAed) {
        calcAedDue += dueAmt;
      } else {
        calcBdtDue += dueAmt;
      }
      
      const dueVal = dueAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      return { id: invId, name: `${invId} (Due: ${displayCurrency} ${dueVal})` };
    })
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-100 text-black flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-neutral-900">Pay Vendor Due</h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">{vendorName || `Vendor #${vendorId}`}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            {/* Total Due Banner */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">TOTAL VENDOR DUE</p>
                <p className="text-xs text-rose-600 font-medium">Outstanding Balance</p>
              </div>
              <div className="text-right flex flex-col gap-0.5">
                {hasDueInvoices && calcAedDue > 0 && <span className="text-xl font-extrabold text-rose-600">AED {calcAedDue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                {(!hasDueInvoices || calcBdtDue > 0 || (!calcAedDue && !calcBdtDue)) && (
                  <span className="text-xl font-extrabold text-rose-600">BDT {(hasDueInvoices ? calcBdtDue : totalDue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                )}
              </div>
            </div>

            {loadingInitial ? (
              <div className="py-12 text-center text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-neutral-400" />
                <p className="text-xs font-medium">Loading due invoices...</p>
              </div>
            ) : (
              <form onSubmit={handleSavePayDue} className="space-y-4">
                {/* Invoice Selector */}
                <CustomSelect
                  label="Select Invoice"
                  options={invoiceOptions}
                  value={selectedInvoice}
                  onChange={setSelectedInvoice}
                  placeholder="All Invoices (General Payment)"
                  onViewInvoice={(invId) => setViewingInvoiceId(invId)}
                />

                {/* Payment Gateway */}
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

                {/* Currency Toggle */}
                <div className="flex bg-neutral-100 p-1.5 rounded-xl gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => { setPaymentCurrency('BDT'); setExchangeRate(1); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      paymentCurrency === 'BDT' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    BDT
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentCurrency('AED')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      paymentCurrency === 'AED' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    AED
                  </button>
                </div>

                {paymentCurrency === 'AED' && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                      Exchange Rate (1 AED = ? BDT)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      placeholder="e.g. 33.5"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                )}

                {/* Pay Amount */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                    Paid Amount ({paymentCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">
                      {paymentCurrency === 'AED' ? 'د.إ' : '৳'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Enter paid amount"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                  {paymentCurrency === 'AED' && payAmount > 0 && (
                    <div className="text-xs text-neutral-500 mt-1">
                      Equivalent to BDT {(Number(payAmount) * Number(exchangeRate)).toLocaleString()}
                    </div>
                  )}
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

                {/* Actions */}
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
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Save Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Purchase Details Popup Modal */}
      {viewingInvoiceId && (
        <PurchaseDetailsModal
          invoiceId={viewingInvoiceId}
          onClose={() => setViewingInvoiceId(null)}
          token={token}
          API_URL={API_URL}
        />
      )}
    </>
  );
}
