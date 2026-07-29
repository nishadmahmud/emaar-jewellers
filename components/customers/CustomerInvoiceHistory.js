'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';

function formatInvoiceDate(invoiceId) {
    if (!invoiceId) return "—";
    const parts = invoiceId.split("-");
    if (parts.length < 4) return invoiceId; // Fallback if format is not as expected
    return new Date(
        parts.slice(1, 4).join("-")
    ).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

export default function CustomerInvoiceHistory({ partyWiseInvoice }) {
    const invoices = partyWiseInvoice?.data?.data || [];

    return (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-neutral-900">Invoice History</h3>
                <span className="text-sm text-neutral-500 font-medium bg-neutral-100 px-3 py-1 rounded-full">{invoices.length} Invoices</span>
            </div>
            
            <div className="overflow-x-auto">
                {invoices.length > 0 ? (
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="py-3 px-6 font-semibold text-neutral-900">Invoice ID</th>
                                <th className="py-3 px-6 font-semibold text-neutral-900">Date</th>
                                <th className="py-3 px-6 font-semibold text-neutral-900 text-right">Amount</th>
                                <th className="py-3 px-6 font-semibold text-neutral-900 text-right">Due</th>
                                <th className="py-3 px-6 font-semibold text-neutral-900 text-center">Status</th>
                                <th className="py-3 px-6 font-semibold text-neutral-900 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {invoices.map((invoice) => (
                                <tr key={invoice?.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="py-3 px-6 font-medium text-neutral-900">
                                        {invoice?.invoice_id}
                                    </td>
                                    <td className="py-3 px-6 text-neutral-500">
                                        {formatInvoiceDate(invoice?.invoice_id)}
                                    </td>
                                    <td className="py-3 px-6 text-right tabular-nums font-medium">
                                        {invoice?.sub_total?.toLocaleString("en-IN")} BDT
                                    </td>
                                    <td className="py-3 px-6 text-right tabular-nums text-red-600 font-medium">
                                        {(invoice?.sub_total - invoice?.paid_amount)?.toLocaleString("en-IN")} BDT
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            invoice?.status 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {invoice?.status ? "Completed" : "On Hold"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <Link href={`/dashboard/invoice/${invoice?.invoice_id}`}>
                                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                                                <Eye size={14} /> View
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-12 text-neutral-400">
                        <p>No invoices available for this period.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
