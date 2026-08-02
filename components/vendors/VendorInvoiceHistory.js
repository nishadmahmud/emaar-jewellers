'use client';

import React from 'react';
import { Receipt, Eye } from 'lucide-react';
import Link from 'next/link';

const formatBDT = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function VendorInvoiceHistory({ vendorWiseInvoice }) {
  const invoices = Array.isArray(vendorWiseInvoice?.data?.data)
    ? vendorWiseInvoice.data.data
    : Array.isArray(vendorWiseInvoice?.data)
    ? vendorWiseInvoice.data
    : Array.isArray(vendorWiseInvoice)
    ? vendorWiseInvoice
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 p-5 space-y-4 text-black">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-neutral-600" />
          <h4 className="font-bold text-base text-neutral-900">Purchase Invoice History</h4>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg">
          {invoices.length} Invoices
        </span>
      </div>

      {invoices.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400">No purchase invoices recorded for this period.</div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="block sm:hidden divide-y divide-neutral-100">
            {invoices.map((inv, idx) => {
              const invId = inv.purchase_invoice_id || inv.invoice_id || inv.id;
              const dateStr = inv.transaction_date || inv.created_at || inv.date || 'N/A';
              const totalAmt = Number(inv.sub_total || inv.total_amount || 0);
              const paidAmt = Number(inv.paid_amount || 0);
              const dueAmt = Number(inv.due_amount || inv.due || 0);

              return (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-neutral-900 font-mono">{invId}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{dateStr}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-neutral-900">BDT {formatBDT(totalAmt)}</p>
                    {dueAmt > 0 ? (
                      <span className="text-[9px] bg-rose-50 text-rose-700 font-semibold px-1.5 py-0.5 rounded-full border border-rose-200">
                        Due BDT {formatBDT(dueAmt)}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                        Paid
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-100">
                <tr>
                  <th className="py-2.5 px-4">Invoice ID</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4 text-right">Paid Amount</th>
                  <th className="py-2.5 px-4 text-right">Due Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {invoices.map((inv, idx) => {
                  const invId = inv.purchase_invoice_id || inv.invoice_id || inv.id;
                  const dateStr = inv.transaction_date || inv.created_at || inv.date || 'N/A';
                  const totalAmt = Number(inv.sub_total || inv.total_amount || 0);
                  const paidAmt = Number(inv.paid_amount || 0);
                  const dueAmt = Number(inv.due_amount || inv.due || 0);

                  return (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">{invId}</td>
                      <td className="py-3 px-4 text-neutral-600">{dateStr}</td>
                      <td className="py-3 px-4 text-right font-semibold">BDT {formatBDT(totalAmt)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">BDT {formatBDT(paidAmt)}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-extrabold">BDT {formatBDT(dueAmt)}</td>
                      <td className="py-3 px-4 text-center">
                        {dueAmt > 0 ? (
                          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                            Due
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
