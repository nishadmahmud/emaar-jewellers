'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import CustomerProfileSidebar from '@/components/customers/CustomerProfileSidebar';
import CustomerStats from '@/components/customers/CustomerStats';
import CustomerPurchasedProducts from '@/components/customers/CustomerPurchasedProducts';
import CustomerInvoiceHistory from '@/components/customers/CustomerInvoiceHistory';
import { toast } from 'sonner';

export default function CustomerDashboard() {
    const { data: session } = useSession();
    const token = session?.accessToken;
    const API_URL = process.env.NEXT_PUBLIC_API;

    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialInterval = searchParams.get('interval') || 'daily';
    
    const [activeTab, setActiveTab] = useState(initialInterval);
    const [customer, setCustomer] = useState(null);
    const [customerWiseProduct, setCustomerWiseProduct] = useState(null);
    const [customerWiseInvoice, setCustomerWiseInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCustomerData = useCallback(async () => {
        if (!token || !id) return;
        setLoading(true);
        try {
            const [profileRes, productRes, invoiceRes] = await Promise.all([
                axios.get(`${API_URL}/customer-profile/${id}?interval=${activeTab}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/customer-wise-product/${id}?interval=${activeTab}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/customer-wise-invoice/${id}?interval=${activeTab}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setCustomer(profileRes.data);
            setCustomerWiseProduct(productRes.data);
            setCustomerWiseInvoice(invoiceRes.data);
        } catch (error) {
            console.error("Failed to fetch customer data", error);
            toast.error("Failed to load customer profile.");
        } finally {
            setLoading(false);
        }
    }, [token, id, activeTab, API_URL]);

    useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]);

    const handleIntervalChange = (tab) => {
        setActiveTab(tab);
        router.push(`/dashboard/customers/${id}?interval=${tab}`);
    };

    const tabs = ['daily', 'weekly', 'monthly', 'yearly'];

    if (loading && !customer) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-neutral-400">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p>Loading customer profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto text-black">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/customers" className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 bg-white shadow-sm transition-colors text-neutral-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-medium tracking-wide">Customer Profile</h2>
                        <p className="text-sm text-neutral-500">#{id}</p>
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <CustomerProfileSidebar customer={customer} customerWiseInvoice={customerWiseInvoice} onRefresh={fetchCustomerData} />
                </div>

                {/* Content */}
                <div className="lg:col-span-3 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                            <Loader2 size={32} className="animate-spin text-neutral-600" />
                        </div>
                    )}
                    
                    <CustomerStats data={customer?.data} customerWiseInvoice={customerWiseInvoice} />
                    <CustomerPurchasedProducts partyWiseProduct={customerWiseProduct} />
                    <CustomerInvoiceHistory partyWiseInvoice={customerWiseInvoice} />
                </div>
            </div>
        </div>
    );
}
