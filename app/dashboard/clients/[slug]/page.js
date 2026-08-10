'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, ArrowLeft, Phone, Mail, MapPin, User, BadgeAlert, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import CustomerInvoiceHistory from '@/components/customers/CustomerInvoiceHistory';
import VendorInvoiceHistory from '@/components/vendors/VendorInvoiceHistory';

const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-5 ${className}`}>{children}</div>;

export default function ClientProfileDashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const clientName = decodeURIComponent(params.slug || '');
  const customerId = searchParams.get('customerId');
  const vendorId = searchParams.get('vendorId');
  const initialInterval = searchParams.get('interval') || 'daily';

  const [activeTab, setActiveTab] = useState(initialInterval);
  
  const [customer, setCustomer] = useState(null);
  const [customerInvoice, setCustomerInvoice] = useState(null);
  
  const [vendor, setVendor] = useState(null);
  const [vendorInvoice, setVendorInvoice] = useState(null);
  
  const [loading, setLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const requests = [];
      
      if (customerId) {
        requests.push(axios.get(`${API_URL}/customer-profile/${customerId}?interval=${activeTab}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null));
        requests.push(axios.get(`${API_URL}/customer-wise-invoice/${customerId}?interval=${activeTab}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null));
      } else {
        requests.push(Promise.resolve(null), Promise.resolve(null));
      }
      
      if (vendorId) {
        requests.push(axios.get(`${API_URL}/vendor-profile/${vendorId}?interval=${activeTab}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null));
        requests.push(axios.get(`${API_URL}/vendor-wise-invoice/${vendorId}?interval=${activeTab}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null));
      } else {
        requests.push(Promise.resolve(null), Promise.resolve(null));
      }

      const [custProfileRes, custInvoiceRes, vendProfileRes, vendInvoiceRes] = await Promise.all(requests);

      if (custProfileRes?.data) setCustomer(custProfileRes.data);
      if (custInvoiceRes?.data) setCustomerInvoice(custInvoiceRes.data);
      if (vendProfileRes?.data) setVendor(vendProfileRes.data);
      if (vendInvoiceRes?.data) setVendorInvoice(vendInvoiceRes.data);
      
    } catch (error) {
      console.error("Failed to fetch client data", error);
      toast.error("Failed to load client profile.");
    } finally {
      setLoading(false);
    }
  }, [token, customerId, vendorId, activeTab, API_URL]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleIntervalChange = (tab) => {
    setActiveTab(tab);
    const sp = new URLSearchParams(searchParams);
    sp.set('interval', tab);
    router.push(`/dashboard/clients/${encodeURIComponent(clientName)}?${sp.toString()}`);
  };

  const tabs = ['daily', 'weekly', 'monthly', 'yearly'];

  if (loading && !customer && !vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-neutral-400">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p>Loading unified client profile...</p>
      </div>
    );
  }

  const profileData = customer?.data || vendor?.data || {};
  const displayPhone = profileData.mobile_number || profileData.phone || '-';
  const displayEmail = profileData.email || '-';
  const displayAddress = profileData.address || '-';
  
  // Dues
  const sellDue = customer?.data?.total_due_amount || 0;
  const purchaseDue = vendor?.data?.total_due_amount || 0;
  
  // Totals
  const totalSales = customer?.data?.total_purchase_amount || 0; 
  const totalPurchases = vendor?.data?.total_purchase_amount || 0;

  return (
    <div className="max-w-7xl mx-auto text-black pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients" className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 bg-white shadow-sm transition-colors text-neutral-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Client Profile</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-neutral-500">{clientName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-4 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200 shadow-sm w-full max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleIntervalChange(tab)}
              className={`py-2 px-1 text-center text-xs sm:text-sm font-medium capitalize rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-white text-black shadow-sm font-semibold' 
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
              <Loader2 size={32} className="animate-spin text-neutral-600" />
          </div>
        )}

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="text-center pt-8">
              <div className="w-20 h-20 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-neutral-50 shadow-inner">
                <User size={32} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">{clientName}</h3>
              <p className="text-sm text-neutral-500 mt-1">Unified Profile</p>
            </CardContent>
            
            <div className="border-t border-neutral-100 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500">Phone Number</p>
                  <p className="text-sm text-neutral-900 font-medium truncate">{displayPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500">Email Address</p>
                  <p className="text-sm text-neutral-900 truncate">{displayEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500">Address</p>
                  <p className="text-sm text-neutral-900">{displayAddress}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Unified Stats Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-blue-600">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-700">Total Sales</h3>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{Number(totalSales).toLocaleString('en-US')}</p>
              <p className="text-xs text-neutral-500 mt-1">Revenue from {clientName}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <BadgeAlert size={20} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-700">Sell Due</h3>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{Number(sellDue).toLocaleString('en-US')}</p>
              <p className="text-xs text-neutral-500 mt-1">Customer owes you</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-amber-600">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <TrendingDown size={20} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-700">Total Purchases</h3>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{Number(totalPurchases).toLocaleString('en-US')}</p>
              <p className="text-xs text-neutral-500 mt-1">Bought from {clientName}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-emerald-600">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign size={20} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-700">Purchase Due</h3>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{Number(purchaseDue).toLocaleString('en-US')}</p>
              <p className="text-xs text-neutral-500 mt-1">You owe vendor</p>
            </div>
            
          </div>

          {/* Sell History (Customer Invoices) */}
          {customerId && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                Sell History
              </h3>
              <CustomerInvoiceHistory partyWiseInvoice={customerInvoice} />
            </div>
          )}

          {/* Purchase History (Vendor Invoices) */}
          {vendorId && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                Purchase History
              </h3>
              <VendorInvoiceHistory vendorWiseInvoice={vendorInvoice} />
            </div>
          )}
          
          {!customerId && !vendorId && (
              <div className="text-center py-12 text-neutral-400">
                  <p>No sales or purchase history found.</p>
              </div>
          )}

        </div>
      </div>
    </div>
  );
}
