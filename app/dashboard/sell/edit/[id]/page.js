"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import SellPage from "@/app/dashboard/sell/page";
import axios from 'axios';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function EditSellPage() {
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token || !id) return;

    const fetchInvoice = async () => {
      try {
        const { data } = await axios.post(`${API_URL}/invoice-details`, { invoice_id: id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.data) {
          setInvoiceData(data.data);
        } else {
          toast.error("Invoice not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, session?.accessToken]);

  if (loading) return <div className="p-6 text-center text-neutral-500">Loading invoice...</div>;
  if (!invoiceData)
    return (
      <div className="p-6 text-center text-red-500">Invoice not found</div>
    );

  return (
    <SellPage
      editMode={true}
      initialInvoice={invoiceData}
      key={id}
    />
  );
}
