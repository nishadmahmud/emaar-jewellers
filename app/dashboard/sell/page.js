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

export default function SellPage({ editMode = false, initialInvoice = null }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [paymentSummaryText, setPaymentSummaryText] = useState('');

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    customerId: null,
    customerName: '',
    discount: '0',
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
        customerId: initialInvoice.customer_id || initialInvoice.customer?.id || null,
        customerName: initialInvoice.customer_name || initialInvoice.customer?.name || '',
        discount: initialInvoice.discount?.toString() || '0',
        paidAmount: initialInvoice.paid_amount || '',
      }));
      setCustomerSearch(initialInvoice.customer_name || initialInvoice.customer?.name || '');
      setSelectedDate(initialInvoice.created_at ? initialInvoice.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);

      if (initialInvoice.sales_details?.length) {
        const preloadedCart = initialInvoice.sales_details.map((detail) => {
          const qtyNum = parseFloat(detail.qty) || 1;
          const priceNum = parseFloat(detail.price) || 0;
          const ratePerVori = priceNum / qtyNum;
          const netWeightGram = qtyNum * 11.664;
          
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

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSavingCustomer(true);
    
    try {
        const customerPayload = {
            name: newCustomer.name,
            email: newCustomer.email,
            mobile_number: newCustomer.mobile_number,
            address: newCustomer.address,
            is_member: 0
        };

        const vendorFormData = new FormData();
        vendorFormData.append('name', newCustomer.name);
        vendorFormData.append('email', newCustomer.email);
        vendorFormData.append('mobile_number', newCustomer.mobile_number);
        vendorFormData.append('address', newCustomer.address);

        const nameDH = `${newCustomer.name} (DH)`;
        const nameBD = `${newCustomer.name} (BD)`;
        const iconLetter = newCustomer.name.charAt(0).toUpperCase();

        const payloadDH = new FormData();
        payloadDH.append('type_name', nameDH);
        payloadDH.append('icon_letter', iconLetter);

        const payloadBD = new FormData();
        payloadBD.append('type_name', nameBD);
        payloadBD.append('icon_letter', iconLetter);

        const [custRes,, resDH, resBD] = await Promise.all([
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
        const saved = custRes.data?.data || custRes.data;
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
    } catch (err) {
        toast.error("Failed to save client");
        console.error(err);
    } finally {
        setSavingCustomer(false);
    }
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
      toast.info("Product is already in the list.");
    } else {
      setCart([...cart, { 
        ...product, 
        qty: '', 
        goldGram: '',
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
          updatedItem.goldGram = value === '' ? '' : (vori * 11.664).toFixed(3);
        } else if (field === 'goldGram') {
          const gram = parseFloat(value) || 0;
          updatedItem.qty = value === '' ? '' : (gram / 11.664).toFixed(3);
        }
        return updatedItem;
      }
      return item;
    }));
  };
  
  const removeCartItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };


  // --- Calculations ---
  const calculateTotalBdt = () => {
    return cart.reduce((total, item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.ratePerVori) || 0;
      return total + (rate * qty);
    }, 0);
  };
  
  const subtotalBdt = calculateTotalBdt(); // Raw value entered by user
