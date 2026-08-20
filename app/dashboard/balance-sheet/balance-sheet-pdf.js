/* eslint-disable react/react-in-jsx-scope */
"use client"

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  imageBorder: {
    width: "30%",
    borderRight: 1,
    borderColor: "#b0b0b0",
    marginRight: 15,
  },
  logoImg: { width: 100, height: 100, marginTop: 0 },
  leftSection: {
    width: "60%",
    flexDirection: "column",
    paddingBottom: 10,
    paddingTop: 10,
    borderRight: 1,
    borderColor: "#b0b0b0",
    paddingRight: 15,
  },
  businessName: { fontSize: 14, fontWeight: "bold", marginBottom: 5 },
  addressLine: { fontSize: 9, marginTop: 1, color: "#333" },
  infoText: { fontSize: 9, marginTop: 1, color: "#333" },
  rightSection: {
    width: "40%",
    alignItems: "flex-end",
    flexDirection: "column",
  },
  refBox: { alignItems: "flex-end" },
  refText: { fontSize: 10, marginTop: 2 },
  reportTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 7,
    borderBottom: 1,
    borderColor: "#b0b0b0",
    color: "#000",
  },
  dateRangeText: {
    textAlign: "center",
    fontSize: 10,
    color: "#666",
    marginBottom: 8,
    marginTop: 10,
  },
  table: { marginTop: 10, marginBottom: 10, borderWidth: 1, borderColor: "#999" },
  tableRow: { flexDirection: "row" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#e5e5e5" },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#999",
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderTopWidth: 2,
    borderTopColor: "#999",
  },
  grandSumRow: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderTopWidth: 2,
    borderTopColor: "#666",
  },
  stockRow: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    borderTopWidth: 1,
    borderTopColor: "#999",
  },
  totalAssetRow: {
    flexDirection: "row",
    backgroundColor: "#d5d5d5",
    borderTopWidth: 2,
    borderTopColor: "#666",
  },
  footerCell: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  footerCellBold: {
    padding: 6,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  footerCellXL: {
    padding: 8,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
})

const colorStyle = (val) => {
  if (val > 0) return { color: "#059669" }
  if (val < 0) return { color: "#dc2626" }
  return { color: "#1e293b" }
}

export default function BalanceSheetPDF({
  logoUrl,
  userBalances = [],
  aedRate = 34,
  sumBDT = 0,
  sumAED = 0,
  grandTotal = 0,
  stockBalance = 0,
  totalAssetBalance = 0,
  filters = {},
  user = {},
}) {
  const startDate = filters.start_date
    ? new Date(filters.start_date).toLocaleDateString()
    : "-"
  const endDate = filters.end_date
    ? new Date(filters.end_date).toLocaleDateString()
    : "-"
  const logo = logoUrl || null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.imageBorder}>
            {logo ? (
              <Image src={logo} style={styles.logoImg} />
            ) : (
              <Text style={{ fontSize: 10, color: "#999", marginTop: 40 }}>
                NO LOGO
              </Text>
            )}
          </View>
          <View style={styles.leftSection}>
            <Text style={styles.businessName}>
              {user?.outlet_name || "EMAAR JEWELLERS"}
            </Text>
            <Text style={styles.addressLine}>
              {user?.address || "Address Line 1"}
            </Text>
            <Text style={styles.infoText}>Mobile: {user?.phone || "-"}</Text>
            <Text style={styles.infoText}>Email: {user?.email || "-"}</Text>
            {user?.web_address && (
              <Text style={styles.infoText}>Web: {user.web_address}</Text>
            )}
          </View>
          <View style={styles.rightSection}>
            <View style={styles.refBox}>
              {user?.barcode && (
                <Image
                  src={user.barcode || "/placeholder.svg"}
                  style={{ height: 30, marginBottom: 5 }}
                  cache={false}
                />
              )}
              <Text style={styles.refText}>
                Ref No: {user?.ref_no || "---"}
              </Text>
              <Text style={styles.refText}>
                Date: {new Date().toLocaleDateString() || "---"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.reportTitle}>BALANCE SHEET</Text>
        <Text style={styles.dateRangeText}>
          Start Date: {startDate}{"                    "}End Date: {endDate}
        </Text>
        <Text style={styles.dateRangeText}>AED Rate: {aedRate} BDT</Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>NAME</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: "right" }}>
              GRAND ENDING BAL (BDT)
            </Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: "right" }}>
              GRAND ENDING BAL (AED)
            </Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: "right", borderRightWidth: 0 }}>
              AED IN BDT
            </Text>
          </View>

          {userBalances.map((u, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 3, fontFamily: "Helvetica-Bold" }}>
                {u.name}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 2, textAlign: "right", ...colorStyle(u.bdt) }}>
                {fmt2(u.bdt)}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 2, textAlign: "right", ...colorStyle(u.aed) }}>
                {fmt2(u.aed)} AED
              </Text>
              <Text style={{ ...styles.tableCell, flex: 2, textAlign: "right", borderRightWidth: 0, ...colorStyle(u.aed * aedRate) }}>
                {fmt2(u.aed * aedRate)}
              </Text>
            </View>
          ))}

          {/* Total Balances */}
          <View style={styles.totalRow}>
            <Text style={{ ...styles.footerCellBold, flex: 3, textAlign: "right" }}>
              TOTAL BALANCES
            </Text>
            <Text style={{ ...styles.footerCellBold, flex: 2, textAlign: "right", ...colorStyle(sumBDT) }}>
              {fmt2(sumBDT)}
            </Text>
            <Text style={{ ...styles.footerCellBold, flex: 2, textAlign: "right", ...colorStyle(sumAED) }}>
              {fmt2(sumAED)} AED
            </Text>
            <Text style={{ ...styles.footerCellBold, flex: 2, textAlign: "right", borderRightWidth: 0, ...colorStyle(sumAED * aedRate) }}>
              {fmt2(sumAED)} x {aedRate} = {fmt2(sumAED * aedRate)}
            </Text>
          </View>

          {/* Grand Sum Total */}
          <View style={styles.grandSumRow}>
            <Text style={{ ...styles.footerCellXL, flex: 3, textAlign: "right" }}>
              GRAND SUM TOTAL
            </Text>
            <Text style={{ ...styles.footerCellXL, flex: 6, textAlign: "right", borderRightWidth: 0, ...colorStyle(grandTotal) }}>
              {fmt2(grandTotal)} BDT
            </Text>
          </View>

          {/* Stock Balance */}
          <View style={styles.stockRow}>
            <Text style={{ ...styles.footerCellBold, flex: 3, textAlign: "right", color: "#065f46" }}>
              STOCK BALANCE
            </Text>
            <Text style={{ ...styles.footerCellBold, flex: 2, textAlign: "right", ...colorStyle(stockBalance) }}>
              {fmt2(stockBalance)}
            </Text>
            <Text style={{ ...styles.footerCell, flex: 4, borderRightWidth: 0 }}> </Text>
          </View>

          {/* Total Asset Balance */}
          <View style={styles.totalAssetRow}>
            <Text style={{ ...styles.footerCellXL, flex: 3, textAlign: "right" }}>
              TOTAL ASSET BALANCE
            </Text>
            <Text style={{ ...styles.footerCellXL, flex: 6, textAlign: "right", borderRightWidth: 0, ...colorStyle(totalAssetBalance) }}>
              {fmt2(totalAssetBalance)} BDT
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
