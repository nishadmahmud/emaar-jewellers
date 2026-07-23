'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, ArrowDownToLine, LogOut, Search, Bell } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [currency, setCurrency] = useState('TK');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sell', href: '/dashboard/sell', icon: ShoppingCart },
    { name: 'Purchase', href: '/dashboard/purchase', icon: ArrowDownToLine },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-neutral-800 bg-black flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <h1 className="text-xl font-light tracking-widest">EMAAR</h1>
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
                    ? 'bg-white text-black font-medium' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-800 bg-black flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-neutral-500" />
              </div>
              <input
                type="text"
                placeholder="Search transactions, customers..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden">
              {['TK', 'USD', 'AED'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    currency === curr 
                      ? 'bg-white text-black' 
                      : 'bg-black text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button className="text-neutral-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full"></span>
            </button>

            <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <span className="text-sm font-medium">AD</span>
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
