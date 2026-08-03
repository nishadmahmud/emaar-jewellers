'use client';

import React from "react";
import { Wallet, Banknote, CreditCard, PiggyBank } from "lucide-react";

export default function FundHeader({ accounts }) {
  if (!accounts?.length) return null;

  const getIconOrLetter = (acc, isNegative) => {
    if (acc.icon_letter && acc.icon_letter.startsWith("icon:")) {
      const iconName = acc.icon_letter.replace("icon:", "").toLowerCase();
      switch (iconName) {
        case "wallet":
          return <Wallet className="h-5 w-5" />;
        case "cash":
          return <Banknote className="h-5 w-5" />;
        case "card":
          return <CreditCard className="h-5 w-5" />;
        default:
          return <PiggyBank className="h-5 w-5" />;
      }
    }

    const firstLetter = acc.payment_category_name?.charAt(0)?.toUpperCase() || "?";
    return (
      <span
        className={`text-sm font-semibold ${
          isNegative ? "text-red-600" : "text-emerald-700"
        }`}
      >
        {firstLetter}
      </span>
    );
  };

  return (
    <>
      <h2 className="text-lg font-semibold text-slate-800 mb-3">
        Accounts Summary
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accounts.map((acc) => {
          const amount = Number(acc.paymentcategory_sum_payment_amount || 0);
          const isNegative = amount < 0;

          return (
            <div
              key={acc.id}
              className={`rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
                isNegative
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-100 bg-emerald-50"
              }`}
            >
              <div className="flex flex-row items-center justify-between pb-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-800">
                    {acc.payment_category_name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {acc.account_number}
                  </p>
                </div>

                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm
                  ${
                    isNegative
                      ? "bg-red-100 shadow-red-50"
                      : "bg-emerald-100 shadow-emerald-50"
                  }`}
                >
                  {getIconOrLetter(acc, isNegative)}
                </div>
              </div>

              <div className="pt-2">
                <div
                  className={`text-xl font-bold ${
                    isNegative ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {amount.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Balance</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
