'use client';

import React, { useState, useEffect } from "react";
import { Search, Plus, Eye, Edit3, Trash2, CreditCard } from "lucide-react";
import axios from "axios";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Image from "next/image";

import CreatePaymentModal from "@/components/settings/payments/CreatePaymentModal";
import EditPaymentModal from "@/components/settings/payments/EditPaymentModal";
import ViewPaymentModal from "@/components/settings/payments/ViewPaymentModal";
import DeletePaymentModal from "@/components/settings/payments/DeletePaymentModal";

export default function PaymentsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState(null);
  const [viewingMethodId, setViewingMethodId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState([]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetcher = async (url) => {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const { data: listRes, isLoading, mutate } = useSWR(
    token ? `${API_URL}/payment-type-list` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const paymentMethods = Array.isArray(listRes?.data?.data)
    ? listRes.data.data
    : Array.isArray(listRes?.data)
    ? listRes.data
    : Array.isArray(listRes)
    ? listRes
    : [];

  const filteredMethods = paymentMethods.filter((item) => {
    if (optimisticDeletedIds.includes(item.id)) return false;
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase();
    const name = item.type_name || "";
    return name.toLowerCase().includes(q);
  });

  const getNormalizedStatus = (status) => {
    if (status === 1 || status === "1" || status === "active" || !status) return "active";
    if (status === 0 || status === "0" || status === "inactive") return "inactive";
    return "active";
  };

  const getStatusColor = (status) => {
    const norm = getNormalizedStatus(status);
    if (norm === "active") return "bg-green-100 text-green-700";
    if (norm === "inactive") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6 text-black p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Payment Methods
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your payment gateways, banks, and transaction options.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-black text-white shadow hover:bg-neutral-800 h-9 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Method
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 bg-white flex flex-col justify-center">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">
              Total Methods
            </h3>
            <CreditCard className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {paymentMethods.length}
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 bg-white flex flex-col justify-center">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500">
              Active Methods
            </h3>
            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {paymentMethods.filter((m) => getNormalizedStatus(m.status) === "active").length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-xl border bg-card text-card-foreground shadow bg-white">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold leading-none tracking-tight text-lg text-slate-900">
                Configured Methods
              </h3>
              <p className="text-sm text-muted-foreground mt-1 text-slate-500">
                View and manage your active payment gateways.
              </p>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                placeholder="Search payment methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : filteredMethods.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No payment methods found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:gap-4 p-4 md:p-6">
              {filteredMethods.map((method) => (
                <div
                  key={method.id}
                  className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white p-4 hover:shadow-md transition-shadow group relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden bg-slate-100 border border-slate-200">
                        {method.icon_image ? (
                          <Image
                            src={method.icon_image.startsWith('http') ? method.icon_image : `${process.env.NEXT_PUBLIC_BASE_URL || API_URL?.replace('/api', '')}/${method.icon_image}`}
                            alt={method.type_name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-lg font-bold text-slate-500">
                            {method.icon_letter || method.type_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 text-lg">
                            {method.type_name}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getStatusColor(
                              method.status
                            )}`}
                          >
                            {getNormalizedStatus(method.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-500">
                            {method.payment_type_category?.length || 0} Accounts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 max-md:grid-cols-1 sm:grid-cols-3 gap-2 w-full shrink-0">
                    <button
                      onClick={() => setViewingMethodId(method.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 h-9 px-3 w-full"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => setEditingMethodId(method.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-green-50 hover:border-green-200 hover:text-green-700 h-9 px-3 w-full"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(method.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-700 h-9 px-3 w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => mutate()}
      />
      
      {editingMethodId && (
        <EditPaymentModal
          isOpen={!!editingMethodId}
          onClose={() => setEditingMethodId(null)}
          method={paymentMethods.find((m) => m.id === editingMethodId)}
          onSuccess={() => mutate()}
        />
      )}

      {viewingMethodId && (
        <ViewPaymentModal
          isOpen={!!viewingMethodId}
          onClose={() => setViewingMethodId(null)}
          method={paymentMethods.find((m) => m.id === viewingMethodId)}
          onSuccess={() => mutate()}
        />
      )}

      {deletingId && (
        <DeletePaymentModal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          id={deletingId}
          onSuccess={() => {
            setOptimisticDeletedIds((prev) => [...prev, deletingId]);
            mutate();
          }}
        />
      )}
    </div>
  );
}
