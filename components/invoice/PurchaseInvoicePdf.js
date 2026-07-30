import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 10,
    color: '#6B7280',
    width: '60%',
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  invoiceMeta: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  billToTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerDetails: {
    fontSize: 10,
    color: '#4B5563',
  },
  table: {
    width: '100%',
    marginTop: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    padding: 8,
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  headerText: {
    color: '#4B5563',
    fontWeight: 'bold',
  },
  summaryContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  summaryBox: {
    width: '40%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryText: {
    color: '#4B5563',
  },
  summaryTotalText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  }
});

const PurchaseInvoicePdf = ({ invoice }) => {
  const data = invoice?.data || invoice || {};
  const purchaseDetails = data.purchase_details || data.sales_details || []; // Handling both in case backend varies
  
  const subTotal = Number(data.sub_total || 0);
  const discount = Number(data.discount || 0);
  const finalTotal = subTotal - discount;
  const paid = Number(data.paid_amount || 0);
  const due = Math.max(finalTotal - paid, 0);
  const multiplePayments = data.multiple_payments || data.multiple_payment || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>EMAAR JEWELLERS</Text>
            <Text style={styles.companyAddress}>
              Baitul Mukarram National Mosque Market, Dhaka, Bangladesh
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>PURCHASE INVOICE</Text>
            <Text style={styles.invoiceMeta}>{data.invoice_id || 'N/A'}</Text>
            <Text style={styles.invoiceMeta}>
              {data.created_at ? new Date(data.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.billToTitle}>Vendor / Supplier</Text>
          <Text style={styles.customerName}>{data.vendor_name || 'Walk-in Vendor'}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.headerText]}>Item Description</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colRate, styles.headerText]}>Rate (TK)</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total (TK)</Text>
          </View>
          
          {purchaseDetails.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.product_info?.name || 'Item'}</Text>
              <Text style={styles.colQty}>{item.qty || 1}</Text>
              <Text style={styles.colRate}>{Number(item.price || 0).toLocaleString()}</Text>
              <Text style={styles.colTotal}>{(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Subtotal</Text>
              <Text style={styles.summaryText}>{subTotal.toLocaleString()}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Discount</Text>
                <Text style={styles.summaryText}>- {discount.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalText}>Total Amount</Text>
              <Text style={styles.summaryTotalText}>{finalTotal.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Text style={[styles.summaryText, { fontWeight: 'bold' }]}>Paid Amount</Text>
              <Text style={[styles.summaryText, { fontWeight: 'bold' }]}>{paid.toLocaleString()}</Text>
            </View>
            {multiplePayments.length > 0 && (
              <View style={{ marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 7, color: '#6B7280', fontWeight: 'bold', marginBottom: 3, textTransform: 'uppercase' }}>Payment Breakdown</Text>
                {multiplePayments.map((pm, idx) => {
                  const typeName = pm.payment_type?.type_name || 'Payment';
                  const categoryMatch = pm.payment_type?.payment_type_category?.find(
                    (c) => Number(c.id) === Number(pm.payment_type_category_id)
                  );
                  const accName = categoryMatch?.payment_category_name || '';
                  const accNum = categoryMatch?.account_number || '';
                  const detailLabel = [accName, accNum].filter(Boolean).join(' - ');

                  return (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ fontSize: 8, color: '#374151', width: '60%' }}>
                        {typeName} {detailLabel && detailLabel.toLowerCase() !== typeName.toLowerCase() ? `(${detailLabel})` : ''}
                      </Text>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#059669', width: '40%', textAlign: 'right' }}>
                        TK {Number(pm.payment_amount || 0).toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            {due > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Due Amount</Text>
                <Text style={styles.summaryText}>{due.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Emaar Jewellers - Purchase Receipt</Text>
          <Text style={{ marginTop: 4 }}>This is a system generated document.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PurchaseInvoicePdf;