const discountNum = parseFloat(formData.discount) || 0;
  const grandTotalBdt = subtotalBdt - discountNum;

  const displayCurrency = cart.some(item => item.currency === 'AED') ? 'AED' : 'BDT';
  const displayAedRate = cart.find(item => item.currency === 'AED')?.aedRate || 1;
  const displaySubtotal = displayCurrency === 'AED' && displayAedRate > 0 ? subtotalBdt / displayAedRate : subtotalBdt;
  const displayGrandTotal = displayCurrency === 'AED' && displayAedRate > 0 ? grandTotalBdt / displayAedRate : grandTotalBdt;
  const displayDiscount = displayCurrency === 'AED' && displayAedRate > 0 ? discountNum / displayAedRate : discountNum;

  const effectivePaidAmountDisplay =
    formData.paidAmount !== '' && formData.paidAmount !== null && formData.paidAmount !== undefined
      ? parseFloat(formData.paidAmount) || 0
      : 0;
      
  const dueAmountDisplay = Math.max(0, displayGrandTotal - effectivePaidAmountDisplay);

  const effectivePaidAmountToSave = effectivePaidAmountDisplay; // Send exact AED amount to backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Please select a customer.');
      return;
    }
    if (dueAmountDisplay > 0 && formData.customerId === 'walk-in') {
      toast.error('Please select or add a specific customer to record a due sale.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Please add at least one product.');
      return;
    }
    setLoading(true);
    try {
      const token = session?.accessToken;

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
        customer_id: formData.customerId === 'walk-in' ? null : formData.customerId,
        customer_name: formData.customerName,
        customer_phone: "", 
        pay_mode: finalPayMode,
        paid_amount: effectivePaidAmountToSave,
        sub_total: displaySubtotal,
        discount: displayDiscount,
        vat: 0,
        tax: 0,
        order_type: 'shop',
        total_amount: displayGrandTotal,
        due_amount: dueAmountDisplay,
        product: cart.map(item => {
          const qtyNum = parseFloat(item.qty) || 1;
          const rateNum = parseFloat(item.ratePerVori) || 0;
          const totalLineAmount = rateNum * qtyNum;
          
          return {
            product_id: item.id,
            qty: qtyNum,
            price: totalLineAmount,
            purchase_price: 0,
            retails_price: totalLineAmount,
            have_variant: item.have_variant || 0,
            mode: 1,
            size: 1,
            currency: item.currency,
            aed_rate: parseFloat(item.aedRate) || 0,
            detail_id: item.detail_id || "",
            imei_id: item.imei_id || ""
          };
        }),
        payment_method: finalPaymentMethods,
      };

      if (editMode && initialInvoice?.invoice_id) {
        payload.invoice_id = initialInvoice.invoice_id;
      }

      const endpoint = editMode ? '/update-sales' : '/save-sales';
      const res = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        toast.success(editMode ? 'Sale updated successfully!' : 'Sale recorded successfully!');
        setCart([]);
        setFormData({
          customerId: null,
          customerName: '',
          paymentMethodId: null,
          paymentMethodName: 'Cash',
          discount: '',
          receivedAmount: ''
        });
        
        const invoiceIdToRedirect = res.data?.data?.invoice_id || res.data?.invoice_id || (editMode ? initialInvoice?.invoice_id : null);
        if (invoiceIdToRedirect) {
          router.push(`/dashboard/invoice/sale/${invoiceIdToRedirect}`);
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
          <h2 className="text-xl sm:text-2xl font-semibold sm:font-medium tracking-wide">Point of Sale</h2>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            SALE
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-600 hidden sm:inline-block">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20">
        
        {/* Left Column - Product Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6 sticky top-20 min-w-0">
          <form id="sell-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer Section */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm relative" ref={customerDropdownRef}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-neutral-800">
                  <UserPlus size={18} />
                  <h3 className="font-medium">Client Details</h3>
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
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Search Client (Mobile / Name)</label>
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
                    placeholder="Search Client by Mobile or Name..."
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
                        {customerSearch ? 'No clients found.' : 'Type to search clients'}
                        <div className="mt-2">
                          <button 
                            type="button" 
                            onClick={() => {
                              setFormData(prev => ({...prev, customerId: 'walk-in', customerName: customerSearch || 'Walk-in Client'}));
                              setIsCustomerDropdownOpen(false);
                            }}
                            className="text-black font-medium hover:underline"
                          >
                            Use as Walk-in Client
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
                  {/* Universal Stacked Card View (No horizontal scrolling) */}
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
                              <label className="block text-[10px] font-medium text-neutral-400 uppercase mb-0.5">Wt (Vori)</label>
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
                            
                            {item.currency === 'AED' && (
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
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase">Subtotal:</span>
                            <span className="font-bold text-neutral-900">{item.currency === 'AED' ? 'AED' : '৳'} {itemDisplayTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      );
                    })}
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
                <span className="font-medium">{displayCurrency === 'AED' ? 'AED ' : '৳'}{displaySubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">Subtotal</span>
                <span className="font-medium">{displayCurrency === 'AED' ? 'AED ' : '৳'}{displaySubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              


              <div className="pt-4 mt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Grand Total</span>
                  <span className="text-neutral-900 font-semibold">{displayCurrency === 'AED' ? 'AED ' : '৳'}{displayGrandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-medium text-neutral-500">Due Amount</span>
                  <span className={`font-bold ${dueAmountDisplay > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {displayCurrency === 'AED' ? 'AED ' : '৳'}{dueAmountDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-400 font-medium">Payment Status:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    dueAmountDisplay === 0 && displayGrandTotal > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : effectivePaidAmountDisplay > 0 && dueAmountDisplay > 0
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {dueAmountDisplay === 0 && displayGrandTotal > 0 ? 'Paid' : effectivePaidAmountDisplay > 0 ? 'Partial Due' : 'Full Due'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100">


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
        total={displayGrandTotal}
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

