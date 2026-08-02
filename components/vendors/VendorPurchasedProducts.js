'use client';

import React from 'react';
import { Package, Tag } from 'lucide-react';

const formatBDT = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function VendorPurchasedProducts({ vendorWiseProduct }) {
  const products = Array.isArray(vendorWiseProduct?.data?.data)
    ? vendorWiseProduct.data.data
    : Array.isArray(vendorWiseProduct?.data)
    ? vendorWiseProduct.data
    : Array.isArray(vendorWiseProduct)
    ? vendorWiseProduct
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 p-5 space-y-4 text-black">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-neutral-600" />
          <h4 className="font-bold text-base text-neutral-900">Supplied Products</h4>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg">
          {products.length} Items
        </span>
      </div>

      {products.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400">No supplied products recorded for this period.</div>
      ) : (
        <>
          {/* Mobile View Card List */}
          <div className="block sm:hidden divide-y divide-neutral-100">
            {products.map((item, idx) => {
              const pName = item.product_name || item.name || item.product_info?.name || 'Unnamed Product';
              const qty = item.total_qty || item.qty || item.quantity || 1;
              const totalVal = Number(item.total_amount || item.total_price || item.price || 0);

              return (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-neutral-900">{pName}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Quantity: {qty} Pcs</p>
                  </div>
                  <div className="text-right font-extrabold text-xs text-neutral-900">
                    BDT {formatBDT(totalVal)}
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
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 text-center">Total Qty</th>
                  <th className="py-2.5 px-4 text-right">Total Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((item, idx) => {
                  const pName = item.product_name || item.name || item.product_info?.name || 'Unnamed Product';
                  const qty = item.total_qty || item.qty || item.quantity || 1;
                  const totalVal = Number(item.total_amount || item.total_price || item.price || 0);

                  return (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-900">{pName}</td>
                      <td className="py-3 px-4 text-center font-semibold text-neutral-700">{qty} Pcs</td>
                      <td className="py-3 px-4 text-right font-extrabold text-neutral-900">BDT {formatBDT(totalVal)}</td>
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
