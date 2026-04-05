import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Invoice } from "../types";

/** Aligned with app + email templates (tailwind / email shell). */
const accent = "#9b2915";
const footer = "#19231A";
const charcoal = "#171e19";
const sage = "#6b7a6e";
const paper = "#f4f2ef";
const border = "#e2e8f0";
const rowAlt = "#f1f5f9";
const onDarkMuted = "#e2e8e0";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: charcoal,
  },
  topBand: {
    marginLeft: -40,
    marginRight: -40,
    marginTop: 0,
    marginBottom: 22,
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: footer,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", maxWidth: "52%" },
  brandWord: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  brandDot: { fontSize: 14, fontFamily: "Helvetica-Bold", color: accent },
  logo: { maxHeight: 44, maxWidth: 140, marginRight: 8, objectFit: "contain" },
  fromNameOnDark: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textAlign: "right",
    color: "#ffffff",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  invoiceMeta: { textAlign: "right", fontSize: 9, color: onDarkMuted, marginBottom: 2 },
  statusLine: {
    textAlign: "right",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: onDarkMuted,
    textTransform: "uppercase",
    marginTop: 4,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 24,
  },
  col: { flex: 1 },
  colTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: sage,
    marginBottom: 6,
  },
  colBody: { fontSize: 9, lineHeight: 1.45 },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: paper,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: border,
  },
  detailItem: { fontSize: 8, color: sage },
  detailStrong: { fontFamily: "Helvetica-Bold", color: charcoal },
  table: { marginTop: 4 },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: charcoal,
    paddingBottom: 6,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: sage,
  },
  tr: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 6 },
  trAlt: { backgroundColor: rowAlt },
  cDesc: { flex: 3.2 },
  cNum: { flex: 0.6, textAlign: "right" },
  cPrice: { flex: 1, textAlign: "right" },
  cAmt: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totals: {
    marginTop: 16,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 10,
  },
  totalLine: { fontSize: 9, marginBottom: 4, textAlign: "right", color: charcoal },
  totalGrand: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: charcoal,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: accent,
  },
  footer: { marginTop: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: border },
  notes: { fontSize: 9, marginBottom: 10, lineHeight: 1.4 },
  thankYou: { fontSize: 9, fontStyle: "italic", color: sage, marginBottom: 8 },
  brandSmall: { fontSize: 7, color: sage },
});

function money(amount: string, currency: string): string {
  const n = Number(amount);
  const s = Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 2 }) : amount;
  return `${currency} ${s}`;
}

export function InvoicePdfDoc({
  invoice,
  clientName,
  billToText,
  logoUrl,
  fromName,
  fromEmail,
}: {
  invoice: Invoice;
  clientName: string;
  billToText: string;
  logoUrl?: string;
  fromName: string;
  fromEmail: string;
}) {
  const taxPct = (Number(invoice.tax_rate) * 100).toFixed(1).replace(/\.0$/, "");
  const discAmt = Number(invoice.discount_amount);
  const billBlock = billToText.trim() || clientName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand}>
          <View style={styles.brandRow}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : (
              <View>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text style={styles.brandWord}>ArewaPay</Text>
                  <Text style={styles.brandDot}>.</Text>
                </View>
                <Text style={styles.fromNameOnDark}>{fromName}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceMeta}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Issue date: {invoice.issue_date}</Text>
            <Text style={styles.invoiceMeta}>Due date: {invoice.due_date}</Text>
            <Text style={styles.statusLine}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>From</Text>
            <Text style={styles.colBody}>
              {fromName}
              {"\n"}
              {fromEmail}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Bill to</Text>
            <Text style={styles.colBody}>{billBlock}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          {invoice.po_number ? (
            <Text style={styles.detailItem}>
              <Text style={styles.detailStrong}>PO: </Text>
              {invoice.po_number}
            </Text>
          ) : null}
          {invoice.payment_terms ? (
            <Text style={styles.detailItem}>
              <Text style={styles.detailStrong}>Terms: </Text>
              {invoice.payment_terms}
            </Text>
          ) : null}
          <Text style={styles.detailItem}>
            <Text style={styles.detailStrong}>Currency: </Text>
            {invoice.currency}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={{ width: 22 }}>#</Text>
            <Text style={styles.cDesc}>Description</Text>
            <Text style={styles.cNum}>Qty</Text>
            <Text style={styles.cPrice}>Unit</Text>
            <Text style={styles.cAmt}>Amount</Text>
          </View>
          {invoice.items.map((it, i) => (
            <View key={it.id} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
              <Text style={{ width: 22 }}>{i + 1}</Text>
              <Text style={styles.cDesc}>{it.description}</Text>
              <Text style={styles.cNum}>{it.quantity}</Text>
              <Text style={styles.cPrice}>{money(it.unit_price, invoice.currency)}</Text>
              <Text style={styles.cAmt}>{money(it.line_total, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text style={styles.totalLine}>Subtotal: {money(invoice.subtotal, invoice.currency)}</Text>
          {discAmt > 0 ? (
            <Text style={styles.totalLine}>
              Discount: −{money(invoice.discount_amount, invoice.currency)}
            </Text>
          ) : null}
          <Text style={styles.totalLine}>
            Tax (VAT {taxPct}%): {money(invoice.tax_amount, invoice.currency)}
          </Text>
          <Text style={styles.totalGrand}>Total: {money(invoice.total, invoice.currency)}</Text>
        </View>

        <View style={styles.footer} wrap={false}>
          {invoice.notes ? (
            <Text style={styles.notes}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Notes: </Text>
              {invoice.notes}
            </Text>
          ) : null}
          <Text style={styles.thankYou}>Thank you for your business.</Text>
          <Text style={styles.brandSmall}>Invoice generated by ArewaPay</Text>
        </View>
      </Page>
    </Document>
  );
}
