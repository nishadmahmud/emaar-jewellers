import {
  Boxes,
  ReceiptText,
  PackagePlus,
  Wallet,
  UsersRound,
  Banknote,
  BarChart3,
  Settings as SettingsIcon,
  LayoutDashboard,
} from "lucide-react";

export const rolesFeatures = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    feature_code: "DASHBOARD",
    status: false,
    feature_options: [
      { name: "View Dashboard", feature_code: "DASHBOARD_VIEW", status: false },
    ],
  },
  {
    name: "Products",
    icon: Boxes,
    feature_code: "PRODUCTS",
    status: false,
    feature_options: [
      { name: "Add Product", feature_code: "PRODUCT_CREATE", status: false },
      { name: "Product List", feature_code: "PRODUCT_LIST", status: false },
    ],
  },
  {
    name: "Sale",
    icon: ReceiptText,
    feature_code: "SALE",
    status: false,
    feature_options: [
      { name: "Sale Billing (Sell)", feature_code: "SALE_BILLING", status: false },
      { name: "Sales List", feature_code: "SALE_LIST", status: false },
      { name: "Customer List", feature_code: "CUSTOMER_LIST", status: false },
      { name: "Clients List", feature_code: "CLIENT_LIST", status: false },
      { name: "Sale Invoice", feature_code: "SALE_INVOICE", status: false },
    ],
  },
  {
    name: "Purchase",
    icon: PackagePlus,
    feature_code: "PURCHASE",
    status: false,
    feature_options: [
      { name: "Purchase Billing", feature_code: "PURCHASE_BILLING", status: false },
      { name: "Purchases List", feature_code: "PURCHASE_LIST", status: false },
      { name: "Vendor List", feature_code: "VENDOR_LIST", status: false },
    ],
  },
  {
    name: "Expense",
    icon: Wallet,
    feature_code: "EXPENSE",
    status: false,
    feature_options: [
      { name: "Expense List", feature_code: "EXPENSE_LIST", status: false },
    ],
  },
  {
    name: "Quick Payment",
    icon: Wallet,
    feature_code: "QUICK_PAYMENT",
    status: false,
    feature_options: [
      { name: "Quick Payment List", feature_code: "QUICK_PAYMENT_LIST", status: false },
    ],
  },
  {
    name: "HRM",
    icon: UsersRound,
    feature_code: "HRM",
    status: false,
    feature_options: [
      { name: "Employee List", feature_code: "EMPLOYEE_LIST", status: false },
      { name: "Designation List", feature_code: "DESIGNATION_LIST", status: false },
      { name: "Department List", feature_code: "DEPARTMENT_LIST", status: false },
      { name: "Role List", feature_code: "ROLE_LIST", status: false },
      { name: "Employees Salary", feature_code: "EMPLOYEES_SALARY", status: false },
    ],
  },
  {
    name: "Finance",
    icon: Banknote,
    feature_code: "FINANCE",
    status: false,
    feature_options: [
      { name: "Fund Transfer", feature_code: "FUND_TRANSFER", status: false },
    ],
  },
  {
    name: "Analytics",
    icon: BarChart3,
    feature_code: "ANALYTICS",
    status: false,
    feature_options: [
      { name: "Ledger Statement Report", feature_code: "LEDGER_STATEMENT_REPORT", status: false },
      { name: "Balance Sheet Report", feature_code: "BALANCE_SHEET_REPORT", status: false },
      { name: "Due Report", feature_code: "DUE_REPORT", status: false },
      { name: "Profit And Loss Report", feature_code: "PROFIT_LOSS_REPORT", status: false },
    ],
  },
  {
    name: "Settings",
    icon: SettingsIcon,
    feature_code: "SETTINGS",
    status: false,
    feature_options: [
      { name: "Payments", feature_code: "SETTINGS_PAYMENTS", status: false },
    ],
  },
];
