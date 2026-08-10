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
  header: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 15 },
  dateRange: { fontSize: 9, color: "#999", marginBottom: 10 },
   dateRanget: {
    textAlign: "center",
    fontSize: 10,
    color: "#666",
    marginBottom: 15,
    marginTop: 10,
  },
  summarySection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  summaryLabel: { fontSize: 10, fontWeight: "bold" },
  summaryValue: { fontSize: 10, fontWeight: "bold", textAlign: "right" },
  table: { marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: "#999" },
  tableRow: { flexDirection: "row" },
  tableHeaderCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#e5e5e5",
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
    logoImg: {
    width: 100,
    height: 100,
    marginTop: 0,
  },

  imageBorder: {
    width: "30%",
    borderRight: 1,
    borderColor: "#b0b0b0",
    marginRight: 15,
  },

  leftSection: {
    width: "60%",
    flexDirection: "column",
    paddingBottom: 10,
    paddingTop: 10,
    borderRight: 1,
    borderColor: "#b0b0b0",
    paddingRight: 15,
  },
  businessName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  addressLine: {
    fontSize: 9,
    marginTop: 1,
    color: "#333",
  },
  infoText: {
    fontSize: 9,
    marginTop: 1,
    color: "#333",
  },
  rightSection: {
    width: "40%",
    alignItems: "flex-end",
    flexDirection: "column",
  },

   refBox: {
    alignItems: "flex-end",
  },
  refText: {
    fontSize: 10,
    marginTop: 2,
  },
 reportTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 7,
    borderBottom: 1,
    borderColor: "#b0b0b0",
    color: "#000",
  },

 
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#999",
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  textRight: { textAlign: "right" },
  openingBalanceRow: { backgroundColor: "#e3f2fd", fontWeight: "bold" },
  totalRow: { backgroundColor: "#f7dcda", color: "#d94338", fontWeight: 600, borderTopWidth: 0, borderTopColor: "#ddd" },
  
  accountsContainer: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '45%',
    borderWidth: 1,
    borderColor: '#999',
  },
  accountRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  accountRowLabel: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#999',
  },
  accountRowValue: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    textAlign: 'right',
    color: '#333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
  },
  grandTotalLabel: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#999',
  },
  grandTotalValue: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  footer: { marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#ccc", fontSize: 8, color: "#999", textAlign: "center" },
})

