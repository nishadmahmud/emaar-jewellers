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

export default function PurchasePage({ editMode = false, initialInvoice = null }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [paymentSummaryText, setPaymentSummaryText] = useState('');

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    vendorId: null,
    vendorName: '',
    paymentMethodId: null,
    paymentMethodName: 'Cash',
    currency: 'TK'
  });
  
  const [cart, setCart] = useState([]);

  // --- Populate Data for Edit Mode ---
  useEffect(() => {
    if (editMode && initialInvoice) {
      setFormData(prev => ({
        ...prev,
        vendorId: initialInvoice.vendor_id || initialInvoice.vendor?.id || null,
        vendorName: initialInvoice.vendor_name || initialInvoice.vendor?.name || '',
        paidAmount: initialInvoice.paid_amount || '',
      }));
      setVendorSearch(initialInvoice.vendor_name || initialInvoice.vendor?.name || '');
      setSelectedDate(initialInvoice.created_at ? initialInvoice.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);

      if (initialInvoice.purchase_details?.length) {
        const preloadedCart = initialInvoice.purchase_details.map((detail) => {
          const qtyNum = parseFloat(detail.qty) || 1;
          const priceNum = parseFloat(detail.price) || parseFloat(detail.purchase_price) || 0;
          const ratePerVori = priceNum / qtyNum;
          const netWeightGram = qtyNum * 116.64;
          
          let currency = 'BDT';
          let aedRate = '';
          const payModeString = initialInvoice.pay_mode || '';
          if (payModeString.includes('(AED @')) {
            currency = 'AED';
            const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
            if (aedRateMatch) {
              aedRate = aedRateMatch[1];
            }
          }

          return {
            id: detail.product_id,
            name: detail.product_info?.name || detail.product_name || 'Product',
            have_variant: detail.have_variant || 0,
            qty: qtyNum.toString(),
            netWeightGram: netWeightGram.toFixed(3),
            ratePerVori: ratePerVori.toString(),
            currency: currency,
            aedRate: aedRate,
            detail_id: detail.id || "",
            imei_id: detail.imei_id || ""
          };
        });
        setCart(preloadedCart);
      }
    }
  }, [editMode, initialInvoice]);

  // --- Add Client Modal State ---
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '', email: '', mobile_number: '', address: ''
  });
  const [savingClient, setSavingClient] = useState(false);

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSavingClient(true);
    
    try {
        const customerPayload = {
            name: newClient.name,
            email: newClient.email,
            mobile_number: newClient.mobile_number,
            address: newClient.address,
            is_member: 0
        };

        const vendorFormData = new FormData();
        vendorFormData.append('name', newClient.name);
        vendorFormData.append('email', newClient.email);
        vendorFormData.append('mobile_number', newClient.mobile_number);
        vendorFormData.append('address', newClient.address);

        const nameDH = `${newClient.name} (DH)`;
        const nameBD = `${newClient.name} (BD)`;
        const iconLetter = newClient.name.charAt(0).toUpperCase();

        const payloadDH = new FormData();
        payloadDH.append('type_name', nameDH);
        payloadDH.append('icon_letter', iconLetter);

        const payloadBD = new FormData();
        payloadBD.append('type_name', nameBD);
        payloadBD.append('icon_letter', iconLetter);

        const [custRes, vendRes, resDH, resBD] = await Promise.all([
            axios.post(`${API_URL}/save-customer`, customerPayload, { headers: { Authorization: `Bearer ${token}` } }),
            axios.post(`${API_URL}/save-vendor`, vendorFormData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }),
            axios.post(`${API_URL}/payment-type-save`, payloadDH, { headers: { Authorization: `Bearer ${token}` } }),
            axios.post(`${API_URL}/payment-type-save`, payloadBD, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if ((resDH.data?.success || resDH.status === 200) && (resBD.data?.success || resBD.status === 200)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const listRes = await axios.get(`${API_URL}/payment-type-list?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const allMethods = Array.isArray(listRes.data?.data?.data) ? listRes.data.data.data 
                             : Array.isArray(listRes.data?.data) ? listRes.data.data 
                             : Array.isArray(listRes.data) ? listRes.data : [];
            
            const savedDH = allMethods.find(m => m.type_name === nameDH);
            const savedBD = allMethods.find(m => m.type_name === nameBD);

            const followUpPromises = [];

            if (savedDH?.id) {
                followUpPromises.push(
                    axios.post(`${API_URL}/payment-type-category-save`, {
                        payment_category_name: nameDH,
                        account_number: '1',
                        branch_name: '',
                        payment_type_id: savedDH.id
                    }, { headers: { Authorization: `Bearer ${token}` } })
                );
            }

            if (savedBD?.id) {
                followUpPromises.push(
                    axios.post(`${API_URL}/payment-type-category-save`, {
                        payment_category_name: nameBD,
                        account_number: '1',
                        branch_name: '',
                        payment_type_id: savedBD.id
                    }, { headers: { Authorization: `Bearer ${token}` } })
                );
            }

            followUpPromises.push(
                axios.post(`${API_URL}/save-expense-type`, {
                    expense_name: nameDH,
                    transaction_category: 'Quick Payment',
                    expense_description: '',
                    transaction_type_id: 0
                }, { headers: { Authorization: `Bearer ${token}` } }),
                axios.post(`${API_URL}/save-expense-type`, {
                    expense_name: nameBD,
                    transaction_category: 'Quick Payment',
                    expense_description: '',
                    transaction_type_id: 0
                }, { headers: { Authorization: `Bearer ${token}` } })
            );

            if (followUpPromises.length > 0) {
                await Promise.all(followUpPromises);
            }
        }

        toast.success("Client added successfully!");
        const saved = vendRes.data?.data || vendRes.data;
        if (saved) {
            setFormData(prev => ({
                ...prev,
                vendorId: saved.id,
                vendorName: saved.name || saved.vendor_name
            }));
            setVendorSearch(saved.name || saved.vendor_name);
        }
        setShowAddClient(false);
        setNewClient({ name: '', email: '', mobile_number: '', address: '' });
    } catch (err) {
        toast.error("Failed to save client");
        console.error(err);
    } finally {
        setSavingClient(false);
    }
  };

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
        const allMethods = Array.isArray(res.data?.data?.data) ? res.data.data.data 
                         : Array.isArray(res.data?.data) ? res.data.data 
                         : Array.isArray(res.data) ? res.data : [];
                         
        if (allMethods.length > 0) {
          setPaymentMethods(allMethods);
          const cashMethod = allMethods.find(m => m.type_name?.toLowerCase() === 'cash');
          if (cashMethod) {
            setFormData(prev => ({ ...prev, paymentMethodId: cashMethod.id, paymentMethodName: cashMethod.type_name }));
          } else {
            setFormData(prev => ({ ...prev, paymentMethodId: allMethods[0].id, paymentMethodName: allMethods[0].type_name }));
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
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty') {
          const vori = parseFloat(value) || 0;
          updatedItem.netWeightGram = value === '' ? '' : (vori * 116.64).toFixed(3);
        } else if (field === 'netWeightGram') {
          const gram = parseFloat(value) || 0;
          updatedItem.qty = value === '' ? '' : (gram / 116.64).toFixed(3);
        }
        return updatedItem;
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

      const currentTime = new Date().toISOString().split('T')[1];
      const created_at = `${selectedDate}T${currentTime}`;

      const payload = {
        created_at,
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
            retails_price: rateNum,
            have_variant: item.have_variant || 0,
            mode: 1,
            size: 1,
            detail_id: item.detail_id || "",
            imei_id: item.imei_id || ""
          };
        }),
        payment_method: finalPaymentMethods,
      };

      if (editMode && initialInvoice?.invoice_id) {
        payload.invoice_id = initialInvoice.invoice_id;
      }

      const endpoint = editMode ? '/update-purchase' : '/save-purchase';
      const res = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        toast.success(editMode ? 'Purchase updated successfully!' : 'Purchase recorded successfully!');
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
        
        const invoiceIdToRedirect = res.data?.data?.invoice_id || res.data?.invoice_id || (editMode ? initialInvoice?.invoice_id : null);
        if (invoiceIdToRedirect) {
          router.push(`/dashboard/invoice/purchase/${invoiceIdToRedirect}`);
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold sm:font-medium tracking-wide">Inbound Purchase</h2>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#f87171' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#ef4444' }}></span>
            </span>
            PURCHASE
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600 hidden sm:inline-block">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black bg-white"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-neutral-200 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Download size={15} /> Import Excel
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6 min-w-0">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Vendor Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm relative" ref={vendorDropdownRef}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-neutral-800">
                  <Store size={18} />
                  <h3 className="font-medium">Client Details</h3>
                </div>
                <div className="flex items-center gap-3">
                  {formData.vendorName && (
                    <button type="button" onClick={() => {
                      setFormData(prev => ({...prev, vendorId: null, vendorName: ''}));
                      setVendorSearch('');
                    }} className="text-xs text-red-500 hover:underline">
                      Clear Selection
                    </button>
                  )}
                  <button type="button" onClick={() => setShowAddClient(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    + Add New
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Search Client (Mobile / Name)</label>
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
                      placeholder="Search Client by name or phone..."
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
                          {vendorSearch ? 'No clients found.' : 'Loading clients...'}
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

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-medium text-neutral-800 mb-1 tracking-wide">Add New Client</h3>
            <p className="text-xs text-neutral-500 mb-4">This will create both a Customer and a Vendor profile.</p>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="Client Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={newClient.mobile_number}
                  onChange={e => setNewClient({...newClient, mobile_number: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. 01XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={e => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="client@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={e => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="123 Street Name"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  disabled={savingClient}
                  className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                >
                  {savingClient ? <Loader2 size={16} className="animate-spin" /> : null}
                  {savingClient ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
