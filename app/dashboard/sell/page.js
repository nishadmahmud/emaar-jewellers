'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Loader2, UserPlus, Scale, Receipt, Search, CreditCard, Banknote, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    customerId: null,
    customerName: '',
    productId: null,
    productName: '',
    goldVori: '1',
    goldGram: '11.664',
    ratePerVori: '115000',
    discount: '0',
    paymentMethodId: null,
    paymentMethodName: 'Cash',
    currency: 'TK'
  });

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
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      // Attempt to auto-fill rate if available from the API (usually retails_price or sell_price)
      ratePerVori: product.retails_price || product.sell_price || prev.ratePerVori
    }));
    setProductSearch(product.name);
    setIsProductDropdownOpen(false);
  };


  // --- Calculations ---
  const handleVoriChange = (val) => {
    const vori = parseFloat(val);
    setFormData({
      ...formData,
      goldVori: val,
      goldGram: isNaN(vori) ? '' : (vori * 11.664).toFixed(3)
    });
  };

  const handleGramChange = (val) => {
    const gram = parseFloat(val);
    setFormData({
      ...formData,
      goldGram: val,
      goldVori: isNaN(gram) ? '' : (gram / 11.664).toFixed(3)
    });
  };

  // The new calculation rules:
  const subtotal = (parseFloat(formData.goldVori) || 0) * (parseFloat(formData.ratePerVori) || 0);
  const discountAmount = parseFloat(formData.discount) || 0;
  const grandTotal = subtotal - discountAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success(`Invoice #INV-${Math.floor(Math.random() * 10000)} generated successfully!`);
      setFormData({
        ...formData,
        customerId: null,
        customerName: '',
        productId: null,
        productName: '',
        goldVori: '1',
        goldGram: '11.664',
        discount: '0'
      });
      setCustomerSearch('');
      setProductSearch('');
    }, 1000);
  };

  const getCurrencySymbol = () => {
    switch(formData.currency) {
      case 'USD': return '$';
      case 'AED': return 'د.إ';
      default: return '৳';
    }
  };

  const getPaymentIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('card') || n.includes('visa') || n.includes('master')) return <CreditCard size={16} />;
    return <Banknote size={16} />;
  };

  return (
    <div className="max-w-6xl mx-auto text-black">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium tracking-wide">Point of Sale</h2>
          <p className="text-sm text-neutral-500 mt-1">Create a new customer invoice and record sale.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-neutral-200 p-2 rounded-lg shadow-sm">
          <div className="text-xs text-neutral-500 font-medium px-2 uppercase tracking-wider">Live Rate:</div>
          <div className="text-sm font-medium bg-neutral-100 px-3 py-1 rounded">22K: ৳115,000 / Vori</div>
          <div className="text-sm font-medium bg-neutral-100 px-3 py-1 rounded">24K: ৳125,000 / Vori</div>
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
                  <h3 className="font-medium">Item & Weight</h3>
                </div>
                {formData.productName && (
                  <button type="button" onClick={() => {
                    setFormData(prev => ({...prev, productId: null, productName: ''}));
                    setProductSearch('');
                  }} className="text-xs text-red-500 hover:underline">
                    Clear Item
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Search Product</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={14} className="text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsProductDropdownOpen(true);
                        if(formData.productId) {
                          setFormData(prev => ({...prev, productId: null, productName: ''}));
                        }
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
                
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Wt (Vori)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.goldVori}
                    onChange={(e) => handleVoriChange(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Wt (Gram)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.goldGram}
                    onChange={(e) => handleGramChange(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Rate per Vori</label>
                  <input
                    type="number"
                    required
                    value={formData.ratePerVori}
                    onChange={(e) => setFormData({...formData, ratePerVori: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Invoice Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 text-neutral-800">
                <Receipt size={18} />
                <h3 className="font-medium">Invoice Summary</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Gold Value ({formData.goldVori || 0} Vori)</span>
                <span className="font-medium">{getCurrencySymbol()}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">Subtotal</span>
                <span className="font-medium">{getCurrencySymbol()}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Additional Discount</label>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3 py-2 rounded-l-lg text-neutral-500 text-sm">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-r-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-200">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Grand Total</span>
                  <span className="text-3xl font-light tracking-tight">{getCurrencySymbol()}{Math.max(0, grandTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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

              <div className="flex gap-2 mb-4">
                {['TK', 'USD', 'AED'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setFormData({...formData, currency: curr})}
                    className={`flex-1 py-1.5 text-xs font-medium border rounded-md transition-colors ${formData.currency === curr ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600'}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                form="sell-form"
                disabled={loading || !formData.customerName || !formData.productName}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>

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

