'use client';

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import SearchableSelect from "./SearchableSelect";

export default function AddBalanceForm({ accounts = [], onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!accountId || !amount || !name) {
      toast.warning("All fields are required");
      return;
    }

    setIsLoading(true);
    try {
      const selected = accounts?.find((a) => Number(a.id) === Number(accountId));
      const payload = {
        account_id: Number(accountId),
        payment_type_id: Number(selected?.payment_type_id || 1),
        amount: Number(amount),
        name,
      };

      const res = await axios.post(`${API_URL}/save-balance`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || "Balance Added");
        setAmount("");
        setName("");
        setAccountId("");
        
        // Let parent handle optimistic update
        onSuccess?.(payload);
      } else {
        toast.error(res.data?.message || "Balance addition failed");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Balance addition failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="space-y-4 border-t border-neutral-100 pt-6 mt-6">
      <h2 className="text-lg font-semibold text-slate-800">Add Balance</h2>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Name</label>
          <input
            type="text"
            placeholder="Reference name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[16px] md:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
        
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[16px] md:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>

        <div className="flex-1 space-y-1.5 min-w-[200px]">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Select Account</label>
          <SearchableSelect
            options={accounts?.map(acc => ({
              value: acc.id,
              label: `${acc.payment_category_name}${acc.account_number ? ` — ${acc.account_number}` : ''}`
            }))}
            value={accountId}
            onChange={setAccountId}
            placeholder="Select Account..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-[38px] min-w-[120px]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Balance"}
        </button>
      </div>
    </form>
  );
}
