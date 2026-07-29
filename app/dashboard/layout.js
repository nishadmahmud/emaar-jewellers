'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, History, LogOut, Search, Settings, Package, PackagePlus, Menu, X, Users, ArrowDownToLine, FileText } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [currency, setCurrency] = useState('TK');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/dashboard/product-list', icon: Package },
    { name: 'Add Product', href: '/dashboard/add-product', icon: PackagePlus },
    { name: 'Sell', href: '/dashboard/sell', icon: ShoppingCart },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'Purchase', href: '/dashboard/purchase', icon: ArrowDownToLine },
    { name: 'Purchase History', href: '/dashboard/purchases', icon: History },
    { name: 'Balance Sheet', href: '/dashboard/balance-sheet', icon: FileText },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
  ];

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 text-neutral-900 flex print:h-auto print:overflow-visible print:bg-white print:block">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="relative flex w-64 flex-col bg-white h-full transform transition-transform ease-in-out duration-300">
            <div className="absolute right-0 top-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            <div className="h-16 flex items-center px-6 border-b border-neutral-200 shrink-0">
              <h1 className="text-xl font-light tracking-widest text-black">EMAAR</h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
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

            <div className="p-4 border-t border-neutral-200 shrink-0">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white border-r border-neutral-200 shrink-0 print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 shrink-0">
          <h1 className="text-xl font-light tracking-widest text-black">EMAAR</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
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

        <div className="p-4 border-t border-neutral-200 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full print:block print:h-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 print:hidden">
          <div className="flex items-center gap-4 flex-1">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-neutral-500 hover:text-black transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu size={24} />
            </button>
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
