/* eslint-disable react/react-in-jsx-scope */
"use client"

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatBal = (n) => {
  const val = Number(n ?? 0);
  const absVal = Math.abs(val);
  const str = absVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val === 0) return str;
  // If positive, it's typically DR for customers, but the reference image showed CR reducing with DR.
  // I will just append CR/DR based on standard: positive = CR, negative = DR, or vice-versa. 
  // Wait, if Debit was 20,000 and Balance went from 1.46M CR to 1.44M CR, then Debit reduces CR. So CR is positive.
  // I will just use the standard fmt2 to avoid confusing accounting logic, but if I must, I'll use CR for pos, DR for neg.
  return val >= 0 ? `${str} CR` : `${str} DR`;
}

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 8, fontFamily: "Helvetica" },
  headerWrapper: {
    borderTopWidth: 2,
    borderTopColor: "red",
    borderBottomWidth: 2,
    borderBottomColor: "red",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    width: "35%",
    flexDirection: "column",
  },
  headerCenter: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    width: "35%",
    alignItems: "flex-end",
    flexDirection: "column",
  },
  title: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  headerText: { fontSize: 8, marginBottom: 2, color: "#333" },
  businessName: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  logoImg: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  infoBoxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  box: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#999",
    padding: 5,
  },
  boxTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  boxText: {
    fontSize: 8,
    marginBottom: 2,
    color: "#333",
  },
  table: { width: "100%", borderWidth: 1, borderColor: "#000" },
  tableRow: { flexDirection: "row" },
  tableHeaderGroup: { backgroundColor: "#e5e5e5", borderBottomWidth: 1, borderBottomColor: "#000" },
  colBranch: { width: "6%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" },
  colVoucher: { width: "15%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" },
  colDate: { width: "7%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" },
  colNarration: { width: "17%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" },
  colQty: { width: "7%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" },
  colAmtGrp: { width: "24%", borderRightWidth: 1, borderColor: "#000", flexDirection: "column" },
  colWtGrp: { width: "24%", flexDirection: "column" },
  
  colHeaderMain: { padding: 4, textAlign: "center", borderBottomWidth: 1, borderColor: "#000", fontWeight: "bold" },
  colSubGroup: { flexDirection: "row" },
  colDr: { flex: 1, borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "center" },
  colCr: { flex: 1, borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "center" },
  colBal: { flex: 1, padding: 4, textAlign: "center" },
  
  tableCell: { fontSize: 7, justifyContent: "center" },
  tableCellRight: { fontSize: 7, textAlign: "right" },
  
  cellBranch: { width: "6%", borderRightWidth: 1, borderColor: "#000", padding: 4 },
  cellVoucher: { width: "15%", borderRightWidth: 1, borderColor: "#000", padding: 4 },
  cellDate: { width: "7%", borderRightWidth: 1, borderColor: "#000", padding: 4 },
  cellNarration: { width: "17%", borderRightWidth: 1, borderColor: "#000", padding: 4 },
  cellQty: { width: "7%", borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "right" },
  cellDr: { width: "8%", borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "right" },
  cellCr: { width: "8%", borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "right" },
  cellBal: { width: "8%", borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "right", fontWeight: "bold" },
  cellDrLast: { width: "8%", borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "right" },
  cellCrLast: { width: "8%", borderRightWidth: 1, borderColor: "#000", padding: 4, textAlign: "right" },
  cellBalLast: { width: "8%", padding: 4, textAlign: "right", fontWeight: "bold" },

  boldRow: { backgroundColor: "#f9f9f9", fontWeight: "bold" },
  footerRow: { borderTopWidth: 1, borderColor: "#000", backgroundColor: "#e5e5e5", fontWeight: "bold" },
  
  footer: { marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#ccc", fontSize: 8, color: "#999", textAlign: "center" },
})

