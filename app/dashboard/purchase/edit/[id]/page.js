"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PurchasePage from "@/app/dashboard/purchase/page";
import axios from 'axios';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function EditPurchasePage() {
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token || !id) return;

    const fetchInvoice = async () => {
      try {
        const { data } = await axios.post(`${API_URL}/purchase-invoice-details`, { invoice_id: id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.data) {
          setInvoiceData(data.data);
        } else {
          toast.error("Purchase invoice not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load purchase details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, session?.accessToken]);

  if (loading) return <div className="p-6 text-center text-neutral-500">Loading purchase details...</div>;
  if (!invoiceData)
    return (
      <div className="p-6 text-center text-red-500">Purchase invoice not found</div>
    );

  return (
    <PurchasePage
      editMode={true}
      initialInvoice={invoiceData}
      key={id}
    />
  );
}
