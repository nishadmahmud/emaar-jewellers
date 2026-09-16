import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#FFFFFF", padding: 16, paddingBottom: 32 },
  headerWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
    paddingBottom: 8,
    marginBottom: 10,
  },
  leftInfo: { width: "60%", flexDirection: "row", alignItems: "center" },
  logoWrap: {
    width: 60,
    height: 45,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 60, height: 45, objectFit: "contain" },
  leftText: { flex: 1 },
  shopName: { fontSize: 12, fontWeight: "bold", color: "#111827" },
  address: { fontSize: 8, color: "#374151", marginTop: 2 },
  contact: { fontSize: 8, color: "#4B5563", marginTop: 2 },
  rightInfo: { width: "38%", alignItems: "flex-end" },
  rightLine: { fontSize: 8, color: "#374151", lineHeight: 1.2 },
  title: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
    color: "#111827",
    marginTop: 6,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  row: { flexDirection: "row" },
  th: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#e8f5c8",
    padding: 5,
  },
  td: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  head: { fontSize: 8, fontWeight: "bold", color: "#111827" },
  cell: { fontSize: 7, color: "#111827" },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  invoiceCol: { width: "14%" },
  dateCol: { width: "12%" },
  partyCol: { width: "22%" },
  qtyCol: { width: "12%" },
  totalCol: { width: "13%" },
  paidCol: { width: "13%" },
  dueCol: { width: "14%" },
  pageNum: {
    position: "absolute",
    fontSize: 8,
    bottom: 10,
    right: 16,
    color: "#6B7280",
  },
});

const fmt4 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

function getCurrency(payMode) {
  return (payMode || "").includes("(AED @") ? "AED" : "BDT";
}

function mapInvoice(inv) {
  const currency = getCurrency(inv.pay_mode);
  const total = (inv.sub_total || 0) - (inv.discount || 0);
  const paid = inv.paid_amount || 0;
  const due = Math.max(total - paid, 0);
  const qty = Array.isArray(inv.sales_details)
    ? inv.sales_details.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    : 0;
  const customer = inv.customer_name || "Walk-in Customer";
  const phone = inv.customer_phone ? ` (${inv.customer_phone})` : "";

  return {
    invoiceId: inv.invoice_id || "",
    date: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "",
    party: `${customer}${phone}`,
    qty,
    total,
    paid,
    due,
    currency,
  };
}

function Header({ user, filters }) {
  const u = user || {};
  const inv = u?.invoice_settings || {};
  const shopName =
    inv?.shop_name || u?.outlet_name || u?.owner_name || "Outlet / Company";
  const logo = inv?.shop_logo || u?.logo;
  const address = inv?.shop_address || u?.address || "";
  const phone = inv?.mobile_number || u?.phone || u?.contact_number || "";
  const email = inv?.email || u?.email || "";
  const web = inv?.web_address || u?.web_address || "";

  const gen = new Date();
  const genStr = `${gen.toISOString().slice(0, 10)} ${gen
    .toTimeString()
    .slice(0, 8)}`;
  const startDate = (filters?.startDate || "").toString().slice(0, 10);
  const endDate = (filters?.endDate || "").toString().slice(0, 10);
  const search = filters?.search || "";

  return (
    <>
      <View style={styles.headerWrap}>
        <View style={styles.leftInfo}>
          <View style={styles.logoWrap}>
            {logo ? (
              <Image src={logo} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 9, color: "#6B7280" }}>No Logo</Text>
            )}
          </View>
          <View style={styles.leftText}>
            <Text style={styles.shopName}>{shopName}</Text>
            {!!address && <Text style={styles.address}>{address}</Text>}
            <Text style={styles.contact}>
              {phone ? `Phone: ${phone}` : ""}{" "}
              {email ? `| Email: ${email}` : ""} {web ? `| Web: ${web}` : ""}
            </Text>
          </View>
        </View>
        <View style={styles.rightInfo}>
          <Text style={styles.rightLine}>Report: Sales History</Text>
          <Text style={styles.rightLine}>
            Period: {startDate || "-"} to {endDate || "-"}
          </Text>
          {!!search && (
            <Text style={styles.rightLine}>Search: {search}</Text>
          )}
          <Text style={styles.rightLine}>Generated: {genStr}</Text>
        </View>
      </View>
      <Text style={styles.title}>Sales History</Text>
    </>
  );
}