export default function LedgerStatementReportPDF({ logoUrl, ledgerAED, ledgerBDT, summaryTotalsAED, summaryTotalsBDT, filters, user, accountsAED = [], accountsBDT = [], grandEndingAED = 0, grandEndingBDT = 0 }) {
  const startDate = new Date(filters.start_date).toLocaleDateString("en-GB")
  const endDate = new Date(filters.end_date).toLocaleDateString("en-GB")
  const logo = logoUrl || null;

  // Combine and sort
  const combinedEntries = [...(ledgerAED || []), ...(ledgerBDT || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentAedBalance = summaryTotalsAED?.opening_balance || 0;
  let currentBdtBalance = summaryTotalsBDT?.opening_balance || 0;
  
  const tableRows = combinedEntries.map(entry => {
    // Check which array it belongs to
    const isAed = ledgerAED?.some(e => e.date === entry.date && e.invoice_id === entry.invoice_id && e.debit === entry.debit && e.credit === entry.credit);
    
    if (isAed) {
      currentAedBalance = entry.balance;
    } else {
      currentBdtBalance = entry.balance;
    }

    return {
      ...entry,
      isAed,
      aedDebit: isAed ? entry.debit : null,
      aedCredit: isAed ? entry.credit : null,
      aedBalance: currentAedBalance,
      bdtDebit: !isAed ? entry.debit : null,
      bdtCredit: !isAed ? entry.credit : null,
      bdtBalance: currentBdtBalance,
    };
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>STATEMENT OF ACCOUNT</Text>
            <Text style={styles.headerText}>From {startDate} To {endDate} (AED and BDT)</Text>
            <Text style={styles.headerText}>BRANCH : {user?.outlet_name || "N/A"}</Text>
            <Text style={styles.headerText}>Order By : Trans Date</Text>
          </View>
          <View style={styles.headerCenter}>
             {logo ? (
                 <Image src={logo} style={styles.logoImg} />
             ) : (
                 <Text style={{fontSize: 10, color: '#999'}}>NO LOGO</Text>
             )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.businessName}>{user?.outlet_name || "EMAAR JEWELLERS"}</Text>
            <Text style={styles.headerText}>{user?.address || "Address Line 1"}</Text>
            <Text style={styles.headerText}>Tel : {user?.phone || "-"}</Text>
            {user?.email && <Text style={styles.headerText}>Email : {user.email}</Text>}
            {user?.web_address && <Text style={styles.headerText}>Web : {user.web_address}</Text>}
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoBoxes}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>To</Text>
            <Text style={{...styles.boxText, fontWeight: "bold", fontSize: 9}}>{filters.selected_name || "N/A"}</Text>
            <Text style={styles.boxText}> </Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Contact Details</Text>
            <Text style={{...styles.boxText, fontWeight: "bold", fontSize: 9}}>{filters.selected_name || "N/A"}</Text>
            <Text style={styles.boxText}>TEL1. : </Text>
            <Text style={styles.boxText}>Email : </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={{...styles.tableRow, ...styles.tableHeaderGroup}}>
            <View style={styles.colBranch}><Text>Branch</Text></View>
            <View style={styles.colVoucher}><Text>Voucher</Text></View>
            <View style={styles.colDate}><Text>Voc Date</Text></View>
            <View style={styles.colNarration}><Text>Narration</Text></View>
            <View style={styles.colQty}><Text>Qty</Text></View>
            <View style={styles.colAmtGrp}>
              <Text style={styles.colHeaderMain}>AMOUNT IN (AED)</Text>
              <View style={styles.colSubGroup}>
                <Text style={styles.colDr}>Debit</Text>
                <Text style={styles.colCr}>Credit</Text>
                <Text style={styles.colBal}>Balance</Text>
              </View>
            </View>
            <View style={styles.colWtGrp}>
              <Text style={styles.colHeaderMain}>AMOUNT IN (BDT)</Text>
              <View style={styles.colSubGroup}>
                <Text style={styles.colDr}>Debit</Text>
                <Text style={styles.colCr}>Credit</Text>
                <Text style={styles.colBal}>Balance</Text>
              </View>
            </View>
          </View>

          {/* Opening Balance Row */}
          <View style={{...styles.tableRow, ...styles.boldRow, borderBottomWidth: 1, borderColor: "#000"}}>
            <Text style={styles.cellBranch}>{user?.outlet_name || "N/A"}</Text>
            <Text style={styles.cellVoucher}></Text>
            <Text style={styles.cellDate}></Text>
            <Text style={{...styles.cellNarration, textAlign: "center"}}>Balance B/F</Text>
            <Text style={styles.cellQty}></Text>
            <Text style={styles.cellDr}></Text>
            <Text style={styles.cellCr}></Text>
            <Text style={styles.cellBal}>{formatBal(summaryTotalsAED?.opening_balance)}</Text>
            <Text style={styles.cellDrLast}></Text>
            <Text style={styles.cellCrLast}></Text>
            <Text style={styles.cellBalLast}>{formatBal(summaryTotalsBDT?.opening_balance)}</Text>
          </View>

          {/* Data Rows */}
          {tableRows.map((row, idx) => (
            <View key={idx} style={{...styles.tableRow, borderBottomWidth: 1, borderColor: "#ccc"}}>
              <Text style={styles.cellBranch}>{user?.outlet_name || "N/A"}</Text>
              <Text style={styles.cellVoucher}>{row.invoice_id ? row.invoice_id.replace(/-/g, '-\u200B') : "-"}</Text>
              <Text style={styles.cellDate}>{row.date ? new Date(row.date).toLocaleDateString("en-GB") : ""}</Text>
              <Text style={styles.cellNarration}>{row.particulars || "-"}</Text>
              <Text style={styles.cellQty}>{row.qty || ""}</Text>
              
              {/* AED Columns */}
              <Text style={styles.cellDr}>{row.aedDebit ? fmt2(row.aedDebit) : ""}</Text>
              <Text style={styles.cellCr}>{row.aedCredit ? fmt2(row.aedCredit) : ""}</Text>
              <Text style={styles.cellBal}>{formatBal(row.aedBalance)}</Text>
              
              {/* BDT Columns */}
              <Text style={styles.cellDrLast}>{row.bdtDebit ? fmt2(row.bdtDebit) : ""}</Text>
              <Text style={styles.cellCrLast}>{row.bdtCredit ? fmt2(row.bdtCredit) : ""}</Text>
              <Text style={styles.cellBalLast}>{formatBal(row.bdtBalance)}</Text>
            </View>
          ))}

          {/* Footer Total Row */}
          <View style={{...styles.tableRow, ...styles.footerRow}}>
             <Text style={styles.cellBranch}></Text>
             <Text style={styles.cellVoucher}></Text>
             <Text style={styles.cellDate}></Text>
             <Text style={{...styles.cellNarration, textAlign: "center"}}>Sub Total</Text>
             <Text style={styles.cellQty}></Text>
             <Text style={styles.cellDr}>{fmt2(summaryTotalsAED?.total_debit)}</Text>
             <Text style={styles.cellCr}>{fmt2(summaryTotalsAED?.total_credit)}</Text>
             <Text style={styles.cellBal}>{formatBal(summaryTotalsAED?.closing_balance)}</Text>
             <Text style={styles.cellDrLast}>{fmt2(summaryTotalsBDT?.total_debit)}</Text>
             <Text style={styles.cellCrLast}>{fmt2(summaryTotalsBDT?.total_credit)}</Text>
             <Text style={styles.cellBalLast}>{formatBal(summaryTotalsBDT?.closing_balance)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Printed By : ADMIN                                                                                                       Printed On : {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
