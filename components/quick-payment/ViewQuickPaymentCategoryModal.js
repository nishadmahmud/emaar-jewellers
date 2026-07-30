'use client';

import React from 'react';
import { X, Tag, FileText, Calendar, Hash } from 'lucide-react';

export default function ViewQuickPaymentCategoryModal({ open, category, onClose }) {
  if (!open || !category) return null;

  const catName = category.expense_name || category.name || category.catogory_name || 'N/A';
  const transCat = category.transaction_category || 'Quick Payment';
  const desc = category.expense_description || category.description || 'No description provided';
  const createdAt = category.created_at ? new Date(category.created_at).toLocaleString() : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Payment Category Details</h3>
              <p className="text-xs text-neutral-500">Category #{category.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
              <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                <Hash size={14} /> Category ID
              </span>
              <span className="font-mono font-bold text-neutral-900">#{category.id}</span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
              <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                <Tag size={14} /> Category Name
              </span>
              <span className="font-bold text-neutral-900 text-sm">{catName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
              <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                <Tag size={14} /> Transaction Category
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {transCat}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                <Calendar size={14} /> Created At
              </span>
              <span className="font-medium text-neutral-700">{createdAt}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-medium flex items-center gap-1.5">
              <FileText size={14} /> Description
            </span>
            <div className="bg-white p-3 rounded-xl border border-neutral-200 text-neutral-800 leading-relaxed min-h-[60px]">
              {desc}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
