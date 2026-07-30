'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Loader2, UserPlus, Scale, Receipt, Search, CreditCard, Banknote, ChevronDown, Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

import PaymentMethodsModal from '@/components/PaymentMethodsModal';

function normalizeBdMobileInput(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length >= 11 && d.startsWith("880")) return d.slice(-11);
  if (d.length >= 11 && d.startsWith("0")) return d.slice(0, 11);
  if (d.length >= 11) return d.slice(-11);
  return d;
}

export default function SellPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [paymentSummaryText, setPaymentSummaryText] = useState('');

  const [formData, setFormData] = useState({
    customerId: null,
    customerName: '',
    discount: '0',
    paymentMethodId: null,
    paymentMethodName: 'Cash',
    currency: 'TK'
  });
  
  const [cart, setCart] = useState([]);

  // --- Payment Methods API ---
  const [paymentMethods, setPaymentMethods] = useState([]);
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/payment-type-list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data?.data) {
          setPaymentMethods(res.data.data);
          const cashMethod = res.data.data.find(m => m.type_name?.toLowerCase() === 'cash');
          if (cashMethod) {
            setFormData(prev => ({ ...prev, paymentMethodId: cashMethod.id, paymentMethodName: cashMethod.type_name }));
          } else if (res.data.data.length > 0) {
            setFormData(prev => ({ ...prev, paymentMethodId: res.data.data[0].id, paymentMethodName: res.data.data[0].type_name }));
          }
        }
      })
      .catch(err => console.error("Failed to fetch payment methods", err));
    }
  }, [token]);


  // --- Customer Search ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerList, setCustomerList] = useState([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);
  const customerDropdownRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customerSearch && token && isCustomerDropdownOpen) {
        setIsCustomerSearching(true);
        axios.post(`${API_URL}/search-customer?page=1&limit=10`, 
          { keyword: customerSearch }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
          setCustomerList(res.data?.data?.data || []);
        })
        .catch(err => console.error("Customer search error", err))
        .finally(() => setIsCustomerSearching(false));
      } else {
        setCustomerList([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, token, isCustomerDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name || customer.customer_name
    }));
    setCustomerSearch(customer.name || customer.customer_name);
    setIsCustomerDropdownOpen(false);
  };

  // --- Add Customer Modal ---
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '', email: '', mobile_number: '', address: '', is_member: 0
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [existingCustList, setExistingCustList] = useState([]);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const normalizedPhone = normalizeBdMobileInput(newCustomer.mobile_number);
  
  useEffect(() => {
    if (normalizedPhone.length !== 11) {
      setPhoneWarning(false);
      setExistingCustList([]);
      return;
    }
    const delay = setTimeout(() => {
      if (!token) return;
      setIsCheckingPhone(true);
      axios.post(`${API_URL}/search-customer?page=1&limit=5`, { keyword: normalizedPhone }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const found = res.data?.data?.data || [];
        if (found.length > 0) {
          setExistingCustList(found);
          setPhoneWarning(true);
        } else {
          setPhoneWarning(false);
          setExistingCustList([]);
        }
      }).catch(err => {
        console.error("Phone check error", err);
      }).finally(() => setIsCheckingPhone(false));
    }, 500);
    return () => clearTimeout(delay);
  }, [normalizedPhone, token, API_URL]);

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!token) return;
    setSavingCustomer(true);
    axios.post(`${API_URL}/save-customer`, newCustomer, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      toast.success("Customer added successfully!");
      const saved = res.data?.data || res.data;
      if (saved) {
        setFormData(prev => ({
          ...prev,
          customerId: saved.id,
          customerName: saved.name || saved.customer_name
        }));
        setCustomerSearch(saved.name || saved.customer_name);
      }
      setShowAddCustomer(false);
      setNewCustomer({ name: '', email: '', mobile_number: '', address: '', is_member: 0 });
    }).catch(err => {
      toast.error("Failed to save customer");
      console.error(err);
    }).finally(() => setSavingCustomer(false));
  };


  // --- Product Search ---
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState([]);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const router = useRouter();
  const productDropdownRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (productSearch && token && isProductDropdownOpen) {
        setIsProductSearching(true);
        axios.post(`${API_URL}/search-product-v1?page=1&limit=20`, 
          { keyword: productSearch }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
          setProductList(res.data?.data?.data || []);
        })
        .catch(err => console.error("Product search error", err))
        .finally(() => setIsProductSearching(false));
      } else if (!productSearch && token && isProductDropdownOpen) {
        // Fetch default products if search is empty
        setIsProductSearching(true);
        axios.get(`${API_URL}/product?page=1&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          setProductList(res.data?.data?.data || []);
        })
        .catch(err => console.error("Product fetch error", err))
        .finally(() => setIsProductSearching(false));
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearch, token, isProductDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectProduct = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        have_variant: product.have_variant ? 1 : 0,
        qty: 1,
        goldVori: '',
        goldGram: '',
        ratePerVori: product.retails_price || product.sell_price || 0
      }]);
    }
    setProductSearch('');
    setIsProductDropdownOpen(false);
  };
  
  const updateCartItem = (id, field, value) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'goldVori') {
           const vori = parseFloat(value);
           updated.goldGram = isNaN(vori) ? '' : (vori * 11.664).toFixed(3);
        }
        if (field === 'goldGram') {
           const gram = parseFloat(value);
           updated.goldVori = isNaN(gram) ? '' : (gram / 11.664).toFixed(3);
        }
        return updated;
      }
      return item;
    }));
  };
  
  const removeCartItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };


  // --- Calculations ---
  const subtotal = cart.reduce((acc, item) => {
    const vori = parseFloat(item.goldVori) || 0;
    const rate = parseFloat(item.ratePerVori) || 0;
    const qty = parseFloat(item.qty) || 1;
    const weightMultiplier = vori > 0 ? vori : 1;
    return acc + (weightMultiplier * rate * qty);
  }, 0);
  
  const discountNum = parseFloat(formData.discount) || 0;
  const grandTotal = subtotal - discountNum;
  const effectivePaidAmount =
    formData.paidAmount !== '' && formData.paidAmount !== null && formData.paidAmount !== undefined
      ? parseFloat(formData.paidAmount) || 0
      : grandTotal;
  const dueAmount = Math.max(0, grandTotal - effectivePaidAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Please select a customer.');
      return;
    }
    if (dueAmount > 0 && formData.customerId === 'walk-in') {
      toast.error('Please select or add a specific customer to record a due sale.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Please add at least one product.');
      return;
    }
    setLoading(true);
    try {
      const finalPaymentMethods = (savedPaymentMethods && savedPaymentMethods.length > 0)
        ? savedPaymentMethods.map(m => ({
            payment_type_id: Number(m.payment_type_id) || 1,
            payment_type_category_id: Number(m.payment_type_category_id) || 1,
            payment_amount: Number(m.payment_amount) || 0,
          }))
        : [{
            payment_type_id: formData.paymentMethodId || 1,
            payment_type_category_id: 1,
            payment_amount: effectivePaidAmount,
          }];

      const payload = {
        customer_id: formData.customerId === 'walk-in' ? null : formData.customerId,
        customer_name: formData.customerName,
        customer_phone: "", 
        pay_mode: paymentSummaryText || formData.paymentMethodName || 'Cash',
        paid_amount: effectivePaidAmount,
        sub_total: subtotal,
        discount: discountNum,
        vat: 0,
        tax: 0,
        order_type: 'shop',
        product: cart.map(item => ({
          product_id: item.id,
          qty: parseFloat(item.qty) || 1,
          price: parseFloat(item.ratePerVori) || 0,
          purchase_price: 0,
          retails_price: parseFloat(item.ratePerVori) || 0,
          have_variant: item.have_variant || 0,
          mode: 1,
          size: 1,
        })),
        payment_method: finalPaymentMethods,
      };
      const res = await axios.post(`${API_URL}/save-sales`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        toast.success('Sale recorded successfully!');
        setCart([]);
        setFormData({
          customerId: null,
          customerName: '',
          paymentMethodId: null,
          paymentMethodName: 'Cash',
          discount: '',
          receivedAmount: ''
        });
        
        if (res.data.data?.invoice_id) {
          router.push(`/dashboard/invoice/sale/${res.data.data.invoice_id}`);
        } else if (res.data.invoice_id) {
          router.push(`/dashboard/invoice/sale/${res.data.invoice_id}`);
        }
      }
    } catch (err) {
      console.error('Sale save error:', err);
      toast.error(err?.response?.data?.message || 'Failed to complete sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    switch(formData.currency) {
      case 'USD': return '$';
      case 'AED': return 'AED';
      default: return 'AED';
    }
  };

  const getPaymentIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('card') || n.includes('visa') || n.includes('master')) return <CreditCard size={16} />;
    return <Banknote size={16} />;
  };

  return (
    <div className="max-w-7xl mx-auto text-black">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold sm:font-medium tracking-wide">Point of Sale</h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6">
          <form id="sell-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm relative" ref={customerDropdownRef}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-neutral-800">
                  <UserPlus size={18} />
                  <h3 className="font-medium">Customer Details</h3>
                </div>
                <div className="flex items-center gap-3">
                  {formData.customerName && (
                    <button type="button" onClick={() => {
                      setFormData(prev => ({...prev, customerId: null, customerName: ''}));
                      setCustomerSearch('');
                    }} className="text-xs text-red-500 hover:underline">
                      Clear Selection
                    </button>
                  )}
                  <button type="button" onClick={() => setShowAddCustomer(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    + Add New
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Search Customer (Mobile / Name)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                      if (formData.customerId) {
                        setFormData(prev => ({...prev, customerId: null, customerName: ''}));
                      }
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full pl-9 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm"
                    placeholder="Search by Mobile or Name..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                     {isCustomerSearching ? <Loader2 size={14} className="text-neutral-400 animate-spin" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </div>

                {/* Dropdown Menu */}
                {isCustomerDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-[calc(100%-3rem)] bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customerList.length > 0 ? (
                      <ul>
                        {customerList.map((customer) => (
                          <li 
                            key={customer.id} 
                            onClick={() => selectCustomer(customer)}
                            className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-sm text-neutral-900">{customer.name || customer.customer_name}</div>
                              <div className="text-xs text-neutral-500">{customer.mobile_number || customer.customer_phone || 'No phone'}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-sm text-neutral-500 text-center">
                        {customerSearch ? 'No customers found.' : 'Type to search customers'}
                        <div className="mt-2">
                          <button 
                            type="button" 
                            onClick={() => {
                              setFormData(prev => ({...prev, customerId: 'walk-in', customerName: customerSearch || 'Walk-in Customer'}));
                              setIsCustomerDropdownOpen(false);
                            }}
                            className="text-black font-medium hover:underline"
                          >
                            Use as Walk-in Customer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm relative" ref={productDropdownRef}>
              <div className="flex items-center justify-between mb-4 text-neutral-800">
                <div className="flex items-center gap-2">
                  <Scale size={18} />
                  <h3 className="font-medium">Add Items</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Search Product to Add</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="w-full pl-9 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                    placeholder="Select or search product..."
                  />
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                     {isProductSearching ? <Loader2 size={14} className="text-neutral-400 animate-spin" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </div>

                {/* Product Dropdown Menu */}
                {isProductDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-[calc(100%-3rem)] md:w-1/2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {productList.length > 0 ? (
                      <ul>
                        {productList.map((product) => (
                          <li 
                            key={product.id} 
                            onClick={() => selectProduct(product)}
                            className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                          >
                            <div className="font-medium text-sm text-neutral-900">{product.name}</div>
                            {product.sku && <div className="text-xs text-neutral-500">SKU: {product.sku}</div>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-sm text-neutral-500 text-center">
                         {productSearch ? 'No products found.' : 'Loading products...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Cart Items View */}
              {cart.length > 0 && (
                <div>
                  {/* Mobile Stacked Card View (No horizontal scrolling) */}
                  <div className="block sm:hidden border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-200 bg-white">
                    {cart.map((item) => {
                      const vori = parseFloat(item.goldVori) || 0;
                      const qty = parseFloat(item.qty) || 1;
                      const rate = parseFloat(item.ratePerVori) || 0;
                      const weightMultiplier = vori > 0 ? vori : 1;
                      const itemTotal = weightMultiplier * rate * qty;

                      return (
                        <div key={item.id} className="p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs text-neutral-900 truncate pr-2">{item.name}</p>
                            <button type="button" onClick={() => removeCartItem(item.id)} className="p-1 text-rose-500 hover:text-rose-700 shrink-0">
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">Wt (Vori)</label>
                              <input
                                type="number"
                                step="0.001"
                                placeholder="0"
                                value={item.goldVori}
                                onChange={(e) => updateCartItem(item.id, 'goldVori', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">Wt (Gram)</label>
                              <input
                                type="number"
                                step="0.001"
                                placeholder="0"
                                value={item.goldGram}
                                onChange={(e) => updateCartItem(item.id, 'goldGram', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">Qty</label>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => updateCartItem(item.id, 'qty', Math.max(1, qty - 1))} className="p-1 bg-neutral-100 rounded text-neutral-600">
                                  <Minus size={12} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => updateCartItem(item.id, 'qty', e.target.value)}
                                  className="w-12 text-center py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                                />
                                <button type="button" onClick={() => updateCartItem(item.id, 'qty', qty + 1)} className="p-1 bg-neutral-100 rounded text-neutral-600">
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">Rate / Vori</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={item.ratePerVori}
                                onChange={(e) => updateCartItem(item.id, 'ratePerVori', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-neutral-100 text-xs">
                            <span className="text-neutral-500 font-medium">Subtotal:</span>
                            <span className="font-bold text-neutral-900">AED {itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto border border-neutral-200 rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-medium">Item</th>
                          <th className="px-4 py-3 font-medium w-32">Qty</th>
                          <th className="px-4 py-3 font-medium w-24">Wt(Vori)</th>
                          <th className="px-4 py-3 font-medium w-24">Wt(Gram)</th>
                          <th className="px-4 py-3 font-medium w-32">Rate</th>
                          <th className="px-4 py-3 font-medium w-32">Total</th>
                          <th className="px-4 py-3 font-medium w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {cart.map((item) => {
                          const vori = parseFloat(item.goldVori) || 0;
                          const qty = parseFloat(item.qty) || 1;
                          const rate = parseFloat(item.ratePerVori) || 0;
                          const weightMultiplier = vori > 0 ? vori : 1;
                          const itemTotal = weightMultiplier * rate * qty;
                          
                          return (
                            <tr key={item.id} className="hover:bg-neutral-50/50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-neutral-900 truncate max-w-[150px]">{item.name}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => updateCartItem(item.id, 'qty', Math.max(1, qty - 1))} className="p-1 bg-neutral-100 rounded hover:bg-neutral-200 text-neutral-600">
                                    <Minus size={14} />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) => updateCartItem(item.id, 'qty', e.target.value)}
                                    className="w-12 text-center px-2 py-1 bg-white border border-neutral-200 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                                  />
                                  <button type="button" onClick={() => updateCartItem(item.id, 'qty', qty + 1)} className="p-1 bg-neutral-100 rounded hover:bg-neutral-200 text-neutral-600">
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={item.goldVori}
                                  onChange={(e) => updateCartItem(item.id, 'goldVori', e.target.value)}
                                  className="w-20 px-2 py-1 bg-white border border-neutral-200 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={item.goldGram}
                                  onChange={(e) => updateCartItem(item.id, 'goldGram', e.target.value)}
                                  className="w-20 px-2 py-1 bg-white border border-neutral-200 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={item.ratePerVori}
                                  onChange={(e) => updateCartItem(item.id, 'ratePerVori', e.target.value)}
                                  className="w-24 px-2 py-1 bg-white border border-neutral-200 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-neutral-900">
                                {getCurrencySymbol()}{itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => removeCartItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {cart.length === 0 && (
                <div className="py-8 text-center text-neutral-400 text-sm border-2 border-dashed border-neutral-100 rounded-lg">
                  No items added to cart yet.
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Right Column: Invoice Summary */}
        <div className="w-full lg:w-[460px] shrink-0">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 text-neutral-800">
                <Receipt size={18} />
                <h3 className="font-medium">Invoice Summary</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">
                  Cart Items ({cart.length})
                </span>
                <span className="font-medium">{getCurrencySymbol()}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">Subtotal</span>
                <span className="font-medium">{getCurrencySymbol()}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4 border-t border-neutral-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Paid Amount</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paidAmount: grandTotal})}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 transition border border-emerald-200"
                    >
                      Full Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paidAmount: (grandTotal / 2).toFixed(2)})}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200 transition border border-amber-200"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paidAmount: '0'})}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-semibold hover:bg-red-200 transition border border-red-200"
                    >
                      Full Due (AED 0)
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3 py-2 rounded-l-lg text-neutral-500 text-sm font-medium">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    value={formData.paidAmount ?? ''}
                    placeholder={grandTotal.toFixed(2)}
                    onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-r-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Grand Total</span>
                  <span className="text-2xl font-light tracking-tight">{getCurrencySymbol()}{Math.max(0, grandTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-medium text-neutral-500">Due Amount</span>
                  <span className={`font-bold ${dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {getCurrencySymbol()}{dueAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-400 font-medium">Payment Status:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    dueAmount === 0 && grandTotal > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : effectivePaidAmount > 0 && dueAmount > 0
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {dueAmount === 0 && grandTotal > 0 ? 'Paid' : effectivePaidAmount > 0 ? 'Partial Due' : 'Full Due'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100">
              {paymentMethods.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {paymentMethods.map(method => (
                    <button 
                      key={method.id}
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethodId: method.id, paymentMethodName: method.type_name})}
                      className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-sm transition-colors ${formData.paymentMethodId === method.id ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
                    >
                      {getPaymentIcon(method.type_name)} {method.type_name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <button type="button" className="flex items-center justify-center gap-2 py-2 border border-black bg-black text-white rounded-lg text-sm">
                      <Banknote size={16} /> Cash
                    </button>
                </div>
              )}

               <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mb-3 shadow-sm text-sm"
              >
                <CreditCard className="w-4 h-4" />
                Make Payment {paymentSummaryText ? `(${paymentSummaryText})` : ''}
              </button>

              <button
                type="submit"
                form="sell-form"
                disabled={loading || !formData.customerName || cart.length === 0}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodsModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={grandTotal}
        paymentGateways={paymentMethods}
        savedMethods={savedPaymentMethods}
        onSave={({ totalPaid, summaryText, methods }) => {
          setSavedPaymentMethods(methods);
          setPaymentSummaryText(summaryText);
          setFormData((prev) => ({ ...prev, paidAmount: totalPaid }));
        }}
      />

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-neutral-800 mb-4 tracking-wide">Add New Customer</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="Customer Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile Number</label>
                <input
                  required
                  type="text"
                  value={newCustomer.mobile_number}
                  onChange={e => setNewCustomer({...newCustomer, mobile_number: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black outline-none ${phoneWarning ? 'border-amber-400 focus:ring-amber-500' : 'border-neutral-200'}`}
                  placeholder="e.g. 01XXXXXXXXX"
                />
                
                {isCheckingPhone && normalizedPhone.length === 11 && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600 text-xs animate-pulse">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Searching for existing customers...
                  </div>
                )}
                
                {phoneWarning && existingCustList.length > 0 && !isCheckingPhone && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-amber-800 font-medium pt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Customer(s) with this phone already exist:</span>
                    </div>
                    {existingCustList.slice(0, 2).map((c) => (
                      <div key={c.id} className="text-xs text-amber-700 ml-6">
                        • {c.name || c.customer_name}
                      </div>
                    ))}
                    {existingCustList.length > 2 && (
                      <div className="text-xs text-amber-600 ml-6">
                        ...and {existingCustList.length - 2} more
                      </div>
                    )}
                    <div className="text-xs text-amber-600 ml-6 mt-1 italic">
                      You can still proceed to add this customer if needed.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="123 Street Name"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 flex items-center"
                >
                  {savingCustomer ? <Loader2 size={16} className="animate-spin mr-2" /> : null} 
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

