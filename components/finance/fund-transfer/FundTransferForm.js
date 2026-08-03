'use client';

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function FundTransferForm({ accounts = [], onSuccess }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!from || !to || !amount) {
      toast.warning("Please fill all fields");
      return;
    }
    if (from === to) {
      toast.warning("From and To accounts must differ");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        account_from: Number(from),
        account_to: Number(to),
        amount: Number(amount),
      };
      
      const res = await axios.post(`${API_URL}/save-fund-transfer`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.success || res.status === 200) {
        toast.success(res.data?.message || "Transfer Successful");
        setAmount("");
        setFrom("");
        setTo("");
        
        // Let the parent handle optimistic UI updates or re-fetching
        onSuccess?.(payload);
      } else {
        toast.error(res.data?.message || "Transfer failed");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Transfer failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Fund Transfer</h2>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">From</label>
          <select
            className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/5"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">Select Account...</option>
            {accounts?.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.payment_category_name} {acc.account_number ? `— ${acc.account_number}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">To</label>
          <select
            className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/5"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            <option value="">Select Account...</option>
            {accounts?.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.payment_category_name} {acc.account_number ? `— ${acc.account_number}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-[38px] min-w-[120px]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transfer"}
        </button>
      </div>
    </form>
  );
}
