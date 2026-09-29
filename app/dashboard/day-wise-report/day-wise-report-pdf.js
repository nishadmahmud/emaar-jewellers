/* eslint-disable react/react-in-jsx-scope */
"use client"

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const styles = StyleSheet.create({
  page: { padding: 15, fontSize: 8, fontFamily: "Helvetica", flexDirection: "column" },
  headerWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    width: "30%",
    flexDirection: "column",
  },
  headerCenter: {
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    width: "30%",
    alignItems: "flex-end",
    flexDirection: "column",
  },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  headerText: { fontSize: 8, marginBottom: 2, color: "#333" },
  businessName: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  logoImg: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  columnsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  column: {
    width: "19.5%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  colHeader: {
    backgroundColor: "#eee",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 9,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 3,
  },
  cellLeft: { flex: 1, fontSize: 7, paddingRight: 2 },
  cellRight: { fontSize: 7, textAlign: "right", fontWeight: "bold" },
  footer: { marginTop: 10, paddingTop: 5, borderTopWidth: 1, borderTopColor: "#ccc", fontSize: 8, color: "#999", textAlign: "center" },
})

export default function DayWiseReportPDF({ logoUrl, user, date, sales, purchases, transactions, profitLoss, balanceSheet }) {
  const displayDate = date ? date.slice(0, 10).split('-').reverse().join('/') : ""
  const logo = logoUrl || null;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>DAY WISE REPORT</Text>
            <Text style={styles.headerText}>Date: {displayDate}</Text>
            <Text style={styles.headerText}>BRANCH: {user?.outlet_name || "N/A"}</Text>
          </View>
          <View style={styles.headerCenter}>
             {logo ? (
                 <Image src={logo} style={styles.logoImg} />
             ) : (
                 <Text style={{fontSize: 18, fontWeight: "bold", color: '#333'}}>EMAAR TRADERS</Text>
             )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.businessName}>{user?.outlet_name || "EMAAR TRADERS"}</Text>
            <Text style={styles.headerText}>{user?.address || "Address Line 1"}</Text>
            <Text style={styles.headerText}>Tel: {user?.phone || "-"}</Text>
            {user?.email && <Text style={styles.headerText}>Email: {user.email}</Text>}
          </View>
        </View>

        {/* Columns Content */}
        <View style={styles.columnsWrapper}>
          
          {/* Sale History */}
          <View style={styles.column}>
            <Text style={styles.colHeader}>Sales History</Text>
            {sales.length === 0 ? <Text style={{padding: 4, textAlign: 'center', fontSize: 7}}>No sales today</Text> : null}
            {sales.map((item, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.cellLeft}>{item.invoice_id}</Text>
                <Text style={styles.cellRight}>{fmt2(item.amount)}</Text>
              </View>
            ))}
            {sales.length > 0 && (
              <View style={{...styles.row, backgroundColor: '#f9f9f9'}}>
                <Text style={{...styles.cellLeft, fontWeight: 'bold'}}>Total</Text>
                <Text style={styles.cellRight}>{fmt2(sales.reduce((acc, curr) => acc + curr.amount, 0))}</Text>
              </View>
            )}
          </View>

          {/* Purchase History */}
          <View style={styles.column}>
            <Text style={styles.colHeader}>Purchase History</Text>
            {purchases.length === 0 ? <Text style={{padding: 4, textAlign: 'center', fontSize: 7}}>No purchases today</Text> : null}
            {purchases.map((item, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.cellLeft}>{item.invoice_id}</Text>
                <Text style={styles.cellRight}>{fmt2(item.amount)}</Text>
              </View>
            ))}
            {purchases.length > 0 && (
              <View style={{...styles.row, backgroundColor: '#f9f9f9'}}>
                <Text style={{...styles.cellLeft, fontWeight: 'bold'}}>Total</Text>
                <Text style={styles.cellRight}>{fmt2(purchases.reduce((acc, curr) => acc + curr.amount, 0))}</Text>
              </View>
            )}
          </View>

          {/* Transaction History */}
          <View style={styles.column}>
            <Text style={styles.colHeader}>Transactions (Cashbook)</Text>
            {transactions.length === 0 ? <Text style={{padding: 4, textAlign: 'center', fontSize: 7}}>No transactions today</Text> : null}
            {transactions.map((item, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.cellLeft}>{item.type_name}</Text>
                <Text style={{...styles.cellRight, color: item.status?.toLowerCase() === 'credit' ? 'green' : 'red'}}>
                   {item.status?.toLowerCase() === 'credit' ? '+' : '-'}{fmt2(item.amount)}
                </Text>
              </View>
            ))}
            {transactions.length > 0 && (
              <View style={{...styles.row, backgroundColor: '#f9f9f9'}}>
                <Text style={{...styles.cellLeft, fontWeight: 'bold'}}>Total In</Text>
                <Text style={{...styles.cellRight, color: 'green'}}>{fmt2(transactions.filter(t => t.status?.toLowerCase() === 'credit').reduce((a, b) => a + b.amount, 0))}</Text>
              </View>
            )}
            {transactions.length > 0 && (
              <View style={{...styles.row, backgroundColor: '#f9f9f9'}}>
                <Text style={{...styles.cellLeft, fontWeight: 'bold'}}>Total Out</Text>
                <Text style={{...styles.cellRight, color: 'red'}}>{fmt2(transactions.filter(t => t.status?.toLowerCase() === 'debit' || t.status?.toLowerCase() === 'out').reduce((a, b) => a + b.amount, 0))}</Text>
              </View>
            )}
          </View>

          {/* Profit Loss */}
          <View style={styles.column}>
            <Text style={styles.colHeader}>Profit & Loss</Text>
            <View style={styles.row}><Text style={styles.cellLeft}>Total Sales</Text><Text style={styles.cellRight}>{fmt2(profitLoss.totalSales)}</Text></View>
            <View style={styles.row}><Text style={styles.cellLeft}>Total Purchase</Text><Text style={styles.cellRight}>{fmt2(profitLoss.totalPurchase)}</Text></View>
            <View style={styles.row}><Text style={styles.cellLeft}>Avg Sell Price</Text><Text style={styles.cellRight}>{fmt2(profitLoss.avgSellPrice)}</Text></View>
            <View style={styles.row}><Text style={styles.cellLeft}>Avg Purch Price</Text><Text style={styles.cellRight}>{fmt2(profitLoss.avgPurchasePrice)}</Text></View>
            <View style={{...styles.row, backgroundColor: '#f9f9f9'}}>
              <Text style={{...styles.cellLeft, fontWeight: 'bold'}}>Est. Profit</Text>
              <Text style={styles.cellRight}>{fmt2(profitLoss.currentProfit)}</Text>
            </View>
          </View>

          {/* Balance Sheet */}
          <View style={styles.column}>
            <Text style={styles.colHeader}>Balance Sheet Summary</Text>
            <View style={styles.row}><Text style={styles.cellLeft}>Stock Value</Text><Text style={styles.cellRight}>{fmt2(balanceSheet.stockBalance)}</Text></View>
            <View style={styles.row}><Text style={styles.cellLeft}>Party Balances (BDT)</Text><Text style={styles.cellRight}>{fmt2(balanceSheet.sumBDT)}</Text></View>
            <View style={styles.row}><Text style={styles.cellLeft}>Party Balances (AED)</Text><Text style={styles.cellRight}>{fmt2(balanceSheet.sumAED)}</Text></View>
            <View style={styles.row}><Text style={styles.cellLeft}>AED Rate</Text><Text style={styles.cellRight}>{fmt2(balanceSheet.aedRate)}</Text></View>
            <View style={{...styles.row, backgroundColor: '#f9f9f9'}}>
              <Text style={{...styles.cellLeft, fontWeight: 'bold'}}>Grand Asset Total</Text>
              <Text style={styles.cellRight}>{fmt2(balanceSheet.totalAssetBalance)}</Text>
            </View>
          </View>
          
        </View>

        <View style={styles.footer}>
          <Text>Printed On: {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
