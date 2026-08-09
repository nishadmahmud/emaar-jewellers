'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownToLine, Loader2, Store, Scale, FileText, Download, Search, CreditCard, Banknote, ChevronDown, Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import PaymentMethodsModal from '@/components/PaymentMethodsModal';

const CurrencyDropdown = ({ value, onChange }) => {
  return (
    <div className="relative w-full min-w-[65px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 pr-6 bg-white border border-neutral-200 rounded text-xs sm:text-sm focus:ring-1 focus:ring-black outline-none font-medium h-[26px] sm:h-[30px] appearance-none cursor-pointer"
      >
        <option value="BDT">BDT</option>
        <option value="AED">AED</option>
      </select>
      <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
    </div>
  );
};

export default function PurchasePage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [paymentSummaryText, setPaymentSummaryText] = useState('');

  const [formData, setFormData] = useState({
    vendorId: null,
    vendorName: '',
    paymentMethodId: null,
    paymentMethodName: 'Cash',
    currency: 'TK'
  });
  
  const [cart, setCart] = useState([]);

  // --- Vendor Search ---
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorList, setVendorList] = useState([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [isVendorSearching, setIsVendorSearching] = useState(false);
  const vendorDropdownRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (vendorSearch && token && isVendorDropdownOpen) {
        setIsVendorSearching(true);
        axios.post(`${API_URL}/search-vendor?page=1&limit=10`,
          { keyword: vendorSearch },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
          setVendorList(res.data?.data?.data || res.data?.data || []);
        })
        .catch(err => console.error("Vendor search error", err))
        .finally(() => setIsVendorSearching(false));
      } else if (!vendorSearch && token && isVendorDropdownOpen) {
        setIsVendorSearching(true);
        axios.get(`${API_URL}/vendor-lists?page=1&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          setVendorList(res.data?.data?.data || res.data?.data || []);
        })
        .catch(err => console.error("Vendor fetch error", err))
        .finally(() => setIsVendorSearching(false));
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [vendorSearch, token, isVendorDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectVendor = (vendor) => {
    setFormData(prev => ({
      ...prev,
      vendorId: vendor.id,
      vendorName: vendor.name
    }));
    setVendorSearch(vendor.name);
    setIsVendorDropdownOpen(false);
  };

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
      toast.info("Product is already in the list.");
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        have_variant: product.have_variant ? 1 : 0,
        qty: '',
        netWeightGram: '',
        ratePerVori: '',
        currency: 'BDT',
        aedRate: ''
      }]);
    }
    setProductSearch('');
    setIsProductDropdownOpen(false);
  };
  
  const updateCartItem = (id, field, value) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  const removeCartItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };


  // Calculate totals
  const goldValue = cart.reduce((acc, item) => {
    const qtyNum = parseFloat(item.qty) || 0;
    const rateNum = parseFloat(item.ratePerVori) || 0;
    return acc + (rateNum * qtyNum);
  }, 0);
  
  const displayCurrency = cart.some(item => item.currency === 'AED') ? 'AED' : 'BDT';
  const displayAedRate = cart.find(item => item.currency === 'AED')?.aedRate || 1;
  const displayGrandTotal = displayCurrency === 'AED' && displayAedRate > 0 ? (goldValue / displayAedRate) : goldValue;
  
  const effectivePaidAmount = parseFloat(formData.paidAmount) || 0;
  const effectivePaidAmountToSave = effectivePaidAmount; // Send exact AED amount to backend
  const dueAmountDisplay = Math.max(0, displayGrandTotal - effectivePaidAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorId) {
      toast.error('Please select a vendor.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Please add at least one product.');
      return;
    }
    setLoading(true);
    try {
      const basePayMode = paymentSummaryText || formData.paymentMethodName || 'Cash';
      const finalPayMode = displayCurrency === 'AED' ? `${basePayMode} (AED @ ${displayAedRate})` : basePayMode;

      const finalPaymentMethods = (savedPaymentMethods && savedPaymentMethods.length > 0)
        ? savedPaymentMethods.map(m => ({
            payment_type_id: Number(m.payment_type_id) || 1,
            payment_type_category_id: Number(m.payment_type_category_id) || 1,
            payment_amount: Number(m.payment_amount) || 0,
          }))
        : [{
            payment_type_id: formData.paymentMethodId || 1,
            payment_type_category_id: 1,
            payment_amount: effectivePaidAmountToSave,
          }];

      const payload = {
        vendor_id: formData.vendorId,
        vendor_name: formData.vendorName,
        pay_mode: finalPayMode,
        paid_amount: effectivePaidAmountToSave,
        sub_total: displayGrandTotal,
        discount: 0,
        vat: 0,
        tax: 0,
        order_type: 'shop',
        product: cart.map(item => {
          const qtyNum = parseFloat(item.qty) || 1;
          const rateNum = parseFloat(item.ratePerVori) || 0;
          const totalLineAmount = rateNum * qtyNum;
          
          return {
            product_id: item.id,
            qty: qtyNum,
            price: totalLineAmount,
            purchase_price: totalLineAmount,
            retails_price: 0,
            have_variant: item.have_variant || 0,
            mode: 1,
            size: 1,
          };
        }),
        payment_method: finalPaymentMethods,
      };
      const res = await axios.post(`${API_URL}/save-purchase`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        toast.success('Purchase recorded successfully!');
        setCart([]);
        setFormData({
          vendorId: null,
          vendorName: '',
          itemType: 'Gold Bar (99.99%)',
          paymentMethodId: null,
          paymentMethodName: 'Cash',
          currency: 'TK',
          paidAmount: ''
        });
        
        if (res.data.data?.invoice_id) {
          router.push(`/dashboard/invoice/purchase/${res.data.data.invoice_id}`);
        } else if (res.data.invoice_id) {
          router.push(`/dashboard/invoice/purchase/${res.data.invoice_id}`);
        }
      }
    } catch (err) {
      console.error('Purchase save error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    return '৳';
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
          <h2 className="text-xl sm:text-2xl font-semibold sm:font-medium tracking-wide">Inbound Purchase</h2>
        </div>
        <button className="flex items-center gap-1.5 bg-white border border-neutral-200 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
          <Download size={15} /> Import Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6 min-w-0">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Vendor Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm relative" ref={vendorDropdownRef}>
              <div className="flex items-center gap-2 mb-4 text-neutral-800">
                <Store size={18} />
                <h3 className="font-medium">Vendor Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Vendor Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={14} className="text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={vendorSearch}
                      onChange={(e) => {
                        setVendorSearch(e.target.value);
                        setIsVendorDropdownOpen(true);
                        if (formData.vendorId) {
                          setFormData(prev => ({...prev, vendorId: null, vendorName: ''}));
                        }
                      }}
                      onFocus={() => setIsVendorDropdownOpen(true)}
                      className="w-full pl-9 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm"
                      placeholder="Search vendor by name or phone..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isVendorSearching ? <Loader2 size={14} className="text-neutral-400 animate-spin" /> : <ChevronDown size={14} className="text-neutral-400" />}
                    </div>
                  </div>

                  {/* Vendor Dropdown Menu */}
                  {isVendorDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-[calc(100%-3rem)] bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {vendorList.length > 0 ? (
                        <ul>
                          {vendorList.map((vendor) => (
                            <li
                              key={vendor.id}
                              onClick={() => selectVendor(vendor)}
                              className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                            >
                              <div className="font-medium text-sm text-neutral-900">{vendor.name}</div>
                              {vendor.mobile_number && <div className="text-xs text-neutral-500">{vendor.mobile_number}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-sm text-neutral-500 text-center">
                          {vendorSearch ? 'No vendors found.' : 'Loading vendors...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Details */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm relative" ref={productDropdownRef}>
              <div className="flex items-center justify-between mb-4 text-neutral-800">
                <div className="flex items-center gap-2">
                  <Scale size={18} />
                  <h3 className="font-medium">Stock Details</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Search Product</label>
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
                    <div className="absolute z-10 mt-1 w-[calc(100%-3rem)] bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {productList.length > 0 ? (
                        <ul>
                          {productList.map((product) => (
                            <li 
                              key={product.id} 
                              onClick={() => selectProduct(product)}
                              className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                            >
                              <div className="font-medium text-sm text-neutral-900">{product.name}</div>
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
              </div>

              {/* Cart Items View */}
              {cart.length > 0 && (
                <div>
                  <div className="border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-200 bg-white">
                    {cart.map((item) => {
                      const qty = parseFloat(item.qty) || 1;
                      const rate = parseFloat(item.ratePerVori) || 0;
                      const aedRate = parseFloat(item.aedRate) || 0;
                      const itemTotalBdt = rate * qty;
                      const itemDisplayTotal = item.currency === 'AED' && aedRate > 0 ? itemTotalBdt / aedRate : itemTotalBdt;

                      return (
                        <div key={item.id} className="p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs text-neutral-900 truncate pr-2">{item.name}</p>
                            <button type="button" onClick={() => removeCartItem(item.id)} className="p-1 text-rose-500 hover:text-rose-700 shrink-0">
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">WT (VORI)</label>
                              <input
                                type="number"
                                step="0.001"
                                placeholder="0"
                                value={item.qty}
                                onChange={(e) => updateCartItem(item.id, 'qty', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">WT (GRAM)</label>
                              <input
                                type="number"
                                step="0.001"
                                placeholder="0"
                                value={item.netWeightGram || ''}
                                onChange={(e) => updateCartItem(item.id, 'netWeightGram', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                              />
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
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">Currency</label>
                              <CurrencyDropdown
                                value={item.currency || 'BDT'}
                                onChange={(val) => updateCartItem(item.id, 'currency', val)}
                              />
                            </div>
                            {item.currency === 'AED' ? (
                              <div>
                                <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">AED Rate</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={item.aedRate || ''}
                                  onChange={(e) => updateCartItem(item.id, 'aedRate', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-black outline-none font-medium"
                                />
                              </div>
                            ) : <div></div>}
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-neutral-100 text-xs">
                            <span className="text-neutral-500 font-medium">Subtotal:</span>
                            <div className="text-right">
                              <span className="font-bold text-neutral-900">{item.currency === 'AED' ? 'AED ' : '৳ '}{itemDisplayTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {cart.length === 0 && (
                <div className="py-8 text-center text-neutral-400 text-sm border-2 border-dashed border-neutral-100 rounded-lg mt-4">
                  No items added to cart yet.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Settlement Summary */}
        <div className="w-full lg:w-[460px] shrink-0 min-w-0">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 text-neutral-800">
                <FileText size={18} />
                <h3 className="font-medium">Settlement Summary</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Cart Items ({cart.length})</span>
                <div className="text-right">
                  <span className="font-medium">{displayCurrency === 'AED' ? 'AED ' : '৳ '}{displayGrandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">Paid Amount</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setFormData({...formData, paidAmount: displayGrandTotal.toString()})} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 transition border border-emerald-200">Full Pay</button>
                    <button type="button" onClick={() => setFormData({...formData, paidAmount: (displayGrandTotal / 2).toString()})} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200 transition border border-amber-200">50%</button>
                    <button type="button" onClick={() => setFormData({...formData, paidAmount: '0'})} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-semibold hover:bg-red-200 transition border border-red-200">Full Due ({displayCurrency === 'AED' ? 'AED ' : '৳'}0)</button>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 px-3 py-2 rounded-l-lg text-neutral-500 text-sm">{displayCurrency === 'AED' ? 'AED' : '৳'}</span>
                  <input
                    type="number"
                    value={formData.paidAmount}
                    placeholder={displayGrandTotal.toFixed(2)}
                    onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-r-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Net Payable</span>
                  <div className="text-right">
                    <span className="text-neutral-900 font-semibold">{displayCurrency === 'AED' ? 'AED ' : '৳ '}{displayGrandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-medium text-neutral-500">Due Amount</span>
                  <div className="text-right">
                    <span className={`font-bold ${dueAmountDisplay > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {displayCurrency === 'AED' ? 'AED ' : '৳ '}{dueAmountDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-400 font-medium">Payment Status:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    dueAmountDisplay === 0 && displayGrandTotal > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : effectivePaidAmount > 0 && dueAmountDisplay > 0
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {dueAmountDisplay === 0 && displayGrandTotal > 0 ? 'Paid' : effectivePaidAmount > 0 ? 'Partial Due' : 'Full Due'}
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
                form="purchase-form"
                disabled={loading || !formData.vendorName || cart.length === 0}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowDownToLine className="w-5 h-5 mr-2" />}
                {loading ? "Processing..." : "Add to Inventory"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodsModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={displayGrandTotal}
        paymentGateways={paymentMethods}
        savedMethods={savedPaymentMethods}
        onSave={({ totalPaid, summaryText, methods }) => {
          setSavedPaymentMethods(methods);
          setPaymentSummaryText(summaryText);
          setFormData((prev) => ({ ...prev, paidAmount: totalPaid }));
        }}
      />
    </div>
  );
}
