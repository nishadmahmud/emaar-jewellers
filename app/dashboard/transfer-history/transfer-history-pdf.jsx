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

// Prevent hyphenation and number wrapping issues
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#FFFFFF", padding: 16 },

  // Header (left: shop, right: meta)
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

  // Table
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

  // Column widths tuned to avoid wrapping (sum 100)
  serialCol: { width: "5%" },
  dateCol: { width: "10%" },
  particularsCol: { width: "18%" },
  payTypeCol: { width: "10%" },
  vchTypeCol: { width: "12%" },
  vchNoCol: { width: "20%" },
  debitCol: { width: "8%" },
  creditCol: { width: "8%" },
  balanceCol: { width: "9%" },

  pageNum: {
    position: "absolute",
    fontSize: 8,
    bottom: 10,
    right: 16,
    color: "#6B7280",
  },
});

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Header({ user, filters, payTypeName }) {
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
  const startDate = (filters?.start_date || "").toString().slice(0, 10);
  const endDate = (filters?.end_date || "").toString().slice(0, 10);
  const order =
    (filters?.view_order || "asc") === "asc" ? "Ascending" : "Descending";

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
          <Text style={styles.rightLine}>Report: Cash Book</Text>
          <Text style={styles.rightLine}>Currency: BDT</Text>
          <Text style={styles.rightLine}>
            Period: {startDate || "-"} to {endDate || "-"}
          </Text>
          <Text style={styles.rightLine}>
            Payment Type: {payTypeName || "All"}
          </Text>
          <Text style={styles.rightLine}>Order: {order}</Text>
          <Text style={styles.rightLine}>Generated: {genStr}</Text>
        </View>
      </View>

      <Text style={styles.title}>Cash Book Details History</Text>
    </>
  );
}

export default function TransferHistoryPDF({
  openingRow,
  rows = [],
  totals,
  filters,
  user,
  payTypeName = "All",
}) {
  const allRows = [openingRow, ...rows];

  return (
    <Document>
      {/* Portrait */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        <Header user={user} filters={filters} payTypeName={payTypeName} />

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.row}>
            <View style={[styles.th, styles.serialCol]}>
              <Text style={styles.head}>Serial No</Text>
            </View>
            <View style={[styles.th, styles.dateCol]}>
              <Text style={styles.head}>Transaction Date</Text>
            </View>
            <View style={[styles.th, styles.particularsCol]}>
              <Text style={styles.head}>Particulars</Text>
            </View>
            <View style={[styles.th, styles.payTypeCol]}>
              <Text style={styles.head}>Payment Types</Text>
            </View>
            <View style={[styles.th, styles.vchTypeCol]}>
              <Text style={styles.head}>Vch Types</Text>
            </View>
            <View style={[styles.th, styles.vchNoCol]}>
              <Text style={styles.head}>Vch Number</Text>
            </View>
            <View style={[styles.th, styles.debitCol]}>
              <Text style={[styles.head, styles.right]} wrap={false}>
                Debit (BDT)
              </Text>
            </View>
            <View style={[styles.th, styles.creditCol]}>
              <Text style={[styles.head, styles.right]} wrap={false}>
                Credit (BDT)
              </Text>
            </View>
            <View style={[styles.th, styles.balanceCol]}>
              <Text style={[styles.head, styles.right]} wrap={false}>
                Balance (BDT)
              </Text>
            </View>
          </View>

          {/* Rows */}
          {allRows.map((r, i) => (
            <View style={styles.row} key={`r-${i + 1}`}>
              <View style={[styles.td, styles.serialCol]}>
                <Text style={styles.cell}>{r.serial}</Text>
              </View>
              <View style={[styles.td, styles.dateCol]}>
                <Text style={styles.cell}>{r.date}</Text>
              </View>
              <View style={[styles.td, styles.particularsCol]}>
                <Text style={styles.cell}>{r.particulars || ""}</Text>
              </View>
              <View style={[styles.td, styles.payTypeCol]}>
                <Text style={styles.cell}>{r.paymentType || ""}</Text>
              </View>
              <View style={[styles.td, styles.vchTypeCol]}>
                <Text style={styles.cell}>{r.vchType || ""}</Text>
              </View>
              <View style={[styles.td, styles.vchNoCol]}>
                <Text style={styles.cell}>{r.vchNumber || ""}</Text>
              </View>
              <View style={[styles.td, styles.debitCol]}>
                <Text style={[styles.cell, styles.right]} wrap={false}>
                  {fmt2(r.debit)}
                </Text>
              </View>
              <View style={[styles.td, styles.creditCol]}>
                <Text style={[styles.cell, styles.right]} wrap={false}>
                  {fmt2(r.credit)}
                </Text>
              </View>
              <View style={[styles.td, styles.balanceCol]}>
                <Text style={[styles.cell, styles.right]} wrap={false}>
                  {fmt2(r.balance)}
                </Text>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.row}>
            <View style={[styles.td, styles.serialCol]} />
            <View style={[styles.td, styles.dateCol]} />
            <View style={[styles.td, styles.particularsCol]}>
              <Text style={[styles.cell, { fontWeight: "bold" }]}>Totals</Text>
            </View>
            <View style={[styles.td, styles.payTypeCol]} />
            <View style={[styles.td, styles.vchTypeCol]} />
            <View style={[styles.td, styles.vchNoCol]} />
            <View style={[styles.td, styles.debitCol]}>
              <Text
                style={[styles.cell, styles.right, { fontWeight: "bold" }]}
                wrap={false}
              >
                {fmt2(totals?.debit ?? 0)}
              </Text>
            </View>
            <View style={[styles.td, styles.creditCol]}>
              <Text
                style={[styles.cell, styles.right, { fontWeight: "bold" }]}
                wrap={false}
              >
                {fmt2(totals?.credit ?? 0)}
              </Text>
            </View>
            <View style={[styles.td, styles.balanceCol]}>
              <Text
                style={[styles.cell, styles.right, { fontWeight: "bold" }]}
                wrap={false}
              >
                {fmt2(totals?.closing ?? 0)}
              </Text>
            </View>
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
