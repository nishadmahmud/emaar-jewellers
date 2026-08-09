'use client';

import { TrendingUp, CreditCard, Calendar, Package, RotateCcw, FileText } from 'lucide-react';

export default function CustomerStats({ data, customerWiseInvoice }) {
    if (!data) return null;

    const defaultTotalPurchase = Number(data.invoice_list_sum_sub_total || 0);
    const defaultTotalDue = Number(data.due || 0);

    let calcAedPurchase = 0, calcBdtPurchase = 0;
    let calcAedDue = 0, calcBdtDue = 0;
    let hasInvoices = false;

    if (customerWiseInvoice) {
        const invoices = Array.isArray(customerWiseInvoice?.data?.data)
            ? customerWiseInvoice.data.data
            : Array.isArray(customerWiseInvoice?.data)
            ? customerWiseInvoice.data
            : Array.isArray(customerWiseInvoice)
            ? customerWiseInvoice
            : [];

        if (invoices.length > 0) {
            hasInvoices = true;
            invoices.forEach(inv => {
                const payModeString = inv.pay_mode || '';
                const isAed = payModeString.includes('(AED @');
                const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
                const invoiceAedRate = isAed && aedRateMatch ? parseFloat(aedRateMatch[1]) : 1;
                
                const tAmt = Number(inv.sub_total || inv.total_amount || 0);
                const dAmt = Number(inv.due_amount || inv.due || 0);
                
                if (isAed) {
                    calcAedPurchase += (tAmt / invoiceAedRate);
                    calcAedDue += (dAmt / invoiceAedRate);
                } else {
                    calcBdtPurchase += tAmt;
                    calcBdtDue += dAmt;
                }
            });
        }
    }

    const showCalculated = hasInvoices;

    const renderMultiValue = (aedVal, bdtVal, defaultVal) => {
        return (
            <div className="flex flex-col gap-0.5">
                {showCalculated && aedVal > 0 && <span>AED {aedVal.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                {(!showCalculated || bdtVal > 0 || (!aedVal && !bdtVal)) && <span>BDT {(showCalculated ? bdtVal : defaultVal).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
            </div>
        );
    };

    const stats = [
        {
            title: "Total Purchase Amount",
            value: renderMultiValue(calcAedPurchase, calcBdtPurchase, defaultTotalPurchase),
            icon: TrendingUp,
            colors: "bg-emerald-50 text-emerald-600 border-emerald-100",
            iconBg: "bg-emerald-100"
        },
        {
            title: "Total Due",
            value: renderMultiValue(calcAedDue, calcBdtDue, defaultTotalDue),
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className={`rounded-xl border p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 ${stat.colors}`}>
                            <div className={`p-2.5 sm:p-3 rounded-lg ${stat.iconBg} shrink-0`}>
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] sm:text-xs font-medium opacity-80 truncate">{stat.title}</p>
                                <div className="text-xs sm:text-lg font-bold mt-0.5">{stat.value}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
