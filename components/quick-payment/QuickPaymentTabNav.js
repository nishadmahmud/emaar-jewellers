'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, List, Tags } from 'lucide-react';

export default function QuickPaymentTabNav({ activeTab, onTabChange }) {
  const pathname = usePathname();

  const currentTab = activeTab || (pathname?.includes('/categories') ? 'categories' : 'list');

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          Quick Payment Management
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Track quick payment transactions and manage payment categories
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
        {onTabChange ? (
          <>
            <button
              type="button"
              onClick={() => onTabChange('list')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'list'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <List size={15} />
              <span>Quick Payment List</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('categories')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'categories'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Tags size={15} />
              <span>Payment Category List</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/dashboard/quick-payment/list"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'list'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <List size={15} />
              <span>Quick Payment List</span>
            </Link>
            <Link
              href="/dashboard/quick-payment/categories"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'categories'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Tags size={15} />
              <span>Payment Category List</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
