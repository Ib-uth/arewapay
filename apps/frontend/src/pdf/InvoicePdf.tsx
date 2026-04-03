import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Invoice } from "../types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 16, color: "#065f46" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    paddingBottom: 4,
    marginTop: 12,
    fontWeight: "bold",
  },
  cell: { flex: 1 },
  cellNum: { width: 70, textAlign: "right" },
  line: { flexDirection: "row", marginTop: 6 },
});

export function InvoicePdfDoc({
  invoice,
  clientName,
}: {
  invoice: Invoice;
  clientName: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ArewaPay Invoice</Text>
        <View style={styles.row}>
          <Text>Invoice #{invoice.invoice_number}</Text>
          <Text>Status: {invoice.status}</Text>
        </View>
        <View style={styles.row}>
          <Text>Bill to: {clientName}</Text>
          <Text>Due: {invoice.due_date}</Text>
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.cell}>Description</Text>
          <Text style={styles.cellNum}>Qty</Text>
          <Text style={styles.cellNum}>Price</Text>
          <Text style={styles.cellNum}>Total</Text>
        </View>
        {invoice.items.map((it) => (
          <View key={it.id} style={styles.line} wrap={false}>
            <Text style={styles.cell}>{it.description}</Text>
            <Text style={styles.cellNum}>{it.quantity}</Text>
            <Text style={styles.cellNum}>{it.unit_price}</Text>
            <Text style={styles.cellNum}>{it.line_total}</Text>
          </View>
        ))}
        <View style={{ marginTop: 16, alignItems: "flex-end" }}>
          <Text>Subtotal: {invoice.currency} {invoice.subtotal}</Text>
          <Text>Tax: {invoice.currency} {invoice.tax_amount}</Text>
          <Text style={{ fontSize: 12, marginTop: 4, fontWeight: "bold" }}>
            Total: {invoice.currency} {invoice.total}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
