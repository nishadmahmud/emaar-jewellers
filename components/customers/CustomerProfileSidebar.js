'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail, MessageSquare } from 'lucide-react';
import CollectDueModal from '@/components/customers/CollectDueModal';

export default function CustomerProfileSidebar({ customer, onRefresh }) {
    const data = customer?.data || {};
    const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);
    
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-6 md:mb-0">
            <div className="p-6 flex flex-col items-center border-b border-neutral-100">
                <div className="h-24 w-24 bg-neutral-100 rounded-full flex items-center justify-center text-2xl font-semibold text-neutral-400 mb-4 overflow-hidden border-4 border-white shadow-sm">
                    {data.image ? (
                        <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
                    ) : (
                        data.name ? data.name.charAt(0).toUpperCase() : 'C'
                    )}
                </div>
                <h2 className="text-xl font-medium tracking-wide text-neutral-900">{data.name || 'Unnamed Customer'}</h2>
                <div className="mt-1 flex flex-col items-center gap-1 text-sm text-neutral-500">
                    <p>{data.mobile_number || 'No Phone'}</p>
                    {data.email && <p>{data.email}</p>}
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                    <a href={`tel:${data.mobile_number}`} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                        <Phone size={16} /> Call
                    </a>
                    <a href={`sms:${data.mobile_number}`} className="flex items-center justify-center gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 py-2 rounded-lg text-sm font-medium transition-colors">
                        <MessageCircle size={16} /> SMS
                    </a>
                    <a href={`mailto:${data.email}`} className="flex items-center justify-center gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Mail size={16} /> Email
                    </a>
                    <a href={`https://wa.me/${data.mobile_number}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 py-2 rounded-lg text-sm font-medium transition-colors">
                        <MessageSquare size={16} /> WhatsApp
                    </a>
                </div>
            </div>
            
            <div className="px-6 py-5 border-t border-neutral-100 bg-neutral-50/50">
                <h3 className="font-semibold text-neutral-900 mb-3 text-sm tracking-wide uppercase">Financial Overview</h3>
                <div className="flex justify-between items-center py-2">
                    <span className="text-neutral-500 text-sm">Total Due</span>
                    <span className="font-bold text-red-600">{(data.due || 0).toLocaleString("en-US")} BDT</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-neutral-500 text-sm">Total Purchased</span>
                    <span className="font-medium text-neutral-900">{(data.invoice_list_sum_sub_total || 0).toLocaleString("en-US")} BDT</span>
                </div>
                
                <button
                    onClick={() => setIsCollectDueOpen(true)}
                    className="w-full mt-4 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer active:scale-[0.99]"
                >
                    Collect Due Payment
                </button>
            </div>

            {/* Collect Due Modal */}
            <CollectDueModal
                open={isCollectDueOpen}
                onClose={() => setIsCollectDueOpen(false)}
                customerId={data.id}
                customerName={data.name}
                totalDue={data.due || 0}
                onSuccess={onRefresh}
            />
        </div>
    );
}
