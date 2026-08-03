'use client';

import React, { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import axios from "axios";
import useSWR from "swr";
import { useSession } from "next-auth/react";

import FundHeader from "@/components/finance/fund-transfer/FundHeader";
import FundTransferForm from "@/components/finance/fund-transfer/FundTransferForm";
import AddBalanceForm from "@/components/finance/fund-transfer/AddBalanceForm";

export default function FundTransferPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

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
    token ? `${API_URL}/payment-type-category-list` : null,
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
