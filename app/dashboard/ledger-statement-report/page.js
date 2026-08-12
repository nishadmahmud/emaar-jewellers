'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { pdf } from "@react-pdf/renderer";
import Select from "react-select";
import axios from "axios";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import LedgerStatementReportPDF from "./ledger-statement-report-pdf";

const API_URL = process.env.NEXT_PUBLIC_API;

const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function todayStartISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayEndISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export default function LedgerStatementReportPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  // Filters
  const [filters, setFilters] = useState({
    start_date: todayStartISO(),
    end_date: todayEndISO(),
    entity_value: "",
    selected_name: "",
    vendor_id: "",
    customer_id: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState("");

  const [customersData, setCustomersData] = useState([]);
  const [vendorsData, setVendorsData] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  
  const [reportData, setReportData] = useState(null);
  const [matchedAccounts, setMatchedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch Customers & Vendors initially
  useEffect(() => {
    if (!token) return;

    const fetchDropdownData = async () => {
      try {
        setCustomersLoading(true);
        setVendorsLoading(true);
        const [custRes, vendRes] = await Promise.all([
          axios.get(`${API_URL}/customer-lists?page=1&limit=1000`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/vendor-lists?page=1&limit=1000`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (custRes.data?.data?.data) {
          setCustomersData(custRes.data.data.data);
        }
        if (vendRes.data?.data?.data) {
          setVendorsData(vendRes.data.data.data);
        }
      } catch (err) {
        console.error("Failed to load customers or vendors", err);
      } finally {
        setCustomersLoading(false);
        setVendorsLoading(false);
      }
    };
    fetchDropdownData();
  }, [token]);

  const unifiedOptions = useMemo(() => {
    const map = new Map();

    if (Array.isArray(customersData)) {
      customersData.forEach((c) => {
        const name = (c.name || `Customer #${c.id}`).trim();
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { label: name, customer_id: c.id, vendor_id: "" });
        } else {
          map.get(key).customer_id = c.id;
        }
      });
    }

    if (Array.isArray(vendorsData)) {
      vendorsData.forEach((v) => {
        const name = (v.name || `Vendor #${v.id}`).trim();
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { label: name, customer_id: "", vendor_id: v.id });
        } else {
          map.get(key).vendor_id = v.id;
        }
      });
    }

    return Array.from(map.values()).map((item, idx) => ({
      value: `unified_${idx}`,
      label: item.label,
      customer_id: item.customer_id,
      vendor_id: item.vendor_id,
    }));
  }, [customersData, vendorsData]);

  // Generate Report
  const apply = useCallback(async () => {
    if (!token) return;
    setAppliedFilters(filters);
    
    if (!filters.customer_id && !filters.vendor_id) {
        toast.error("Please select a Customer or Vendor first");
        return;
    }

    try {
      setIsLoading(true);
      setError(false);

      const promises = [];
      if (filters.customer_id) {
        promises.push(
          axios.post(`${API_URL}/ledger-statement-report`, {
            start_date: filters.start_date,
            end_date: filters.end_date,
            customer_id: filters.customer_id
          }, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => ({ type: 'customer', data: res.data?.data || res.data }))
        );
      }

      if (filters.vendor_id) {
        promises.push(
          axios.post(`${API_URL}/ledger-statement-report`, {
            start_date: filters.start_date,
            end_date: filters.end_date,
            vendor_id: filters.vendor_id
          }, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => ({ type: 'vendor', data: res.data?.data || res.data }))
        );
      }

      // Fetch accounts to match against selected name
      promises.push(
        axios.get(`${API_URL}/payment-type-category-list?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => ({ type: 'accounts', data: res.data?.data?.data ?? res.data?.data ?? res.data ?? [] }))
      );

      // Fetch all sales invoices for the date range
      promises.push(
        axios.post(`${API_URL}/search-invoice?page=1&limit=5000`, {
           keyword: "", nameId: false, emailId: false, phoneId: false, product: false,
           startDate: filters.start_date, endDate: filters.end_date, dueOnly: false
        }, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => ({ type: 'sales_invoices', data: res.data?.data?.data || [] }))
        .catch(() => ({ type: 'sales_invoices', data: [] }))
      );

      // Fetch all purchase invoices for the date range
      promises.push(
        axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=5000`, {
           keyword: "", nameId: false, emailId: false, phoneId: false, product: false,
           startDate: filters.start_date, endDate: filters.end_date, dueOnly: false
        }, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => ({ type: 'purchase_invoices', data: res.data?.data?.data || [] }))
        .catch(() => ({ type: 'purchase_invoices', data: [] }))
      );

      const results = await Promise.all(promises);

      let totalOpeningBalance = 0;
      let allEntries = [];
      let foundMatchedAccounts = [];
      
      const salesMap = new Map();
      const purchaseMap = new Map();

      results.forEach(res => {
        if (res.type === 'sales_invoices') {
           res.data.forEach(inv => salesMap.set(inv.invoice_id, inv));
        } else if (res.type === 'purchase_invoices') {
           res.data.forEach(inv => purchaseMap.set(inv.invoice_id, inv));
        } else if (res.type === 'accounts') {
           const rawList = res.data;
           const flattenedAccounts = [];
           rawList.forEach((item) => {
             if (Array.isArray(item.payment_type_category)) {
               item.payment_type_category.forEach((acc) => {
                 flattenedAccounts.push({
                   ...acc,
                   payment_category_name: acc.payment_category_name || acc.name || item.type_name || "Account",
                   balance: Number(acc.paymentcategory_sum_payment_amount ?? acc.balance ?? acc.amount ?? 0),
                 });
               });
             } else {
               flattenedAccounts.push({
                 ...item,
                 payment_category_name: item.payment_category_name || item.name || "Account",
                 balance: Number(item.paymentcategory_sum_payment_amount ?? item.balance ?? item.amount ?? 0),
               });
             }
           });

           if (filters.selected_name) {
             const selectedFirstName = filters.selected_name.trim().split(' ')[0].toLowerCase();
             foundMatchedAccounts = flattenedAccounts.filter(acc => {
               if (!acc.payment_category_name) return false;
               const accFirstName = acc.payment_category_name.trim().split(' ')[0].toLowerCase();
               return accFirstName === selectedFirstName;
             });
           }
        } else {
          const type = res.type;
          const d = res.data;
          const opBal = Number(d.opening_balance) || 0;
          const entries = Array.isArray(d.ledger) ? d.ledger : [];

          // Force opening balance to 0 as per Evan's logic rules.
          totalOpeningBalance = 0;

          const mappedEntries = entries.map(e => ({
             ...e,
             source_type: type,
          }));
          
          allEntries = allEntries.concat(mappedEntries);
        }
      });

      // Sort serially by date ascending
      allEntries.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      // Separate transaction amount into Debit (Purchase) or Credit (Sale).
      allEntries = allEntries.map(e => {
        let amt = Number(e.balance) || Number(e.amount) || Number(e.sub_total) || 0;
        
        if (e.invoice_id) {
           if (e.invoice_id.startsWith("INV-") && salesMap.has(e.invoice_id)) {
              const inv = salesMap.get(e.invoice_id);
              amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
           } else if (e.invoice_id.startsWith("PUR-") && purchaseMap.has(e.invoice_id)) {
              const inv = purchaseMap.get(e.invoice_id);
              amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
           }
        }

        return {
          ...e,
          debit: e.source_type === 'vendor' ? amt : 0,
          credit: e.source_type === 'customer' ? amt : 0,
          balance: 0, // Will be calculated cumulatively later
        };
      });

      setReportData({
        opening_balance: totalOpeningBalance,
        ledger: allEntries
      });
      setMatchedAccounts(foundMatchedAccounts);

    } catch (err) {
      console.error(err);
      setError(true);
      toast.error("Failed to fetch ledger report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);


  const { openingBalance, ledgerEntries } = useMemo(() => {
    if (!reportData) return { openingBalance: 0, ledgerEntries: [] };
    return {
      openingBalance: Number(reportData.opening_balance) || 0,
      ledgerEntries: Array.isArray(reportData.ledger) ? reportData.ledger : [],
    };
  }, [reportData]);

  const { ledgerAED, ledgerBDT } = useMemo(() => {
    const aed = [];
    const bdt = [];
    if (!Array.isArray(ledgerEntries)) return { ledgerAED: aed, ledgerBDT: bdt };

    let runAed = openingBalance;
    let runBdt = openingBalance;

    ledgerEntries.forEach(entry => {
      const mode = (entry?.pay_mode || "").toUpperCase();
      if (mode.includes("AED")) {
        runAed = runAed + entry.credit - entry.debit;
        aed.push({ ...entry, balance: runAed });
      } else {
        runBdt = runBdt + entry.credit - entry.debit;
        bdt.push({ ...entry, balance: runBdt });
      }
    });
    return { ledgerAED: aed, ledgerBDT: bdt };
  }, [ledgerEntries, openingBalance]);

  const calculateTotals = (entries, opBalance) => {
    const defaultTotals = { opening_balance: opBalance, closing_balance: opBalance, total_debit: 0, total_credit: 0 };
    if (!entries || entries.length === 0) return defaultTotals;
    
    let totalDebit = 0;
    let totalCredit = 0;
    entries.forEach(e => {
        totalDebit += (e.debit || 0);
        totalCredit += (e.credit || 0);
    });

    return {
      opening_balance: opBalance,
      total_debit: totalDebit,
      total_credit: totalCredit,
      closing_balance: entries[entries.length - 1]?.balance ?? opBalance,
    };
  };

  const summaryTotalsAED = useMemo(() => calculateTotals(ledgerAED, openingBalance), [ledgerAED, openingBalance]);
  const summaryTotalsBDT = useMemo(() => calculateTotals(ledgerBDT, openingBalance), [ledgerBDT, openingBalance]);

  const { accountsAED, accountsBDT } = useMemo(() => {
    const aed = [];
    const bdt = [];
    matchedAccounts.forEach(acc => {
       const name = (acc.payment_category_name || "").toUpperCase();
       if (name.includes("(DH)") || name.includes("AED")) {
         aed.push(acc);
       } else {
         bdt.push(acc);
       }
    });
    return { accountsAED: aed, accountsBDT: bdt };
  }, [matchedAccounts]);

  const grandEndingAED = useMemo(() => {
    let bal = summaryTotalsAED.closing_balance;
    accountsAED.forEach(acc => bal += (Number(acc.balance) || 0));
    return bal;
  }, [summaryTotalsAED.closing_balance, accountsAED]);

  const grandEndingBDT = useMemo(() => {
    let bal = summaryTotalsBDT.closing_balance;
    accountsBDT.forEach(acc => bal += (Number(acc.balance) || 0));
    return bal;
  }, [summaryTotalsBDT.closing_balance, accountsBDT]);

  const filterEntries = (entries, q) => {
      if (!q) return entries;
      return entries.filter((entry) => {
        const particulars = (entry?.particulars || "").toLowerCase();
        const remarks = (entry?.remarks || "").toLowerCase();
        return particulars.includes(q) || remarks.includes(q);
      });
  };

  const filteredAED = useMemo(() => {
    try {
      const q = searchTerm.toLowerCase().trim();
      return filterEntries(ledgerAED, q);
    } catch { return ledgerAED; }
  }, [ledgerAED, searchTerm]);

  const filteredBDT = useMemo(() => {
    try {
      const q = searchTerm.toLowerCase().trim();
      return filterEntries(ledgerBDT, q);
    } catch { return ledgerBDT; }
  }, [ledgerBDT, searchTerm]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExcelExport = useCallback(() => {
    try {
      const createSheetData = (entries, totals, matchedAccs, grandBal) => {
          const ledgerData = entries.map((entry) => ({
            Date: entry.date ? new Date(entry.date).toLocaleDateString() : "-",
            Particulars: entry.particulars || "-",
            Debit: entry.debit ? fmt2(entry.debit) : "-",
            Credit: entry.credit ? fmt2(entry.credit) : "-",
            Balance: fmt2(entry.balance),
            Remarks: entry.remarks || "-",
          }));

          ledgerData.push({
            Date: "",
            Particulars: "TOTAL",
            Debit: fmt2(totals.total_debit),
            Credit: fmt2(totals.total_credit),
            Balance: fmt2(totals.closing_balance),
            Remarks: "",
          });

          if (matchedAccs.length > 0) {
              ledgerData.push({ Date: "", Particulars: "", Debit: "", Credit: "", Balance: "", Remarks: "" });
              ledgerData.push({
                  Date: "",
                  Particulars: "Ledger Closing Balance",
                  Debit: "",
                  Credit: "",
                  Balance: fmt2(totals.closing_balance),
                  Remarks: "",
              });
              matchedAccs.forEach(acc => {
                  ledgerData.push({
                      Date: "",
                      Particulars: `Account: ${acc.payment_category_name}`,
                      Debit: "",
                      Credit: "",
                      Balance: fmt2(acc.balance),
                      Remarks: "",
                  });
              });
              ledgerData.push({
                  Date: "",
                  Particulars: "GRAND ENDING BALANCE",
                  Debit: "",
                  Credit: "",
                  Balance: fmt2(grandBal),
                  Remarks: "",
              });
          }
          return ledgerData;
      };

      const wb = XLSX.utils.book_new();

      if (filteredBDT.length > 0 || accountsBDT.length > 0) {
          const bdtData = createSheetData(filteredBDT, summaryTotalsBDT, accountsBDT, grandEndingBDT);
          const wsBDT = XLSX.utils.json_to_sheet(bdtData);
          XLSX.utils.book_append_sheet(wb, wsBDT, "Ledger Statement BDT");
      }

      if (filteredAED.length > 0 || accountsAED.length > 0) {
          const aedData = createSheetData(filteredAED, summaryTotalsAED, accountsAED, grandEndingAED);
          const wsAED = XLSX.utils.json_to_sheet(aedData);
          XLSX.utils.book_append_sheet(wb, wsAED, "Ledger Statement AED");
      }

      if (filteredBDT.length === 0 && accountsBDT.length === 0 && filteredAED.length === 0 && accountsAED.length === 0) {
          const wsEmpty = XLSX.utils.json_to_sheet([{ Message: "No ledger data found." }]);
          XLSX.utils.book_append_sheet(wb, wsEmpty, "Ledger Statement");
      }

      XLSX.writeFile(wb, `ledger-statement-report-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      toast.error("Error exporting to Excel.");
    }
  }, [filteredBDT, summaryTotalsBDT, accountsBDT, grandEndingBDT, filteredAED, summaryTotalsAED, accountsAED, grandEndingAED]);

  const handlePDFExport = useCallback(async () => {
    try {
      const blob = await pdf(
        <LedgerStatementReportPDF
          logoUrl={session?.user?.profile_pic || null}
          ledgerAED={filteredAED}
          ledgerBDT={filteredBDT}
          summaryTotalsAED={summaryTotalsAED}
          summaryTotalsBDT={summaryTotalsBDT}
          filters={appliedFilters}
          user={session?.user}
          accountsAED={accountsAED}
          accountsBDT={accountsBDT}
          grandEndingAED={grandEndingAED}
          grandEndingBDT={grandEndingBDT}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Error generating PDF.");
    }
  }, [filteredAED, filteredBDT, summaryTotalsAED, summaryTotalsBDT, appliedFilters, session?.user, accountsAED, accountsBDT, grandEndingAED, grandEndingBDT]);

  const tableRef = useRef(null);
  const handlePrintTable = useCallback(() => {
    try {
      if (!tableRef.current) return;
      const content = tableRef.current.innerHTML;
      const w = window.open("", "PRINT", "height=900,width=1200");
      if (!w) return;
      w.document.write(`
        <html>
          <head>
            <title>Ledger Statement Report</title>
            <style>
              * { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              thead th { background: #f3f4f6; text-align: left; }
              th, td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; vertical-align: top; }
              .text-right { text-align: right; }
              .section-header { background: #e5e7eb; font-weight: bold; padding: 8px; margin-top: 10px; }
              .muted { color: #6b7280; font-size: 11px; }
            </style>
          </head>
          <body>${content}
            <script>window.onload = function(){ window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      w.document.close();
    } catch (err) {
      console.error(err);
      toast.error("Error printing table.");
    }
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  const renderLedgerTable = (title, entries, totals, matchedAccs, grandBal) => (
    <div className="mb-12">
      <div className="text-lg font-bold uppercase tracking-wide border-b border-neutral-300 pb-1 mb-4">{title}</div>
      <table className="w-full border-collapse border border-neutral-400 text-xs text-left mb-6">
        <thead>
          <tr className="bg-neutral-200 text-neutral-900">
            <th className="border border-neutral-400 p-2 uppercase w-[12%]">DATE</th>
            <th className="border border-neutral-400 p-2 uppercase">PARTICULARS</th>
            <th className="border border-neutral-400 p-2 text-right w-[13%] uppercase">DEBIT</th>
            <th className="border border-neutral-400 p-2 text-right w-[13%] uppercase">CREDIT</th>
            <th className="border border-neutral-400 p-2 text-right w-[13%] uppercase">BALANCE</th>
            <th className="border border-neutral-400 p-2 uppercase w-[15%]">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-blue-50/50">
            <td className="border border-neutral-400 p-2"></td>
            <td className="border border-neutral-400 p-2 text-right font-bold text-neutral-900">Opening Balance</td>
            <td className="border border-neutral-400 p-2"></td>
            <td className="border border-neutral-400 p-2"></td>
            <td className="border border-neutral-400 p-2 text-right font-bold text-neutral-900 whitespace-nowrap">{fmt2(totals.opening_balance)}</td>
            <td className="border border-neutral-400 p-2"></td>
          </tr>

          {entries.map((entry, idx) => {
            return (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="border border-neutral-400 p-2 text-neutral-700">
                  {entry.date ? new Date(entry.date).toLocaleDateString("en-GB") : "-"}
                </td>
                <td className="border border-neutral-400 p-2 text-neutral-700">
                  <span className="block whitespace-normal break-words">
                      {entry.invoice_id ? `${entry.invoice_id} ${entry.particulars ? `> ${entry.particulars}` : ""}` : (entry.particulars || "-")}
                  </span>
                </td>
                <td className="border border-neutral-400 p-2 text-right text-neutral-900 tabular-nums">
                  {entry?.debit ? fmt2(entry.debit) : "-"}
                </td>
                <td className="border border-neutral-400 p-2 text-right text-neutral-900 tabular-nums">
                  {entry?.credit ? fmt2(entry.credit) : "-"}
                </td>
                <td className="border border-neutral-400 p-2 text-right font-semibold whitespace-nowrap text-neutral-900 tabular-nums">
                  {fmt2(entry?.balance)}
                </td>
                <td className="border border-neutral-400 p-2 text-neutral-600 truncate max-w-[150px]">
                  {entry?.remarks || ""}
                </td>
              </tr>
            )
          })}

          {entries.length > 0 && (
            <tr className="bg-neutral-100 font-bold text-neutral-900">
              <td className="border border-neutral-400 p-2">Total</td>
              <td className="border border-neutral-400 p-2"></td>
              <td className="border border-neutral-400 p-2 text-right whitespace-nowrap tabular-nums">{fmt2(totals.total_debit)}</td>
              <td className="border border-neutral-400 p-2 text-right whitespace-nowrap tabular-nums">{fmt2(totals.total_credit)}</td>
              <td className="border border-neutral-400 p-2 text-right whitespace-nowrap tabular-nums">{fmt2(totals.closing_balance)}</td>
              <td className="border border-neutral-400 p-2"></td>
            </tr>
          )}

          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center text-neutral-500 py-8 border border-neutral-400">
                No ledger data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {matchedAccs.length > 0 && (
          <div className="border border-neutral-400 w-full md:max-w-sm ml-auto">
              <table className="w-full text-xs text-left">
                  <tbody>
                      <tr className="bg-neutral-100">
                          <td className="p-2 border-b border-neutral-400 font-semibold">Ledger Closing Balance</td>
                          <td className="p-2 border-b border-neutral-400 text-right font-semibold tabular-nums">{fmt2(totals.closing_balance)}</td>
                      </tr>
                      {matchedAccs.map((acc, i) => (
                          <tr key={i} className="border-b border-neutral-200 last:border-b-0">
                              <td className="p-2 text-neutral-600">Account: {acc.payment_category_name}</td>
                              <td className="p-2 text-right tabular-nums text-neutral-700">{fmt2(acc.balance)}</td>
                          </tr>
                      ))}
                      <tr className="bg-neutral-200">
                          <td className="p-2 font-bold uppercase border-t border-neutral-400">Grand Ending Balance</td>
                          <td className="p-2 text-right font-bold tabular-nums border-t border-neutral-400">{fmt2(grandBal)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 text-black">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                <ChevronLeft size={18} />
            </button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ledger Statement Report</h1>
                <p className="text-sm text-neutral-500 mt-1">View the unified ledger entries and balances.</p>
            </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date.slice(0, 10)}
                  onChange={(e) => handleFilterChange("start_date", e.target.value ? `${e.target.value}T00:00:00.000Z` : "")}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.end_date.slice(0, 10)}
                  onChange={(e) => handleFilterChange("end_date", e.target.value ? `${e.target.value}T23:59:59.999Z` : "")}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Search Name</label>
                <Select
                  isClearable
                  isSearchable
                  isLoading={customersLoading || vendorsLoading}
                  options={unifiedOptions}
                  value={filters.entity_value ? unifiedOptions.find(opt => opt.value === filters.entity_value) : null}
                  onChange={(option) => {
                    setFilters(prev => ({
                      ...prev,
                      entity_value: option?.value || "",
                      selected_name: option?.label || "",
                      customer_id: option?.customer_id || "",
                      vendor_id: option?.vendor_id || ""
                    }));
                  }}
                  placeholder="Search Name..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      "&:hover": { borderColor: "#d1d5db" },
                      minHeight: '38px',
                      borderRadius: '0.5rem',
                    }),
                  }}
                />
              </div>
              <div>
                <button
                  onClick={apply}
                  disabled={isLoading}
                  className="w-full h-[38px] bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  Generate
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <div className="relative flex-1 max-w-lg hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  placeholder="Search particulars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="relative">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 bg-white text-black border border-neutral-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
                >
                    <FileSpreadsheet size={16} className="text-emerald-600" /> Export
                </button>
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-10">
                        <button onClick={() => { handleExcelExport(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-emerald-600" /> Excel
                        </button>
                        <button onClick={() => { handlePDFExport(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 border-t border-neutral-100">
                            <FileText size={16} className="text-red-500" /> PDF
                        </button>
                        <button onClick={() => { handlePrintTable(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 border-t border-neutral-100">
                            <Printer size={16} className="text-blue-500" /> Print
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white p-4 md:p-8 shadow-lg max-w-5xl mx-auto min-h-[297mm] print:shadow-none print:p-0 print:max-w-none rounded-xl border border-neutral-200">
        <div className="flex flex-col md:flex-row border-b-2 border-neutral-800 pb-4 mb-4 gap-4 md:gap-0">
          <div className="w-full md:w-[15%] md:pr-4 border-b-2 md:border-b-0 md:border-r-2 border-neutral-300 flex items-center justify-center pb-4 md:pb-0">
            <div className="w-24 h-24 flex items-center justify-center">
              {session?.user?.profile_pic ? (
                <img src={session.user.profile_pic} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-neutral-400 text-xs font-bold">NO LOGO</span>
              )}
            </div>
          </div>
          <div className="w-full md:w-[50%] md:px-4 border-b-2 md:border-b-0 md:border-r-2 border-neutral-300 flex flex-col justify-center text-center md:text-left pb-4 md:pb-0">
            <h2 className="text-xl md:text-2xl font-bold uppercase mb-1">{session?.user?.outlet_name || "EMAAR JEWELLERS"}</h2>
            <p className="text-neutral-700 text-sm mt-2">{session?.user?.address || "Address Line 1"}</p>
            <div className="mt-2 space-y-0.5">
              <p className="text-neutral-700 text-sm">Mobile: {session?.user?.phone || "-"}</p>
              <p className="text-neutral-700 text-sm">Email: {session?.user?.email || "-"}</p>
            </div>
          </div>
          <div className="w-full md:w-[35%] md:pl-4 text-center md:text-right flex flex-col md:items-end justify-center">
            <div className="text-sm space-y-1">
              <p><span className="font-bold">Ref N°:</span> {session?.user?.ref_no || "REP000000"}</p>
              <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString("en-GB")}</p>
              <p><span className="font-bold">Start Date:</span> {new Date(appliedFilters.start_date).toLocaleDateString("en-GB")}</p>
              <p><span className="font-bold">End Date:</span> {new Date(appliedFilters.end_date).toLocaleDateString("en-GB")}</p>
              <p><span className="font-bold">Statement For:</span> {appliedFilters.selected_name || "All"}</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide border-b border-neutral-900 inline-block pb-1">LEDGER STATEMENT</h1>
        </div>

        {error ? (
          <div className="text-center text-red-500 py-10 font-medium">Error loading data.</div>
        ) : (
          <div className="overflow-x-auto" ref={tableRef}>
             {(filteredBDT.length > 0 || accountsBDT.length > 0) && renderLedgerTable("LEDGER STATEMENT - BDT", filteredBDT, summaryTotalsBDT, accountsBDT, grandEndingBDT)}
             {(filteredAED.length > 0 || accountsAED.length > 0) && renderLedgerTable("LEDGER STATEMENT - AED", filteredAED, summaryTotalsAED, accountsAED, grandEndingAED)}
             
             {filteredBDT.length === 0 && accountsBDT.length === 0 && filteredAED.length === 0 && accountsAED.length === 0 && (
                <div className="text-center text-neutral-500 py-8 border border-neutral-400">
                  No ledger data found.
                </div>
             )}
          </div>
        )}
        
        <div className="mt-8 pt-2 border-t border-neutral-200 text-center text-[10px] text-neutral-500">
          {session?.user?.outlet_name || "Emaar Jewellers"} © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
