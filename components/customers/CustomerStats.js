'use client';

import { TrendingUp, CreditCard, Calendar, Package, RotateCcw, FileText } from 'lucide-react';

export default function CustomerStats({ data }) {
    if (!data) return null;

    const stats = [
        {
            title: "Total Purchase Amount",
            value: `${(data.invoice_list_sum_sub_total || 0).toLocaleString("en-IN")} BDT`,
            icon: TrendingUp,
            colors: "bg-emerald-50 text-emerald-600 border-emerald-100",
            iconBg: "bg-emerald-100"
        },
        {
            title: "Total Due",
            value: `${(data.due || 0).toLocaleString("en-IN")} BDT`,
            icon: CreditCard,
            colors: "bg-blue-50 text-blue-600 border-blue-100",
            iconBg: "bg-blue-100"
        },
        {
            title: "Last Purchase Date",
            value: data.last_invoice_list?.invoice_id ? new Date(data.last_invoice_list.invoice_id.split('-').slice(1, 4).join('-')).toLocaleDateString('en-GB', {
                year: 'numeric', month: 'short', day: '2-digit'
            }) : 'No purchases',
            icon: Calendar,
            colors: "bg-amber-50 text-amber-600 border-amber-100",
            iconBg: "bg-amber-100"
        },
        {
            title: "Total Purchased Products",
            value: data.vendor_product || 0,
            icon: Package,
            colors: "bg-purple-50 text-purple-600 border-purple-100",
            iconBg: "bg-purple-100"
        },
        {
            title: "Returned Products",
            value: data.return_product || 0,
            icon: RotateCcw,
            colors: "bg-rose-50 text-rose-600 border-rose-100",
            iconBg: "bg-rose-100"
        },
        {
            title: "Total Invoices",
            value: data.invoice_list_count || 0,
            icon: FileText,
            colors: "bg-cyan-50 text-cyan-600 border-cyan-100",
            iconBg: "bg-cyan-100"
        }
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-medium tracking-wide text-neutral-900 mb-4">Customer Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className={`rounded-xl border p-4 flex items-center gap-4 ${stat.colors}`}>
                            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium opacity-80">{stat.title}</p>
                                <p className="text-xl font-semibold mt-1">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
