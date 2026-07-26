'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, ArrowDownToLine, LogOut, Search, FileText } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [currency, setCurrency] = useState('TK');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sell', href: '/dashboard/sell', icon: ShoppingCart },
    { name: 'Purchase', href: '/dashboard/purchase', icon: ArrowDownToLine },
    { name: 'Balance Sheet', href: '/dashboard/balance-sheet', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-neutral-200 bg-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200">
          <h1 className="text-xl font-light tracking-widest text-black">EMAAR</h1>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive 
                    ? 'bg-black text-white font-medium' 
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions, customers..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-300 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 p-0.5">
              {['TK', 'USD', 'AED'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    currency === curr 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <div className="h-8 w-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              <span className="text-xs font-medium text-black">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
