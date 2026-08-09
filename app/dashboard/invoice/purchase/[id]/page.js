'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`p-6 ${className || ''}`}>{children}</div>;
import { Receipt, Download, ArrowLeft, Loader2, Printer } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PurchaseInvoicePdf from '@/components/invoice/PurchaseInvoicePdf';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API;

export default function PurchaseInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    const fetchInvoice = async () => {
      try {
        const res = await axios.post(`${API_URL}/purchase-invoice-details`, { invoice_id: id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setInvoice(res.data);
        } else {
          toast.error('Failed to load invoice');
        }
      } catch (err) {
        toast.error('Error fetching invoice details');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchInvoice();
    }
  }, [id, session?.accessToken]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-neutral-500">Invoice not found.</p>
        <button onClick={() => router.back()} className="text-sm font-medium hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const invoiceData = invoice.data || {};
  const purchaseDetails = invoiceData.purchase_details || invoiceData.sales_details || [];
  
  const payModeString = invoiceData.pay_mode || '';
  const isAed = payModeString.includes('(AED @');
  const aedRateMatch = payModeString.match(/\(AED @ ([\d.]+)\)/);
  const invoiceAedRate = isAed && aedRateMatch ? parseFloat(aedRateMatch[1]) : 1;
  const displayCurrency = isAed ? 'AED' : 'BDT';
  
  const subTotalBdt = Number(invoiceData.sub_total || 0);
  const discountBdt = Number(invoiceData.discount || 0);
  const finalTotalBdt = subTotalBdt - discountBdt;
  const paidBdt = Number(invoiceData.paid_amount || 0);
  const dueBdt = Math.max(finalTotalBdt - paidBdt, 0);
  
  const subTotalDisplay = subTotalBdt;
  const discountDisplay = discountBdt;
  const finalTotalDisplay = finalTotalBdt;
  const paidDisplay = paidBdt;
  const dueDisplay = dueBdt;
  
  const multiplePayments = invoiceData.multiple_payments || invoiceData.multiple_payment || [];

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; }
          body { 
            -webkit-print-color-adjust: exact; 
            padding: 2cm !important; 
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Header Actions */}
        <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-black rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
          >
            <Printer size={16} />
            Print
          </button>
          <PDFDownloadLink
            document={<PurchaseInvoicePdf invoice={invoice} />}
            fileName={`Purchase-Invoice-${id}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            {({ loading }) => (
              <>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {loading ? 'Generating...' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Invoice Web View */}
      <Card className="overflow-hidden border-neutral-200 shadow-sm print:shadow-none print:border-none">
        <CardContent className="p-0">
          <div className="p-8 sm:p-12 bg-white text-neutral-900">
            {/* Store Info & Invoice Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-100 pb-8 mb-8 gap-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-black mb-1">EMAAR JEWELLERS</h1>
                <p className="text-sm text-neutral-500 max-w-[250px]">
                  Baitul Mukarram National Mosque Market, Dhaka, Bangladesh
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="inline-flex items-center justify-center p-2 bg-neutral-50 rounded-lg mb-3">
                  <Receipt size={24} className="text-neutral-700" />
                </div>
                <h2 className="text-lg font-semibold">PURCHASE INVOICE</h2>
                <p className="text-sm text-neutral-500 font-mono mt-1">{invoiceData.invoice_id || id}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {invoiceData.created_at ? new Date(invoiceData.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="mb-10">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Vendor / Supplier</h3>
              <p className="font-medium text-black">{invoiceData.vendor_name || 'Walk-in Vendor'}</p>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">Item Description</th>
                    <th className="px-4 py-3 font-medium text-center">WT (VORI)</th>
                    <th className="px-4 py-3 font-medium text-center">WT (GRAM)</th>
                    <th className="px-4 py-3 font-medium text-right">Rate</th>
                    <th className="px-4 py-3 font-medium text-right rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {purchaseDetails.map((item, index) => {
                    const itemName = item.product_info?.name || 'Unnamed Item';
                    const itemQty = Number(item.qty || 1);
                    const itemTotalBdt = Number(item.price || 0); // item.price is the total BDT for this line
                    const itemRateBdt = itemQty > 0 ? itemTotalBdt / itemQty : 0;
                    const itemRateDisplay = isAed ? itemRateBdt / invoiceAedRate : itemRateBdt;
                    const itemTotalDisplay = isAed ? itemTotalBdt / invoiceAedRate : itemTotalBdt;
                    
                    return (
                      <tr key={item.id || index} className="group">
                        <td className="px-4 py-4">
                          <p className="font-medium text-neutral-900">{itemName}</p>
                          {item.product_info?.sku && (
                            <p className="text-xs text-neutral-400 mt-0.5">SKU: {item.product_info.sku}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center text-neutral-600">{item.qty || 1}</td>
                        <td className="px-4 py-4 text-center text-neutral-600">{(itemQty * 11.664).toFixed(3)}</td>
                        <td className="px-4 py-4 text-right text-neutral-600">{displayCurrency} {itemRateDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="px-4 py-4 text-right font-medium text-neutral-900">
                          {displayCurrency} {itemTotalDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-[350px] space-y-3 bg-neutral-50 p-6 rounded-xl">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Subtotal</span>
                  <span>{displayCurrency} {subTotalDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                {discountDisplay > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Discount</span>
                    <span>- {displayCurrency} {discountDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-neutral-200 flex justify-between font-semibold text-base text-black">
                  <span>Total Amount</span>
                  <span>{displayCurrency} {finalTotalDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 pt-1 font-semibold">
                  <span>Paid Amount</span>
                  <span>{displayCurrency} {paidDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Individual Payment Methods Breakdown */}
                {multiplePayments && multiplePayments.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200 mt-2 space-y-1.5 text-xs text-neutral-600">
                    <div className="font-semibold text-neutral-500 uppercase tracking-wider mb-1 text-[10px]">Payment Breakdown</div>
                    {multiplePayments.map((pm, idx) => {
                      const typeName = pm.payment_type?.type_name || 'Payment';
                      const categoryMatch = pm.payment_type?.payment_type_category?.find(
                        (c) => Number(c.id) === Number(pm.payment_type_category_id)
                      );
                      const accName = categoryMatch?.payment_category_name || '';
                      const accNum = categoryMatch?.account_number || '';
                      const detailLabel = [accName, accNum].filter(Boolean).join(' - ');
                      
                      const pmAmountBdt = Number(pm.payment_amount || 0);
                      const pmAmountDisplay = pmAmountBdt;

                      return (
                        <div key={pm.id || idx} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-neutral-200/80 shadow-2xs">
                          <div className="font-medium text-neutral-800">
                            <span>{typeName}</span>
                            {detailLabel && detailLabel.toLowerCase() !== typeName.toLowerCase() && (
                              <span className="text-neutral-500 text-[11px] ml-1">({detailLabel})</span>
                            )}
                          </div>
                          <div className="font-semibold text-emerald-700">
                            {displayCurrency} {pmAmountDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {dueDisplay > 0 && (
                  <div className="flex justify-between text-sm font-medium text-red-600 pt-1">
                    <span>Due Amount</span>
                    <span>{displayCurrency} {dueDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-16 pt-8 border-t border-neutral-100 text-center text-xs text-neutral-400">
              <p>Emaar Jewellers - Purchase Receipt</p>
              <p className="mt-1">This is a system generated document.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
