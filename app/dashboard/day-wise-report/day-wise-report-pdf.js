/* eslint-disable react/react-in-jsx-scope */
"use client"

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const S = StyleSheet.create({
  page: { padding: 12, fontSize: 7.5, fontFamily: "Helvetica", flexDirection: "column", backgroundColor: "#fff" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#1a1a1a", paddingBottom: 8, marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a1a" },
  headerSub: { fontSize: 7, color: "#666", marginTop: 2 },
  headerDate: { fontSize: 11, fontWeight: "bold", color: "#1a1a1a" },
  headerDateLabel: { fontSize: 7, color: "#666", textAlign: "right" },
  logoImg: { width: 50, height: 50, objectFit: "contain" },

  // Section label (colored bar like the image)
  sectionBar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },

  // The 4-column top row
  topRow: { flexDirection: "row", gap: 4, marginBottom: 8 },
  col: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 3 },
  colHeader: { padding: 4, fontWeight: "bold", fontSize: 7.5, color: "#fff", textAlign: "center" },

  // Table
  tableHead: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottomWidth: 1, borderBottomColor: "#ccc" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  cellName: { flex: 2, padding: "2 3", fontSize: 6.5 },
  cellNameSub: { fontSize: 5.5, color: "#888", marginTop: 1 },
  cellAmt: { flex: 1, padding: "2 3", textAlign: "right", fontSize: 6.5, fontWeight: "bold" },
  cellRate: { width: 28, padding: "2 3", textAlign: "right", fontSize: 6, color: "#888" },
  totalRow: { flexDirection: "row", backgroundColor: "#f9f9f9", borderTopWidth: 1, borderTopColor: "#bbb", padding: "3 4" },
  totalLabel: { flex: 2, fontSize: 7, fontWeight: "bold" },
  totalAmt: { flex: 1, fontSize: 7, fontWeight: "bold", textAlign: "right" },

  // Bottom row
  bottomRow: { flexDirection: "row", gap: 4 },

  // P&L row items
  plRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee", padding: "2.5 4" },
  plLabel: { flex: 1, fontSize: 6.5, color: "#444" },
  plVal: { fontSize: 6.5, fontWeight: "bold", textAlign: "right" },

  // Footer
  footer: { marginTop: 8, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: "#ccc", fontSize: 6, color: "#aaa", textAlign: "center" },
})

const COLORS = {
  salesBdt: "#1a7a4a",
  salesAed: "#1a6b6b",
  purchBdt: "#9b1c1c",
  purchAed: "#b45309",
  txIn: "#1e40af",
  txOut: "#6b21a8",
  pl: "#374151",
  balance: "#1e293b",
}

function ColHeader({ label, color }) {
  return <Text style={[S.colHeader, { backgroundColor: color }]}>{label}</Text>
}

function TableHead({ hasRate }) {
  return (
    <View style={S.tableHead}>
      <Text style={[S.cellName, { fontSize: 6, color: "#666", fontWeight: "bold" }]}>Invoice / Party</Text>
      <Text style={[S.cellAmt, { fontSize: 6, color: "#666", fontWeight: "bold" }]}>Amount</Text>
      {hasRate && <Text style={[S.cellRate, { fontSize: 6, color: "#666", fontWeight: "bold" }]}>Rate</Text>}
    </View>
  )
}

