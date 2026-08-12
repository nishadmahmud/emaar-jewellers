'use client';

import React, { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import axios from "axios";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Select from "react-select";
import { toast } from "sonner";

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

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


import FundHeader from "@/components/finance/fund-transfer/FundHeader";
import FundTransferForm from "@/components/finance/fund-transfer/FundTransferForm";
import AddBalanceForm from "@/components/finance/fund-transfer/AddBalanceForm";

export default function FundTransferPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;
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
  const [customersData, setCustomersData] = useState([]);
  const [vendorsData, setVendorsData] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  
  const [reportData, setReportData] = useState(null);
  const [matchedAccounts, setMatchedAccounts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch Customers & Vendors initially
  React.useEffect(() => {
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
  }, [token, API_URL]);

  const unifiedOptions = React.useMemo(() => {
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

  const apply = async () => {
    if (!token) return;
    setAppliedFilters(filters);
    
    if (!filters.customer_id && !filters.vendor_id) {
        toast.error("Please select a Customer or Vendor first");
        return;
    }

    try {
      setIsGenerating(true);

      const promises = [];

      // Calculate previous period dates for opening balance calculation
      const currentStart = new Date(filters.start_date);
      const prevStart = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth(), 1, 0, 0, 0, 0));
      const prevEnd = new Date(currentStart.getTime() - 1); // 1 ms before current start
      const isPrevPeriodValid = prevEnd.getTime() >= prevStart.getTime();

      if (filters.customer_id) {
        promises.push(
          axios.post(`${API_URL}/ledger-statement-report`, {
            start_date: filters.start_date,
            end_date: filters.end_date,
            customer_id: filters.customer_id
          }, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => ({ type: 'customer', data: res.data?.data || res.data }))
        );
        if (isPrevPeriodValid) {
            promises.push(
              axios.post(`${API_URL}/ledger-statement-report`, {
                start_date: prevStart.toISOString(),
                end_date: prevEnd.toISOString(),
                customer_id: filters.customer_id
              }, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => ({ type: 'prev_customer', data: res.data?.data || res.data }))
              .catch(() => ({ type: 'prev_customer', data: [] }))
            );
        }
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
        if (isPrevPeriodValid) {
            promises.push(
              axios.post(`${API_URL}/ledger-statement-report`, {
                start_date: prevStart.toISOString(),
                end_date: prevEnd.toISOString(),
                vendor_id: filters.vendor_id
              }, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => ({ type: 'prev_vendor', data: res.data?.data || res.data }))
              .catch(() => ({ type: 'prev_vendor', data: [] }))
            );
        }
      }

      // Fetch accounts to match against selected name
      promises.push(
        axios.get(`${API_URL}/payment-type-list?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
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
      if (isPrevPeriodValid) {
          promises.push(
            axios.post(`${API_URL}/search-invoice?page=1&limit=5000`, {
               keyword: "", nameId: false, emailId: false, phoneId: false, product: false,
               startDate: prevStart.toISOString(), endDate: prevEnd.toISOString(), dueOnly: false
            }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => ({ type: 'prev_sales_invoices', data: res.data?.data?.data || [] }))
            .catch(() => ({ type: 'prev_sales_invoices', data: [] }))
          );
      }

      // Fetch all purchase invoices for the date range
      promises.push(
        axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=5000`, {
           keyword: "", nameId: false, emailId: false, phoneId: false, product: false,
           startDate: filters.start_date, endDate: filters.end_date, dueOnly: false
        }, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => ({ type: 'purchase_invoices', data: res.data?.data?.data || [] }))
        .catch(() => ({ type: 'purchase_invoices', data: [] }))
      );
      if (isPrevPeriodValid) {
          promises.push(
            axios.post(`${API_URL}/search-purchase-invoice?page=1&limit=5000`, {
               keyword: "", nameId: false, emailId: false, phoneId: false, product: false,
               startDate: prevStart.toISOString(), endDate: prevEnd.toISOString(), dueOnly: false
            }, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => ({ type: 'prev_purchase_invoices', data: res.data?.data?.data || [] }))
            .catch(() => ({ type: 'prev_purchase_invoices', data: [] }))
          );
      }

      const results = await Promise.all(promises);

      let totalOpeningBalance = 0;
      let allEntries = [];
      let foundMatchedAccounts = [];
      
      const salesMap = new Map();
      const purchaseMap = new Map();

      let prevAllEntries = [];
      const prevSalesMap = new Map();
      const prevPurchaseMap = new Map();

      results.forEach(res => {
        if (res.type === 'sales_invoices') {
           res.data.forEach(inv => salesMap.set(inv.invoice_id, inv));
        } else if (res.type === 'purchase_invoices') {
           res.data.forEach(inv => purchaseMap.set(inv.invoice_id, inv));
        } else if (res.type === 'prev_sales_invoices') {
           res.data.forEach(inv => prevSalesMap.set(inv.invoice_id, inv));
        } else if (res.type === 'prev_purchase_invoices') {
           res.data.forEach(inv => prevPurchaseMap.set(inv.invoice_id, inv));
        } else if (res.type === 'customer' || res.type === 'vendor') {
           const type = res.type;
           const d = res.data;
           const entries = Array.isArray(d.ledger) ? d.ledger : [];

           const mappedEntries = entries.map(e => ({
              ...e,
              source_type: type,
           }));
           
           allEntries = allEntries.concat(mappedEntries);
         } else if (res.type === 'prev_customer' || res.type === 'prev_vendor') {
            const type = res.type.replace('prev_', '');
            const d = res.data;
            const entries = Array.isArray(d.ledger) ? d.ledger : [];
            const mappedEntries = entries.map(e => ({
               ...e,
               source_type: type,
            }));
            prevAllEntries = prevAllEntries.concat(mappedEntries);
         } else if (res.type === 'accounts') {
           const rawList = res.data;
           const flattenedAccounts = [];
           rawList.forEach((item) => {
             if (Array.isArray(item.payment_type_category)) {
               item.payment_type_category.forEach((acc) => {
                 flattenedAccounts.push({
                   ...acc,
                   actual_payment_type_id: item.id, // Parent's ID is the true payment type ID
                   payment_category_name: acc.payment_category_name || acc.name || item.type_name || "Account",
                   balance: Number(acc.paymentcategory_sum_payment_amount ?? acc.balance ?? acc.amount ?? 0),
                 });
               });
             } else {
               flattenedAccounts.push({
                 ...item,
                 actual_payment_type_id: item.id, // This is the type itself
                 payment_category_name: item.payment_category_name || item.name || item.type_name || "Account",
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
         }
      });

      // Calculate dynamic opening balance from previous period ledger entries
      if (isPrevPeriodValid) {
          let prevTotalDebit = 0;
          let prevTotalCredit = 0;
          prevAllEntries.forEach(e => {
              let amt = Number(e.balance) || Number(e.amount) || Number(e.sub_total) || 0;
              if (e.invoice_id) {
                 if (e.invoice_id.startsWith("INV-") && prevSalesMap.has(e.invoice_id)) {
                    const inv = prevSalesMap.get(e.invoice_id);
                    amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
                 } else if (e.invoice_id.startsWith("PUR-") && prevPurchaseMap.has(e.invoice_id)) {
                    const inv = prevPurchaseMap.get(e.invoice_id);
                    amt = Number(inv.sub_total || 0) - Number(inv.discount || 0);
                 }
              }
              if (e.source_type === 'vendor') prevTotalDebit += amt;
              if (e.source_type === 'customer') prevTotalCredit += amt;
          });
          totalOpeningBalance = prevTotalCredit - prevTotalDebit;
      } else {
          totalOpeningBalance = 0;
      }

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

      // Fetch Cashbook Report for matched accounts
      if (foundMatchedAccounts.length > 0) {
          const cashbookPromises = foundMatchedAccounts.map(acc => {
              const sd = new Date(filters.start_date);
              sd.setHours(0, 0, 0, 0);
              const ed = new Date(filters.end_date);
              ed.setHours(23, 59, 59, 999);
              
              return axios.post(`${API_URL}/cash-book-report`, {
                  start_date: sd.toISOString(),
                  end_date: ed.toISOString(),
                  view_order: "asc",
                  payment_type_id: Number(acc.payment_type_id || acc.actual_payment_type_id || acc.id)
              }, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => ({ acc_id: acc.id, data: res.data }))
              .catch(() => ({ acc_id: acc.id, data: null }))
          });

          let prevCashbookPromises = [];
          if (isPrevPeriodValid) {
              prevCashbookPromises = foundMatchedAccounts.map(acc => {
                  return axios.post(`${API_URL}/cash-book-report`, {
                      start_date: prevStart.toISOString(),
                      end_date: prevEnd.toISOString(),
                      view_order: "asc",
                      payment_type_id: Number(acc.payment_type_id || acc.actual_payment_type_id || acc.id)
                  }, { headers: { Authorization: `Bearer ${token}` } })
                  .then(res => ({ acc_id: acc.id, data: res.data }))
                  .catch(() => ({ acc_id: acc.id, data: null }))
              });
          }
          
          const [cashbookResults, prevCashbookResults] = await Promise.all([
              Promise.all(cashbookPromises),
              Promise.all(prevCashbookPromises)
          ]);
          
          foundMatchedAccounts = foundMatchedAccounts.map(acc => {
             const cb = cashbookResults.find(r => String(r.acc_id) === String(acc.id))?.data;
             const prevCb = prevCashbookResults.find(r => String(r.acc_id) === String(acc.id))?.data;
             
             let computedOpeningBalance = 0;
             if (isPrevPeriodValid && prevCb) {
                 computedOpeningBalance = Number(prevCb.closing_balance ?? 0);
             }

             return {
                 ...acc,
                 opening_balance: computedOpeningBalance,
                 total_credit: Number(cb?.current_total_credit ?? 0),
                 total_debit: Number(cb?.current_total_debit ?? 0),
                 closing_balance: computedOpeningBalance + Number(cb?.current_total_credit ?? 0) - Number(cb?.current_total_debit ?? 0),
                 balance: computedOpeningBalance + Number(cb?.current_total_credit ?? 0) - Number(cb?.current_total_debit ?? 0),
                 raw_cashbook_data: cb?.data || []
             };
          });
      }

      setMatchedAccounts(foundMatchedAccounts);


    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch ledger report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const { openingBalance, ledgerEntries } = React.useMemo(() => {
    if (!reportData) return { openingBalance: 0, ledgerEntries: [] };
    return {
      openingBalance: Number(reportData.opening_balance) || 0,
      ledgerEntries: Array.isArray(reportData.ledger) ? reportData.ledger : [],
    };
  }, [reportData]);

  const { ledgerAED, ledgerBDT } = React.useMemo(() => {
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

  const summaryTotalsAED = React.useMemo(() => calculateTotals(ledgerAED, openingBalance), [ledgerAED, openingBalance]);
  const summaryTotalsBDT = React.useMemo(() => calculateTotals(ledgerBDT, openingBalance), [ledgerBDT, openingBalance]);

  const { accountsAED, accountsBDT } = React.useMemo(() => {
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

  const grandEndingAED = React.useMemo(() => {
    let bal = summaryTotalsAED.closing_balance;
    accountsAED.forEach(acc => bal += (Number(acc.balance) || 0));
    return bal;
  }, [summaryTotalsAED.closing_balance, accountsAED]);

  const grandEndingBDT = React.useMemo(() => {
    let bal = summaryTotalsBDT.closing_balance;
    accountsBDT.forEach(acc => bal += (Number(acc.balance) || 0));
    return bal;
  }, [summaryTotalsBDT.closing_balance, accountsBDT]);



  const fetcher = async (url) => {
    // Append timestamp to completely bust browser/proxy caches
    const cacheBustedUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const res = await axios.get(cacheBustedUrl, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    const raw = res?.data;
    const rawList = raw?.data?.data ?? raw?.data ?? raw ?? [];
    
    const flattenedAccounts = [];
    rawList.forEach((item) => {
      if (Array.isArray(item.payment_type_category)) {
        item.payment_type_category.forEach((acc) => {
          flattenedAccounts.push({
            ...acc,
            parent_type_name: item.type_name,
            payment_category_name: acc.payment_category_name || acc.name || item.type_name || "Account",
            account_number: acc.account_number || acc.account_no || "",
            paymentcategory_sum_payment_amount: Number(
              acc.paymentcategory_sum_payment_amount ?? acc.balance ?? acc.amount ?? 0
            ),
          });
        });
      } else {
        flattenedAccounts.push({
          ...item,
          payment_category_name: item.payment_category_name || item.name || "Account",
          account_number: item.account_number || item.account_no || "",
          paymentcategory_sum_payment_amount: Number(
            item.paymentcategory_sum_payment_amount ?? item.balance ?? item.amount ?? 0
          ),
        });
      }
    });

    return flattenedAccounts;
  };

  const {
    data: accounts,
    isLoading,
    isValidating,
    error,
    mutate
  } = useSWR(
    token ? `${API_URL}/payment-type-list?source=fund-transfer` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const handleOptimisticTransfer = (payload) => {
    const { account_from, account_to, amount } = payload;
    const amt = Number(amount);
    
    if (accounts) {
      const nextAccounts = accounts.map((acc) => {
        if (Number(acc.id) === account_from) {
          return {
            ...acc,
            paymentcategory_sum_payment_amount: Number(acc.paymentcategory_sum_payment_amount) - amt,
          };
        }
        if (Number(acc.id) === account_to) {
          return {
            ...acc,
            paymentcategory_sum_payment_amount: Number(acc.paymentcategory_sum_payment_amount) + amt,
          };
        }
        return acc;
      });
      mutate(nextAccounts, { revalidate: true });
    } else {
      mutate();
    }
  };

  const handleOptimisticAddBalance = (payload) => {
    const { account_id, amount } = payload;
    const amt = Number(amount);
    
    if (accounts) {
      const nextAccounts = accounts.map((acc) =>
        Number(acc.id) === account_id
          ? {
              ...acc,
              paymentcategory_sum_payment_amount: Number(acc.paymentcategory_sum_payment_amount) + amt,
            }
          : acc
      );
      mutate(nextAccounts, { revalidate: true });
    } else {
      mutate();
    }
  };

  if (isLoading && !accounts) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600 mb-2 font-medium">Failed to load accounts</p>
          <button
            onClick={() => mutate()}
            className="text-red-700 hover:text-red-800 text-sm font-semibold underline flex items-center justify-center gap-1 mx-auto"
          >
            <RefreshCcw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Fund Transfer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your balances and transfer funds between accounts.
          </p>
        </div>
        {isValidating && (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <RefreshCcw className="h-4 w-4 animate-spin" /> Syncing...
          </div>
        )}
      </div>

      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
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
                  disabled={isGenerating}
                  className="w-full h-[38px] bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating && <Loader2 size={16} className="animate-spin" />}
                  Search
                </button>
              </div>
            </div>
          </div>
      </div>

      {reportData && (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <h3 className="text-sm font-medium text-slate-800 mb-2">Grand Ending Balance (BDT)</h3>
                <div className={`text-3xl font-bold ${grandEndingBDT < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                    {fmt2(grandEndingBDT)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    For {appliedFilters.selected_name || 'All'}
                </p>
            </div>
            
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h3 className="text-sm font-medium text-slate-800 mb-2">Grand Ending Balance (AED)</h3>
                <div className={`text-3xl font-bold ${grandEndingAED < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {fmt2(grandEndingAED)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    For {appliedFilters.selected_name || 'All'}
                </p>
            </div>
          </div>
      )}

      <FundHeader accounts={accounts} />

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6 space-y-8">
          <FundTransferForm accounts={accounts} onSuccess={handleOptimisticTransfer} />
          <AddBalanceForm accounts={accounts} onSuccess={handleOptimisticAddBalance} />
        </div>
      </div>
    </div>
  );
}
