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

const fmt2 = (n) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#FFFFFF", padding: 20 },

  // Header
  headerWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 12,
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
  shopName: { fontSize: 13, fontWeight: "bold", color: "#111827" },
  address: { fontSize: 8, color: "#374151", marginTop: 2 },
  contact: { fontSize: 8, color: "#4B5563", marginTop: 2 },

  rightInfo: { width: "38%", alignItems: "flex-end" },
  rightLine: { fontSize: 8, color: "#374151", lineHeight: 1.3 },

  title: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 4,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E293B",
    backgroundColor: "#F1F5F9",
    padding: "4 6",
    marginBottom: 6,
    borderRadius: 2,
  },

  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 12,
  },
  row: { flexDirection: "row" },
  th: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#F8FAFC",
    padding: 6,
  },
  td: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  head: { fontSize: 8, fontWeight: "bold", color: "#1E293B" },
  cell: { fontSize: 8, color: "#334155" },
  boldCell: { fontSize: 8, fontWeight: "bold", color: "#0F172A" },
  right: { textAlign: "right" },

  colLabel: { width: "65%" },
  colValue: { width: "35%" },

  profitBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lossBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verdictLabel: { fontSize: 11, fontWeight: "bold" },
  verdictValue: { fontSize: 13, fontWeight: "bold" },

  pageNum: {
    position: "absolute",
    fontSize: 8,
    bottom: 12,
    right: 20,
    color: "#94A3B8",
  },
});

function Header({ user, genStr }) {
  const u = user || {};
  const inv = u?.invoice_settings || {};
  const shopName =
    inv?.shop_name || u?.outlet_name || u?.owner_name || "Emaar Jewellers";
  const logo = inv?.shop_logo || u?.logo;
  const address = inv?.shop_address || u?.address || "";
  const phone = inv?.mobile_number || u?.phone || "";
  const email = inv?.email || u?.email || "";
  const web = inv?.web_address || u?.web_address || "";

  return (
    <View style={styles.headerWrap}>
      <View style={styles.leftInfo}>
        <View style={styles.logoWrap}>
          {logo ? (
            <Image src={logo} style={styles.logo} />
          ) : null}
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
        <Text style={styles.rightLine}>Report: Financial Overview</Text>
        <Text style={styles.rightLine}>Currency: BDT</Text>
        <Text style={styles.rightLine}>Generated: {genStr}</Text>
      </View>
    </View>
  );
}

export default function FinancialOverviewPDF({ data = {}, user }) {
  const {
    investment = 0,
    fixedAsset = 0,
    monthlyExpense = 0,
    totalStockValue = 0,
    customerDue = 0,
    vendorDue = 0,
    cashBalance = 0,
    bankBalance = 0,
    totalBalance = 0,
    totalAssetAndLiquidity = 0,
    netProfitLoss = 0,
    isProfit = true,
    monthPeriodStr = "",
  } = data;

  const gen = new Date();
  const genStr = `${gen.toISOString().slice(0, 10)} ${gen.toTimeString().slice(0, 8)}`;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <Header user={user} genStr={genStr} />
        <Text style={styles.title}>Financial Overview Statement</Text>

        {/* Section 1: Financial Summary */}
        <Text style={styles.sectionTitle}>1. Summary of Financial Assets &amp; Liabilities</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.th, styles.colLabel]}><Text style={styles.head}>Metric Description</Text></View>
            <View style={[styles.th, styles.colValue]}><Text style={[styles.head, styles.right]}>Amount (BDT)</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Investment (Credit Quick Payments)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(investment)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Fixed Asset (Debit Quick Payments)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(fixedAsset)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Current Month Expense ({monthPeriodStr || "Current Month"})</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(monthlyExpense)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Total Stock Value</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(totalStockValue)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Customer Due (Receivable)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(customerDue)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Vendor Due (Payable / Supplier Balance)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(vendorDue)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Cash &amp; Bank Closing Balance (Cash: {fmt2(cashBalance)}, Bank: {fmt2(bankBalance)})</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>{fmt2(totalBalance)}</Text></View>
          </View>
        </View>

        {/* Section 2: Profit / Loss Calculation */}
        <Text style={styles.sectionTitle}>2. Accounts Profit / Loss Calculation</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Fixed Asset (Debit)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>+ {fmt2(fixedAsset)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Current Month Expense</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>+ {fmt2(monthlyExpense)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Total Stock Value</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>+ {fmt2(totalStockValue)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Customer Due</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>+ {fmt2(customerDue)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Total Balance (Cash + Bank)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>+ {fmt2(totalBalance)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Supplier Balance (Vendor Due)</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>- {fmt2(vendorDue)}</Text></View>
          </View>
          {/* Subtotal */}
          <View style={[styles.row, { backgroundColor: "#F1F5F9" }]}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.boldCell}>Total Asset &amp; Liquidity</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.boldCell, styles.right]}>{fmt2(totalAssetAndLiquidity)}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.td, styles.colLabel]}><Text style={styles.cell}>Less: Total Investment</Text></View>
            <View style={[styles.td, styles.colValue]}><Text style={[styles.cell, styles.right]}>- {fmt2(investment)}</Text></View>
          </View>
        </View>

        {/* Verdict Box */}
        <View style={isProfit ? styles.profitBox : styles.lossBox}>
          <View>
            <Text style={[styles.verdictLabel, { color: isProfit ? "#065F46" : "#991B1B" }]}>
              Net Result: {isProfit ? "NET PROFIT" : "NET LOSS"}
            </Text>
            <Text style={{ fontSize: 8, color: isProfit ? "#047857" : "#B91C1C", marginTop: 2 }}>
              {isProfit ? "Total Asset & Liquidity exceeds Total Investment." : "Total Investment exceeds Total Asset & Liquidity."}
            </Text>
          </View>
          <Text style={[styles.verdictValue, { color: isProfit ? "#047857" : "#B91C1C" }]}>
            BDT {fmt2(Math.abs(netProfitLoss))}
          </Text>
        </View>

        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