export default function DayWiseReportPDF({
  logoUrl, user, date,
  salesBdt = [], salesAed = [],
  purchasesBdt = [], purchasesAed = [],
  txIn = [], txOut = [],
  profitLoss = {}, balanceSheet = {}
}) {
  const displayDate = date ? date.slice(0, 10).split('-').reverse().join('/') : ""
  const logo = logoUrl || null

  const totalSalesBdt = salesBdt.reduce((s, i) => s + i.amountBdt, 0)
  const totalSalesAed = salesAed.reduce((s, i) => s + i.amountAed, 0)
  const totalPurchBdt = purchasesBdt.reduce((s, i) => s + i.amountBdt, 0)
  const totalPurchAed = purchasesAed.reduce((s, i) => s + i.amountAed, 0)
  const totalTxIn = txIn.reduce((s, t) => s + t.amount, 0)
  const totalTxOut = txOut.reduce((s, t) => s + t.amount, 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>DAILY STATEMENT</Text>
            <Text style={S.headerSub}>{user?.outlet_name || "EMAAR TRADING"}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            {logo
              ? <Image src={logo} style={S.logoImg} />
              : <Text style={{ fontSize: 14, fontWeight: "bold", color: "#333" }}>EMAAR TRADING</Text>
            }
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.headerDateLabel}>DATE</Text>
            <Text style={S.headerDate}>{displayDate}</Text>
            {user?.address && <Text style={{ fontSize: 6, color: "#666", marginTop: 2 }}>{user.address}</Text>}
          </View>
        </View>

        {/* TOP ROW: 4 columns */}
        <View style={S.topRow}>

          {/* Sales BDT */}
          <View style={S.col}>
            <ColHeader label="Received BDT (Sales)" color={COLORS.salesBdt} />
            <TableHead hasRate={false} />
            {salesBdt.length === 0 && <Text style={{ padding: 4, fontSize: 6, color: "#aaa", textAlign: "center" }}>No BDT sales</Text>}
            {salesBdt.map((s, i) => (
              <View key={i} style={S.tableRow}>
                <View style={S.cellName}>
                  <Text>{s.invoice_id}</Text>
                  <Text style={S.cellNameSub}>{s.customer_name}</Text>
                </View>
                <Text style={S.cellAmt}>{fmt2(s.amountBdt)}</Text>
              </View>
            ))}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL RECEIVED</Text>
              <Text style={[S.totalAmt, { color: COLORS.salesBdt }]}>{fmt2(totalSalesBdt)}</Text>
            </View>
          </View>

          {/* Sales AED */}
          <View style={S.col}>
            <ColHeader label="Received AED (Sales)" color={COLORS.salesAed} />
            <TableHead hasRate={true} />
            {salesAed.length === 0 && <Text style={{ padding: 4, fontSize: 6, color: "#aaa", textAlign: "center" }}>No AED sales</Text>}
            {salesAed.map((s, i) => (
              <View key={i} style={S.tableRow}>
                <View style={S.cellName}>
                  <Text>{s.invoice_id}</Text>
                  <Text style={S.cellNameSub}>{s.customer_name}</Text>
                </View>
                <Text style={S.cellAmt}>{fmt2(s.amountAed)}</Text>
                <Text style={S.cellRate}>{s.aedRate}</Text>
              </View>
            ))}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL RECEIVED</Text>
              <Text style={[S.totalAmt, { color: COLORS.salesAed }]}>AED {fmt2(totalSalesAed)}</Text>
            </View>
          </View>

          {/* Purchases BDT */}
          <View style={S.col}>
            <ColHeader label="Payment BDT (Purchases)" color={COLORS.purchBdt} />
            <TableHead hasRate={false} />
            {purchasesBdt.length === 0 && <Text style={{ padding: 4, fontSize: 6, color: "#aaa", textAlign: "center" }}>No BDT purchases</Text>}
            {purchasesBdt.map((p, i) => (
              <View key={i} style={S.tableRow}>
                <View style={S.cellName}>
                  <Text>{p.invoice_id}</Text>
                  <Text style={S.cellNameSub}>{p.vendor_name}</Text>
                </View>
                <Text style={S.cellAmt}>{fmt2(p.amountBdt)}</Text>
              </View>
            ))}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL PAYMENT</Text>
              <Text style={[S.totalAmt, { color: COLORS.purchBdt }]}>{fmt2(totalPurchBdt)}</Text>
            </View>
          </View>

          {/* Purchases AED */}
          <View style={S.col}>
            <ColHeader label="Payment AED (Purchases)" color={COLORS.purchAed} />
            <TableHead hasRate={true} />
            {purchasesAed.length === 0 && <Text style={{ padding: 4, fontSize: 6, color: "#aaa", textAlign: "center" }}>No AED purchases</Text>}
            {purchasesAed.map((p, i) => (
              <View key={i} style={S.tableRow}>
                <View style={S.cellName}>
                  <Text>{p.invoice_id}</Text>
                  <Text style={S.cellNameSub}>{p.vendor_name}</Text>
                </View>
                <Text style={S.cellAmt}>{fmt2(p.amountAed)}</Text>
                <Text style={S.cellRate}>{p.aedRate}</Text>
              </View>
            ))}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL PAYMENT</Text>
              <Text style={[S.totalAmt, { color: COLORS.purchAed }]}>AED {fmt2(totalPurchAed)}</Text>
            </View>
          </View>

        </View>

        {/* BOTTOM ROW: Tx In | Tx Out | P&L | Balance Sheet */}
        <View style={S.bottomRow}>

          {/* Transactions In */}
          <View style={S.col}>
            <ColHeader label="Transactions — Money In" color={COLORS.txIn} />
            {txIn.length === 0 && <Text style={{ padding: 4, fontSize: 6, color: "#aaa", textAlign: "center" }}>No inflow</Text>}
            {txIn.map((t, i) => (
              <View key={i} style={S.tableRow}>
                <Text style={[S.cellName, { flex: 2 }]}>{t.type_name}</Text>
                <Text style={[S.cellAmt, { color: "green" }]}>+{fmt2(t.amount)}</Text>
              </View>
            ))}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL IN</Text>
              <Text style={[S.totalAmt, { color: COLORS.txIn }]}>{fmt2(totalTxIn)}</Text>
            </View>
          </View>

          {/* Transactions Out */}
          <View style={S.col}>
            <ColHeader label="Transactions — Money Out" color={COLORS.txOut} />
            {txOut.length === 0 && <Text style={{ padding: 4, fontSize: 6, color: "#aaa", textAlign: "center" }}>No outflow</Text>}
            {txOut.map((t, i) => (
              <View key={i} style={S.tableRow}>
                <Text style={[S.cellName, { flex: 2 }]}>{t.type_name}</Text>
                <Text style={[S.cellAmt, { color: "red" }]}>-{fmt2(t.amount)}</Text>
              </View>
            ))}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL OUT</Text>
              <Text style={[S.totalAmt, { color: COLORS.txOut }]}>{fmt2(totalTxOut)}</Text>
            </View>
          </View>

          {/* Profit & Loss */}
          <View style={S.col}>
            <ColHeader label="Profit &amp; Loss Summary" color={COLORS.pl} />
            <View style={S.plRow}><Text style={S.plLabel}>Sales (BDT only)</Text><Text style={S.plVal}>{fmt2(salesBdt.reduce((s, i) => s + i.amountBdt, 0))}</Text></View>
            <View style={S.plRow}><Text style={S.plLabel}>Sales (AED → BDT)</Text><Text style={S.plVal}>{fmt2(salesAed.reduce((s, i) => s + i.amountBdt, 0))}</Text></View>
            <View style={[S.plRow, { backgroundColor: "#f0fdf4" }]}><Text style={[S.plLabel, { fontWeight: "bold" }]}>Total Sales (BDT)</Text><Text style={[S.plVal, { color: "green" }]}>{fmt2(profitLoss.totalSalesBdt ?? 0)}</Text></View>
            <View style={S.plRow}><Text style={S.plLabel}>Purchase (BDT only)</Text><Text style={S.plVal}>{fmt2(purchasesBdt.reduce((s, i) => s + i.amountBdt, 0))}</Text></View>
            <View style={S.plRow}><Text style={S.plLabel}>Purchase (AED → BDT)</Text><Text style={S.plVal}>{fmt2(purchasesAed.reduce((s, i) => s + i.amountBdt, 0))}</Text></View>
            <View style={[S.plRow, { backgroundColor: "#fff1f2" }]}><Text style={[S.plLabel, { fontWeight: "bold" }]}>Total Purchase (BDT)</Text><Text style={[S.plVal, { color: "red" }]}>{fmt2(profitLoss.totalPurchaseBdt ?? 0)}</Text></View>
            <View style={S.totalRow}><Text style={S.totalLabel}>NET PROFIT</Text><Text style={[S.totalAmt, { color: (profitLoss.netProfit ?? 0) >= 0 ? "green" : "red" }]}>{fmt2(profitLoss.netProfit ?? 0)}</Text></View>
          </View>

          {/* Balance Sheet */}
          <View style={S.col}>
            <ColHeader label="Balance Sheet" color={COLORS.balance} />
            <View style={S.plRow}><Text style={S.plLabel}>Party Balances (BDT)</Text><Text style={S.plVal}>{fmt2(balanceSheet.sumBDT ?? 0)}</Text></View>
            <View style={S.plRow}><Text style={S.plLabel}>Party Balances (AED)</Text><Text style={S.plVal}>AED {fmt2(balanceSheet.sumAED ?? 0)}</Text></View>
            <View style={S.plRow}><Text style={S.plLabel}>AED→BDT (Rate:{balanceSheet.aedRate ?? 34})</Text><Text style={S.plVal}>{fmt2((balanceSheet.sumAED ?? 0) * (balanceSheet.aedRate ?? 34))}</Text></View>
            <View style={S.plRow}><Text style={S.plLabel}>Stock Value</Text><Text style={S.plVal}>{fmt2(balanceSheet.stockBalance ?? 0)}</Text></View>
            <View style={S.totalRow}><Text style={S.totalLabel}>GRAND ASSET TOTAL</Text><Text style={[S.totalAmt, { color: COLORS.balance }]}>{fmt2(balanceSheet.totalAssetBalance ?? 0)}</Text></View>
          </View>

        </View>

        <View style={S.footer}>
          <Text>Printed On: {new Date().toLocaleString()} | Emaar Trading</Text>
        </View>
      </Page>
    </Document>
  )
}
