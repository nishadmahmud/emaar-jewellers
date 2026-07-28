'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownToLine, Loader2, Store, Scale, FileText, Download, Search, CreditCard, Banknote, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function PurchasePage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: 'SKNDR (Dubai)',
    productId: null,
    productName: '',
    grossWeight: '50',
    grossWeightGram: '583.200',
    netWeight: '50',
    netWeightGram: '583.200',
    ratePerVori: '124500',
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
      ratePerVori: product.purchase_price || product.retails_price || product.sell_price || prev.ratePerVori
    }));
    setProductSearch(product.name);
    setIsProductDropdownOpen(false);
  };


  const handleGrossWeightVori = (val) => {
    const vori = parseFloat(val);
    setFormData({
      ...formData,
      grossWeight: val,
      grossWeightGram: isNaN(vori) ? '' : (vori * 11.664).toFixed(3)
    });
  };

  const handleGrossWeightGram = (val) => {
    const gram = parseFloat(val);
    setFormData({
      ...formData,
      grossWeightGram: val,
      grossWeight: isNaN(gram) ? '' : (gram / 11.664).toFixed(3)
    });
  };

  const handleNetWeightVori = (val) => {
    const vori = parseFloat(val);
    setFormData({
      ...formData,
      netWeight: val,
      netWeightGram: isNaN(vori) ? '' : (vori * 11.664).toFixed(3)
    });
  };

  const handleNetWeightGram = (val) => {
    const gram = parseFloat(val);
    setFormData({
      ...formData,
      netWeightGram: val,
      netWeight: isNaN(gram) ? '' : (gram / 11.664).toFixed(3)
    });
  };

  // Calculate totals
  const netWeightNum = parseFloat(formData.netWeight) || 0;
  const rateNum = parseFloat(formData.ratePerVori) || 0;
  const goldValue = netWeightNum * rateNum;
  const grandTotal = goldValue;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success(`Successfully recorded purchase of ${formData.netWeight} Vori from ${formData.vendorName}!`);
      setFormData({
        ...formData,
        productId: null,
        productName: '',
        grossWeight: '',
        grossWeightGram: '',
        netWeight: '',
        netWeightGram: ''
      });
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
          <h2 className="text-2xl font-medium tracking-wide">Inbound Purchase</h2>
          <p className="text-sm text-neutral-500 mt-1">Record incoming stock from suppliers and vendors.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-neutral-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
          <Download size={16} /> Import Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Vendor Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-neutral-800">
                <Store size={18} />
                <h3 className="font-medium">Vendor Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Vendor Name</label>
                  <select
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm"
                  >
                    <option>SKNDR (Dubai)</option>
                    <option>ABT.ic</option>
                    <option>BNK22</option>
                    <option>Local Scrap Dealer</option>
                  </select>
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
                <div className="col-span-1 md:col-span-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Gross (Vori)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.grossWeight}
                    onChange={(e) => handleGrossWeightVori(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Gross (Gram)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.grossWeightGram}
                    onChange={(e) => handleGrossWeightGram(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Net (Vori)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.netWeight}
                    onChange={(e) => handleNetWeightVori(e.target.value)}
                    className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Net (Gram)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.netWeightGram}
                    onChange={(e) => handleNetWeightGram(e.target.value)}
                    className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Rate Per Vori</label>
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

        {/* Right Column: Settlement Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 text-neutral-800">
                <FileText size={18} />
                <h3 className="font-medium">Settlement Summary</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Net Pure Weight</span>
                <span className="font-medium text-emerald-600">{netWeightNum.toFixed(3)} Vori</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Gross Weight</span>
                <span className="font-medium text-neutral-600">{parseFloat(formData.grossWeight || 0).toFixed(3)} Vori</span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-neutral-100">
                <span className="text-neutral-500">Gross Gold Value</span>
                <span className="font-medium">{getCurrencySymbol()}{goldValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4 mt-4 border-t border-neutral-200">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Net Payable</span>
                  <span className="text-3xl font-light tracking-tight text-black">{getCurrencySymbol()}{Math.max(0, grandTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="text-right text-xs text-neutral-400 mt-1">Will be credited to vendor account (CDT)</div>
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
                form="purchase-form"
                disabled={loading || !formData.productName}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowDownToLine className="w-5 h-5 mr-2" />}
                {loading ? "Processing..." : "Add to Inventory"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
