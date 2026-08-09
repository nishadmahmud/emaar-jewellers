'use client';

import React, { useState } from 'react';
import { Store, Phone, Mail, MapPin, DollarSign, CreditCard } from 'lucide-react';
import PayVendorDueModal from '@/components/vendors/PayVendorDueModal';

export default function VendorProfileSidebar({ vendor, vendorWiseInvoice, onRefresh }) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const vendorData = vendor?.data || vendor || {};
  const name = vendorData.name || vendorData.vendor_name || 'Vendor Profile';
  const phone = vendorData.phone || vendorData.mobile_number || vendorData.mobile || 'N/A';
  const email = vendorData.email || 'N/A';
  const address = vendorData.address || 'N/A';
  const totalDue = Number(vendorData.total_due_amount || vendorData.due_amount || vendorData.due || 0);

  // Calculate split totals based on invoice list
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
        
        const dAmt = Number(inv.due_amount || inv.due || 0);
        
        if (isAed) {
          calcAedDue += (dAmt / invoiceAedRate);
        } else {
          calcBdtDue += dAmt;
        }
      });
    }
  }

  const showCalculated = hasInvoices;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm space-y-5 text-black">
      {/* Vendor Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
          <Store size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base text-neutral-900 truncate">{name}</h3>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">ID: #{vendorData.id || 'N/A'}</p>
        </div>
      </div>

      {/* Info Details List */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2.5 text-neutral-600">
          <Phone size={15} className="text-neutral-400 shrink-0" />
          <span className="font-medium">{phone}</span>
        </div>
        <div className="flex items-center gap-2.5 text-neutral-600">
          <Mail size={15} className="text-neutral-400 shrink-0" />
          <span className="truncate font-medium">{email}</span>
        </div>
        <div className="flex items-start gap-2.5 text-neutral-600">
          <MapPin size={15} className="text-neutral-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{address}</span>
        </div>
      </div>

      {/* Total Due Banner & Pay Button */}
      <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">REMAINING DUE</span>
          <div className="text-right flex flex-col gap-0.5">
            {showCalculated && calcAedDue > 0 && <span className="text-base leading-tight font-extrabold text-rose-600">AED {calcAedDue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
            {(!showCalculated || calcBdtDue > 0 || (!calcAedDue && !calcBdtDue)) && (
              <span className="text-base leading-tight font-extrabold text-rose-600">BDT {(showCalculated ? calcBdtDue : totalDue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPayModalOpen(true)}
          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <CreditCard size={15} />
          <span>Pay Vendor Due</span>
        </button>
      </div>

      {/* Dedicated Pay Vendor Due Modal */}
      {isPayModalOpen && (
        <PayVendorDueModal
          open={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          vendorId={vendorData.id}
          vendorName={name}
          totalDue={totalDue}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
