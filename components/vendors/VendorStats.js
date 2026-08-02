'use client';

import React from 'react';
import { ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';

const formatBDT = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function VendorStats({ vendor }) {
  const data = vendor?.data || vendor || {};

  const totalPurchase = Number(data.total_purchase_amount || data.total_purchase || 0);
  const totalPaid = Number(data.total_paid_amount || data.total_paid || 0);
  const totalDue = Number(data.total_due_amount || data.total_due || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-black">
      {/* Total Purchase */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Purchase</p>
          <p className="text-xl font-extrabold text-neutral-900 mt-1">BDT {formatBDT(totalPurchase)}</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <ShoppingCart size={20} />
        </div>
      </div>

      {/* Total Paid */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Paid</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">BDT {formatBDT(totalPaid)}</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CheckCircle size={20} />
        </div>
      </div>

      {/* Total Due */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Due</p>
          <p className="text-xl font-extrabold text-rose-600 mt-1">BDT {formatBDT(totalDue)}</p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <AlertCircle size={20} />
        </div>
      </div>
    </div>
  );
}
