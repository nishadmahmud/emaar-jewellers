'use client';

import React from 'react';
import { ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';

const formatBDT = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function VendorStats({ vendor, vendorWiseInvoice }) {
  const data = vendor?.data || vendor || {};

  // Default aggregate totals (in BDT) from backend
  const defaultTotalPurchase = Number(data.total_purchase_amount || data.total_purchase || 0);
  const defaultTotalPaid = Number(data.total_paid_amount || data.total_paid || 0);
  const defaultTotalDue = Number(data.total_due_amount || data.total_due || 0);

  // Calculate split totals based on invoice list
  let calcAedPurchase = 0, calcBdtPurchase = 0;
  let calcAedPaid = 0, calcBdtPaid = 0;
  let calcAedDue = 0, calcBdtDue = 0;
  let hasInvoices = false;

  if (vendorWiseInvoice) {
    const invoices = Array.isArray(vendorWiseInvoice?.data?.data)
      ? vendorWiseInvoice.data.data
      : Array.isArray(vendorWiseInvoice?.data)
      ? vendorWiseInvoice.data
      : Array.isArray(vendorWiseInvoice)
      ? vendorWiseInvoice
      : [];

    if (invoices.length > 0) {
      hasInvoices = true;
      invoices.forEach(inv => {
        const payModeString = inv.pay_mode || '';
        const isAed = payModeString.includes('(AED @');
        const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
        const invoiceAedRate = isAed && aedRateMatch ? parseFloat(aedRateMatch[1]) : 1;
        
        const tAmt = Number(inv.sub_total || inv.total_amount || 0);
        const pAmt = Number(inv.paid_amount || 0);
        const dAmt = Number(inv.due_amount || inv.due || 0);
        
        if (isAed) {
          calcAedPurchase += (tAmt / invoiceAedRate);
          calcAedPaid += (pAmt / invoiceAedRate);
          calcAedDue += (dAmt / invoiceAedRate);
        } else {
          calcBdtPurchase += tAmt;
          calcBdtPaid += pAmt;
          calcBdtDue += dAmt;
        }
      });
    }
  }

  // Use calculated separate totals if invoices are loaded, otherwise use default BDT totals
  const showCalculated = hasInvoices;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-black">
      {/* Total Purchase */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Purchase</p>
          <div className="mt-1 space-y-0.5">
            {showCalculated && calcAedPurchase > 0 && <p className="text-[17px] leading-tight font-extrabold text-neutral-900">AED {formatBDT(calcAedPurchase)}</p>}
            {(!showCalculated || calcBdtPurchase > 0 || (!calcAedPurchase && !calcBdtPurchase)) && (
              <p className="text-[17px] leading-tight font-extrabold text-neutral-900">BDT {formatBDT(showCalculated ? calcBdtPurchase : defaultTotalPurchase)}</p>
            )}
          </div>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 ml-2">
          <ShoppingCart size={20} />
        </div>
      </div>

      {/* Total Paid */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Paid</p>
          <div className="mt-1 space-y-0.5">
            {showCalculated && calcAedPaid > 0 && <p className="text-[17px] leading-tight font-extrabold text-emerald-600">AED {formatBDT(calcAedPaid)}</p>}
            {(!showCalculated || calcBdtPaid > 0 || (!calcAedPaid && !calcBdtPaid)) && (
              <p className="text-[17px] leading-tight font-extrabold text-emerald-600">BDT {formatBDT(showCalculated ? calcBdtPaid : defaultTotalPaid)}</p>
            )}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 ml-2">
          <CheckCircle size={20} />
        </div>
      </div>

      {/* Total Due */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Due</p>
          <div className="mt-1 space-y-0.5">
            {showCalculated && calcAedDue > 0 && <p className="text-[17px] leading-tight font-extrabold text-rose-600">AED {formatBDT(calcAedDue)}</p>}
            {(!showCalculated || calcBdtDue > 0 || (!calcAedDue && !calcBdtDue)) && (
              <p className="text-[17px] leading-tight font-extrabold text-rose-600">BDT {formatBDT(showCalculated ? calcBdtDue : defaultTotalDue)}</p>
            )}
          </div>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 ml-2">
          <AlertCircle size={20} />
        </div>
      </div>
    </div>
  );
}
