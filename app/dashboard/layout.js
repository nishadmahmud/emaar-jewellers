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
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import QuickPaymentModal from '@/components/quick-payment/QuickPaymentModal';

export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [currency, setCurrency] = useState('AED');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);

  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    if (pathname?.includes('/expense')) {
      setOpenDropdowns((prev) => ({ ...prev, Expense: true }));
    }
    if (pathname?.includes('/quick-payment')) {
      setOpenDropdowns((prev) => ({ ...prev, 'Quick Payment': true }));
    }
    if (pathname?.includes('/settings')) {
      setOpenDropdowns((prev) => ({ ...prev, Settings: true }));
    }
  }, [pathname]);

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const navigation = [
    {
      section: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Clients', href: '/dashboard/clients', icon: Users },
      ]
    },
    {
      section: 'Products',
      items: [
        { name: 'Add Product', href: '/dashboard/add-product', icon: PackagePlus },
        { name: 'Product List', href: '/dashboard/product-list', icon: Package },
      ]
    },
    {
      section: 'Sales',
      items: [
        { name: 'Sell', href: '/dashboard/sell', icon: ShoppingCart },
        { name: 'Sales History', href: '/dashboard/sales', icon: History },
      ]
    },
    {
      section: 'Purchase',
      items: [
        { name: 'Buy', href: '/dashboard/purchase', icon: ArrowDownToLine },
        { name: 'Purchase History', href: '/dashboard/purchases', icon: History },
      ]
    },
    {
      section: 'Finance',
      items: [
        { name: 'Fund Transfer', href: '/dashboard/finance/fund-transfer', icon: ArrowRightLeft },
        { name: 'Balance Sheet', href: '/dashboard/balance-sheet', icon: FileText },
      ]
    },
    {
      section: 'Analytics',
      items: [
        { name: 'Transfer History', href: '/dashboard/transfer-history', icon: History },
        { name: 'Ledger Statement Report', href: '/dashboard/ledger-statement-report', icon: FileText },
        { name: 'Profit Loss Report', href: '/dashboard/profit-loss-report', icon: FileText },
      ]
    },
    {
      section: 'HRM',
      items: [
        { name: 'Departments', href: '/dashboard/hrm/departments', icon: Users },
        { name: 'Designations', href: '/dashboard/hrm/designations', icon: Users },
        { name: 'Roles', href: '/dashboard/hrm/roles', icon: Users },
        { name: 'Employees', href: '/dashboard/hrm/employees', icon: Users },
        { name: 'Payroll', href: '/dashboard/hrm/employees-salary', icon: Receipt },
      ]
    },
    {
      section: 'Management',
      items: [
        { name: 'Expense List', href: '/dashboard/expense/list', icon: Receipt },
        { name: 'Expense Categories', href: '/dashboard/expense/categories', icon: Tags },
        { name: 'Quick Payment List', href: '/dashboard/quick-payment/list', icon: CreditCard },
        { name: 'Payment Categories', href: '/dashboard/quick-payment/categories', icon: Tags },
        { name: 'Payments Settings', href: '/dashboard/settings/payments', icon: Settings },
      ]
    }
  ];

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    const isActive = item.href ? pathname === item.href : false;
    const isCollapsed = !isMobile && isSidebarCollapsed;

    if (item.action === 'quick-payment-modal') {
      return (
        <button
          key={item.name}
          type="button"
          onClick={() => {
            if (isMobile) setIsMobileMenuOpen(false);
            setIsQuickPaymentOpen(true);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors text-left cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? item.name : undefined}
        >
          <Icon size={18} className="shrink-0" />
          {!isCollapsed && <span>{item.name}</span>}
        </button>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors font-medium ${
          isActive
            ? 'bg-black text-white font-medium shadow-xs'
            : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
        } ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? item.name : undefined}
      >
        <Icon size={18} className="shrink-0" />
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  const renderNavGroup = (group, isMobile = false) => {
    const isCollapsed = !isMobile && isSidebarCollapsed;
    return (
      <div key={group.section} className="mb-6 last:mb-0">
        {!isCollapsed ? (
          <h3 className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">{group.section}</h3>
        ) : (
          <div className="px-3 mb-2 h-4" />
        )}
        <div className="space-y-1">
          {group.items.map((item) => renderNavItem(item, isMobile))}
        </div>
      </div>
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

            <div className="flex flex-col justify-center px-6 py-4 border-b border-neutral-200 shrink-0">
              <h1 className="text-xl font-light tracking-widest text-black">EMAAR</h1>
              {session?.user?.outlet_name && (
                <div className="font-semibold text-sm text-neutral-500 mt-1">
                  {session.user.outlet_name}
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4">
              {navigation.map((group) => renderNavGroup(group, true))}
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
      <div className={`hidden md:flex flex-col bg-white border-r border-neutral-200 shrink-0 print:hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex flex-col justify-center px-6 py-4 border-b border-neutral-200 shrink-0 ${isSidebarCollapsed ? 'items-center' : 'items-start'}`}>
          {!isSidebarCollapsed ? (
            <>
              <h1 className="text-xl font-light tracking-widest text-black">EMAAR</h1>
              {session?.user?.outlet_name && (
                <div className="font-semibold text-sm text-neutral-500 mt-1 truncate w-full">
                  {session.user.outlet_name}
                </div>
              )}
            </>
          ) : (
            <h1 className="text-xl font-light tracking-widest text-black">E</h1>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4">
          {navigation.map((group) => renderNavGroup(group, false))}
        </nav>

        <div className="p-4 border-t border-neutral-200 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title={isSidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
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
              <span className="sr-only">Open mobile menu</span>
              <Menu size={24} />
            </button>
            <button
              type="button"
              className="hidden md:block p-2 -ml-2 text-neutral-500 hover:text-black transition-colors"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <span className="sr-only">Toggle sidebar</span>
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
                href="/dashboard/sell"
                className="bg-black hover:bg-neutral-800 text-white rounded-lg text-xs flex items-center gap-1.5 px-3 py-2 font-semibold shadow-sm transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="inline">Sell</span>
              </Link>
              <Link
                href="/dashboard/purchase"
                className="bg-black hover:bg-neutral-800 text-white rounded-lg text-xs flex items-center gap-1.5 px-3 py-2 font-semibold shadow-sm transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="inline">Buy</span>
              </Link>
            </div>



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

      {/* Floating Action Button for Fund Transfer */}
      <Link
        href="/dashboard/finance/fund-transfer"
        className="z-50 bg-black hover:bg-neutral-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center print:hidden"
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem' }}
        title="Fund Transfer"
      >
        <ArrowRightLeft size={24} />
      </Link>
    </div>
  );
}