export default function LedgerStatementReportPDF({ logoUrl, ledgerEntries, summaryTotals, filters, user, matchedAccounts = [], grandEndingBalance = 0 }) {
  const startDate = new Date(filters.start_date).toLocaleDateString()
  const endDate = new Date(filters.end_date).toLocaleDateString()
  const logo = logoUrl || null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
         <View style={styles.headerContainer}>
                  <View style={styles.imageBorder}>
                    {logo ? (
                        <Image src={logo} style={styles.logoImg} />
                    ) : (
                        <Text style={{fontSize: 10, color: '#999', marginTop: 40}}>NO LOGO</Text>
                    )}
                  </View>
                  {/* LEFT SIDE - BUSINESS INFO */}
                  <View style={styles.leftSection}>
                    <Text style={styles.businessName}>{user?.outlet_name || "EMAAR JEWELLERS"}</Text>
                    <Text style={styles.addressLine}>{user?.address || "Address Line 1"}</Text>
                    <Text style={styles.infoText}>Mobile: {user?.phone || "-"}</Text>
                    <Text style={styles.infoText}>Email: {user?.email || "-"}</Text>
                    {user?.web_address && <Text style={styles.infoText}>Web: {user.web_address}</Text>}
                  </View>
        
                  {/* RIGHT SIDE - LOGO & BARCODE */}
                  <View style={styles.rightSection}>
                    <View style={styles.refBox}>
                      {user?.barcode && (
                        <Image src={user.barcode || "/placeholder.svg"} style={{ height: 30, marginBottom: 5 }} cache={false} />
                      )}
                      <Text style={styles.refText}>Ref No: {user?.ref_no || "---"}</Text>
                      <Text style={styles.refText}>Date: {new Date().toLocaleDateString() || "---"}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.reportTitle}>LEDGER STATEMENT REPORT</Text>
                
                        <Text style={styles.dateRanget}>
                          Statement For: {filters.selected_name || "All"}
                        </Text>
                        <Text style={styles.dateRanget}>
                          Start Date: {startDate}                             End Date:{" "}
                          {endDate}
                        </Text>

        {/* Ledger Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Date</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 3.5 }}>Particulars</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.25, textAlign: "right" }}>Debit</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.25, textAlign: "right" }}>Credit</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.5, textAlign: "right" }}>Balance</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Remarks</Text>
          </View>

          {/* Opening Balance */}
          <View style={{ ...styles.tableRow, ...styles.openingBalanceRow }}>
            <Text style={{ ...styles.tableCell, flex: 1.5 }}></Text>
            <Text style={{ ...styles.tableCell, flex: 3.5 }}>Opening Balance</Text>
            <Text style={{ ...styles.tableCell, flex: 1.25 }}></Text>
            <Text style={{ ...styles.tableCell, flex: 1.25 }}></Text>
            <Text style={{ ...styles.tableCell, flex: 1.5, textAlign: "right" }}>{fmt2(Math.abs(summaryTotals.opening_balance))} [ {Number(summaryTotals.opening_balance) >= 0 ? "+" : "-"} ]</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}></Text>
          </View>

          {/* Ledger Entries */}
          {ledgerEntries?.map((entry, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={{ ...styles.tableCell, flex: 1.5 }}>{entry.date ? new Date(entry.date).toLocaleDateString() : "-"}</Text>
              <Text style={{ ...styles.tableCell, flex: 3.5 }}>{entry.invoice_id ? `${entry.invoice_id} ${entry.particulars ? `> ${entry.particulars}` : ""}` : (entry.particulars || "-")}</Text>
              <Text style={{ ...styles.tableCell, flex: 1.25, textAlign: "right" }}>{Number(entry?.debit) !== 0 ? fmt2(entry.debit) : ""}</Text>
              <Text style={{ ...styles.tableCell, flex: 1.25, textAlign: "right" }}>{Number(entry?.credit) !== 0 ? fmt2(entry.credit) : ""}</Text>
              <Text style={{ ...styles.tableCell, flex: 1.5, textAlign: "right" }}>{fmt2(Math.abs(entry.balance))} [ {Number(entry.balance) >= 0 ? "+" : "-"} ]</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{entry.remarks || "-"}</Text>
            </View>
          ))}

          {/* Total Row */}
          <View style={{ ...styles.tableRow, ...styles.totalRow }}>
            <Text style={{ ...styles.tableCell, flex: 1.5 }}></Text>
            <Text style={{ ...styles.tableCell, flex: 3.5 }}>Total</Text>
            <Text style={{ ...styles.tableCell, flex: 1.25, textAlign: "right" }}>{fmt2(summaryTotals.total_debit)}</Text>
            <Text style={{ ...styles.tableCell, flex: 1.25, textAlign: "right" }}>{fmt2(summaryTotals.total_credit)}</Text>
            <Text style={{ ...styles.tableCell, flex: 1.5, textAlign: "right" }}>{fmt2(Math.abs(summaryTotals.closing_balance))} [ {Number(summaryTotals.closing_balance) >= 0 ? "+" : "-"} ]</Text>
            <Text style={{ ...styles.tableCell, flex: 1 }}></Text>
          </View>
        </View>

        {/* Account Balances and Grand Total */}
        {matchedAccounts && matchedAccounts.length > 0 && (
          <View style={styles.accountsContainer}>
            <View style={styles.accountRow}>
              <Text style={styles.accountRowLabel}>Ledger Closing Balance</Text>
              <Text style={styles.accountRowValue}>{fmt2(Math.abs(summaryTotals.closing_balance))} [ {Number(summaryTotals.closing_balance) >= 0 ? "+" : "-"} ]</Text>
            </View>
            {matchedAccounts.map((acc, idx) => (
              <View style={styles.accountRow} key={`acc-${idx}`}>
                <Text style={styles.accountRowLabel}>Account: {acc.payment_category_name}</Text>
                <Text style={styles.accountRowValue}>{fmt2(Math.abs(acc.balance))} [ {Number(acc.balance) >= 0 ? "+" : "-"} ]</Text>
              </View>
            ))}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>GRAND ENDING BALANCE</Text>
              <Text style={styles.grandTotalValue}>{fmt2(Math.abs(grandEndingBalance))} [ {Number(grandEndingBalance) >= 0 ? "+" : "-"} ]</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
