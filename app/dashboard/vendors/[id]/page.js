'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import VendorProfileSidebar from '@/components/vendors/VendorProfileSidebar';
import VendorStats from '@/components/vendors/VendorStats';
import VendorPurchasedProducts from '@/components/vendors/VendorPurchasedProducts';
import VendorInvoiceHistory from '@/components/vendors/VendorInvoiceHistory';
import { toast } from 'sonner';

export default function VendorDashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInterval = searchParams.get('interval') || 'daily';

  const [activeTab, setActiveTab] = useState(initialInterval);
  const [vendor, setVendor] = useState(null);
  const [vendorWiseProduct, setVendorWiseProduct] = useState(null);
  const [vendorWiseInvoice, setVendorWiseInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVendorData = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const [profileRes, productRes, invoiceRes] = await Promise.all([
        axios.get(`${API_URL}/vendor-profile/${id}?interval=${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/vendor-wise-product/${id}?interval=${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/vendor-wise-invoice/${id}?interval=${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setVendor(profileRes.data);
      setVendorWiseProduct(productRes.data);
      setVendorWiseInvoice(invoiceRes.data);
    } catch (error) {
      console.error('Failed to fetch vendor data', error);
      toast.error('Failed to load vendor profile.');
    } finally {
      setLoading(false);
    }
  }, [token, id, activeTab, API_URL]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const handleIntervalChange = (tab) => {
    setActiveTab(tab);
    router.push(`/dashboard/vendors/${id}?interval=${tab}`);
  };

  const tabs = ['daily', 'weekly', 'monthly', 'yearly'];

  if (loading && !vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-neutral-400">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p>Loading vendor profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto text-black space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/vendors"
            className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 bg-white shadow-sm transition-colors text-neutral-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Vendor Profile</h2>
            <p className="text-sm text-neutral-500 font-mono">#{id}</p>
          </div>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div>
        <div className="grid grid-cols-4 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200 shadow-sm w-full max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleIntervalChange(tab)}
              className={`py-2 px-1 text-center text-xs sm:text-sm font-medium capitalize rounded-lg transition-all cursor-pointer ${
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <VendorProfileSidebar vendor={vendor} vendorWiseInvoice={vendorWiseInvoice} onRefresh={fetchVendorData} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <VendorStats vendor={vendor} vendorWiseInvoice={vendorWiseInvoice} />
          <VendorPurchasedProducts vendorWiseProduct={vendorWiseProduct} />
          <VendorInvoiceHistory vendorWiseInvoice={vendorWiseInvoice} />
        </div>
      </div>
    </div>
  );
}
