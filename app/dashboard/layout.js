'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  History,
  LogOut,
  Search,
  Settings,
  Package,
  PackagePlus,
  Menu,
  X,
  Users,
  ArrowDownToLine,
  FileText,
  Receipt,
  CreditCard,
  Tags,
  ChevronDown,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import QuickPaymentModal from '@/components/quick-payment/QuickPaymentModal';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [currency, setCurrency] = useState('AED');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);

  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    if (pathname?.includes('/expense')) {
      setOpenDropdowns((prev) => ({ ...prev, Expense: true }));
    }
    if (pathname?.includes('/quick-payment')) {
      setOpenDropdowns((prev) => ({ ...prev, 'Quick Payment': true }));
    }
  }, [pathname]);

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/dashboard/product-list', icon: Package },
    { name: 'Add Product', href: '/dashboard/add-product', icon: PackagePlus },
    { name: 'Sell', href: '/dashboard/sell', icon: ShoppingCart },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'Purchase', href: '/dashboard/purchase', icon: ArrowDownToLine },
    { name: 'Purchase History', href: '/dashboard/purchases', icon: History },
    { name: 'Vendors', href: '/dashboard/vendors', icon: Users },
    { name: 'Balance Sheet', href: '/dashboard/balance-sheet', icon: FileText },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    {
      name: 'Expense',
      icon: Receipt,
      children: [
        { name: 'Expense List', href: '/dashboard/expense/list', icon: Receipt },
        { name: 'Expense Category List', href: '/dashboard/expense/categories', icon: Tags },
      ],
    },
    {
      name: 'Quick Payment',
      icon: CreditCard,
      children: [
        { name: 'Quick Payment List', href: '/dashboard/quick-payment/list', icon: CreditCard },
        { name: 'Payment Category List', href: '/dashboard/quick-payment/categories', icon: Tags },
      ],
    },
  ];

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;

    if (item.children) {
      const isOpen = Boolean(openDropdowns[item.name]);
      const isAnyChildActive = item.children.some((child) => child.href && pathname === child.href);

      return (
        <div key={item.name} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleDropdown(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer font-medium ${
              isAnyChildActive
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} />
              <span>{item.name}</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="pl-6 space-y-1 border-l-2 border-neutral-200/80 ml-4 py-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = child.href ? pathname === child.href : false;

                if (child.action === 'quick-payment-modal') {
                  return (
                    <button
                      key={child.name}
                      type="button"
                      onClick={() => {
                        if (isMobile) setIsMobileMenuOpen(false);
                        setIsQuickPaymentOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors text-left cursor-pointer"
                    >
                      <ChildIcon size={15} />
                      <span>{child.name}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors font-medium ${
                      isChildActive
                        ? 'bg-black text-white font-bold shadow-2xs'
                        : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                    }`}
                  >
                    <ChildIcon size={15} />
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = item.href ? pathname === item.href : false;
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors font-medium ${
          isActive
            ? 'bg-black text-white font-medium shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
        }`}
      >
        <Icon size={18} />
        <span>{item.name}</span>
      </Link>
    );
  };

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
              {navigation.map((item) => renderNavItem(item, true))}
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
          {navigation.map((item) => renderNavItem(item, false))}
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
                placeholder="Search products, sales, customers..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-black"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/pos"
                className="bg-black hover:bg-neutral-800 text-white rounded-lg text-xs flex items-center gap-1.5 px-3 py-2 font-semibold shadow-sm transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="inline">POS</span>
              </Link>
              <Link
                href="/dashboard/purchase"
                className="bg-black hover:bg-neutral-800 text-white rounded-lg text-xs flex items-center gap-1.5 px-3 py-2 font-semibold shadow-sm transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="inline">Purchase</span>
              </Link>
            </div>

            <button
              onClick={() => setIsQuickPaymentOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <CreditCard size={15} />
              <span>Quick Payment</span>
            </button>

            <div className="h-8 w-px bg-neutral-200" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
                EJ
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-black leading-tight">Emaar Jewellers</p>
                <p className="text-[10px] text-neutral-500 leading-tight">Admin Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>

      {/* Global Quick Payment Modal */}
      <QuickPaymentModal open={isQuickPaymentOpen} onClose={() => setIsQuickPaymentOpen(false)} />
    </div>
  );
}