export default function SalesHistoryPDF({
  invoices = [],
  filters,
  user,
}) {
  const rows = invoices.map(mapInvoice);
  const totalQty = rows.reduce((sum, r) => sum + r.qty, 0);
  const totalAmount = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header user={user} filters={filters} />

        <View style={styles.table}>
          <View style={styles.row} wrap={false}>
            <View style={[styles.th, styles.invoiceCol]}>
              <Text style={styles.head}>Invoice ID</Text>
            </View>
            <View style={[styles.th, styles.dateCol]}>
              <Text style={styles.head}>Date</Text>
            </View>
            <View style={[styles.th, styles.partyCol]}>
              <Text style={styles.head}>Customer</Text>
            </View>
            <View style={[styles.th, styles.qtyCol]}>
              <Text style={[styles.head, styles.center]}>Qty</Text>
            </View>
            <View style={[styles.th, styles.totalCol]}>
              <Text style={[styles.head, styles.right]}>Total</Text>
            </View>
            <View style={[styles.th, styles.paidCol]}>
              <Text style={[styles.head, styles.right]}>Paid</Text>
            </View>
            <View style={[styles.th, styles.dueCol]}>
              <Text style={[styles.head, styles.right]}>Due</Text>
            </View>
          </View>

          {rows.map((r, i) => (
            <View style={styles.row} key={`r-${i}`} wrap={false}>
              <View style={[styles.td, styles.invoiceCol]}>
                <Text style={styles.cell}>{r.invoiceId}</Text>
              </View>
              <View style={[styles.td, styles.dateCol]}>
                <Text style={styles.cell}>{r.date}</Text>
              </View>
              <View style={[styles.td, styles.partyCol]}>
                <Text style={styles.cell}>{r.party}</Text>
              </View>
              <View style={[styles.td, styles.qtyCol]}>
                <Text style={[styles.cell, styles.center]} wrap={false}>
                  {fmt4(r.qty)}
                </Text>
              </View>
              <View style={[styles.td, styles.totalCol]}>
                <Text style={[styles.cell, styles.right]} wrap={false}>
                  {r.currency} {fmt4(r.total)}
                </Text>
              </View>
              <View style={[styles.td, styles.paidCol]}>
                <Text style={[styles.cell, styles.right]} wrap={false}>
                  {r.currency} {fmt4(r.paid)}
                </Text>
              </View>
              <View style={[styles.td, styles.dueCol]}>
                <Text style={[styles.cell, styles.right]} wrap={false}>
                  {r.currency} {fmt4(r.due)}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.row} wrap={false}>
            <View style={[styles.td, styles.invoiceCol]} />
            <View style={[styles.td, styles.dateCol]} />
            <View style={[styles.td, styles.partyCol]}>
              <Text style={[styles.cell, { fontWeight: "bold" }]}>Totals</Text>
            </View>
            <View style={[styles.td, styles.qtyCol]}>
              <Text
                style={[styles.cell, styles.center, { fontWeight: "bold" }]}
                wrap={false}
              >
                {fmt4(totalQty)}
              </Text>
            </View>
            <View style={[styles.td, styles.totalCol]}>
              <Text
                style={[styles.cell, styles.right, { fontWeight: "bold" }]}
                wrap={false}
              >
                {fmt4(totalAmount)}
              </Text>
            </View>
            <View style={[styles.td, styles.paidCol]} />
            <View style={[styles.td, styles.dueCol]} />
          </View>
        </View>

        <Text
          style={styles.pageNum}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
