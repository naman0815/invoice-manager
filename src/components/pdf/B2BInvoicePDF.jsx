import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDateShort, numberToWords } from '../../lib/helpers'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  // Header (sender info — left-aligned, no invoice header word)
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2D6A4F',
  },
  senderName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#2D6A4F' },
  senderCity: { fontSize: 10, color: '#444', marginTop: 2 },
  senderLine: { fontSize: 9.5, color: '#555', marginTop: 1 },
  // Invoice meta (right-aligned)
  invoiceMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  invoiceMetaLeft: {},
  invoiceMetaRight: { alignItems: 'flex-end' },
  invoiceNoLabel: { fontSize: 9, color: '#888', fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase' },
  invoiceNoValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginTop: 2 },
  dateLabel: { fontSize: 9, color: '#888', marginTop: 8 },
  dateValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  // Billing section — 3 columns
  billingRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  billingCol: { flex: 1 },
  colLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: '#d0e8d8', paddingBottom: 3 },
  colName: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  colText: { fontSize: 9, color: '#444', lineHeight: 1.5 },
  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#2D6A4F',
    paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3,
  },
  tableHeaderCell: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#e8f5e9',
  },
  tableRowAlt: { backgroundColor: '#f9fdfa' },
  tableCell: { fontSize: 9.5, color: '#333' },
  colNo: { width: 28 },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'center' },
  colUnitPrice: { width: 75, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  // Totals
  totalsSection: { alignItems: 'flex-end', marginBottom: 16 },
  totalRow: { flexDirection: 'row', width: 240, marginBottom: 4 },
  totalLabel: { flex: 1, fontSize: 9.5, color: '#555', textAlign: 'right', paddingRight: 8 },
  totalValue: { width: 90, fontSize: 9.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  grandTotalRow: {
    flexDirection: 'row', width: 240,
    backgroundColor: '#2D6A4F', padding: 7, borderRadius: 4, marginTop: 4,
  },
  grandTotalLabel: { flex: 1, fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right', paddingRight: 8 },
  grandTotalValue: { width: 90, fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right' },
  // Amount in words
  amountWords: {
    fontSize: 10, fontFamily: 'Helvetica-BoldOblique', color: '#2D6A4F',
    marginBottom: 24, textAlign: 'left',
    borderLeftWidth: 3, borderLeftColor: '#2D6A4F',
    paddingLeft: 10, paddingVertical: 4,
  },
  // Footer / signature
  signatureSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee',
  },
  thankYou: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2D6A4F' },
  signatureBox: { alignItems: 'flex-end' },
  signatureLine: { width: 140, borderBottomWidth: 1, borderBottomColor: '#666', marginBottom: 4 },
  signatureLabel: { fontSize: 8.5, color: '#888' },
  // Notes
  notesSection: { marginBottom: 16 },
  notesLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  notesText: { fontSize: 9, color: '#555', lineHeight: 1.5 },
  // Page footer
  pageFtr: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    borderTopWidth: 0.5, borderTopColor: '#ddd',
    paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between',
  },
  pageFtrText: { fontSize: 8, color: '#aaa' },
})

export default function B2BInvoicePDF({ invoice, settings }) {
  const s = settings || {}
  const snap = invoice.customer_snapshot || {}
  const items = invoice.items || []

  const senderName = s.business_owner || s.business_name || 'Your Business'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sender Header */}
        <View style={styles.header}>
          <Text style={styles.senderName}>{senderName}</Text>
          {s.city && <Text style={styles.senderCity}>{s.city}</Text>}
          {s.phone && <Text style={styles.senderLine}>Phone: {s.phone}</Text>}
          {s.pan && <Text style={styles.senderLine}>PAN: {s.pan}</Text>}
          {s.gstin && <Text style={styles.senderLine}>GSTIN: {s.gstin}</Text>}
        </View>

        {/* Invoice Meta */}
        <View style={styles.invoiceMeta}>
          <View style={styles.invoiceMetaLeft}>
            {snap.company_name && (
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{snap.company_name}</Text>
            )}
          </View>
          <View style={styles.invoiceMetaRight}>
            <Text style={styles.invoiceNoLabel}>Invoice No.</Text>
            <Text style={styles.invoiceNoValue}>{invoice.invoice_number}</Text>
            <Text style={styles.dateLabel}>Date: {formatDateShort(invoice.invoice_date)}</Text>
          </View>
        </View>

        {/* Bill To / Ship To / Instructions */}
        <View style={styles.billingRow}>
          <View style={styles.billingCol}>
            <Text style={styles.colLabel}>Bill To</Text>
            {snap.name && <Text style={styles.colName}>{snap.name}</Text>}
            {snap.company_name && <Text style={[styles.colText, { fontFamily: 'Helvetica-Bold' }]}>{snap.company_name}</Text>}
            {snap.billing_address && <Text style={styles.colText}>{snap.billing_address}</Text>}
            {snap.phone && <Text style={styles.colText}>{snap.phone}</Text>}
          </View>
          <View style={styles.billingCol}>
            <Text style={styles.colLabel}>Ship To</Text>
            {snap.shipping_name && <Text style={styles.colName}>{snap.shipping_name}</Text>}
            {snap.shipping_address && <Text style={styles.colText}>{snap.shipping_address}</Text>}
            {snap.shipping_phone && <Text style={styles.colText}>{snap.shipping_phone}</Text>}
          </View>
          <View style={styles.billingCol}>
            <Text style={styles.colLabel}>Instructions</Text>
            {invoice.notes && <Text style={styles.colText}>{invoice.notes}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>Sl.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty, { textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice, { textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal, { textAlign: 'right' }]}>Total</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.colNo]}>{idx + 1}</Text>
              <View style={styles.colDesc}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{item.name}</Text>
                {item.description ? <Text style={[styles.tableCell, { color: '#888', fontSize: 8 }]}>{item.description}</Text> : null}
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.qty !== undefined && item.qty !== '-' ? item.qty : '-'}</Text>
              <Text style={[styles.tableCell, styles.colUnitPrice]}>{item.unit_price ? formatCurrency(item.unit_price) : '-'}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SUBTOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}/-</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SHIPPING &amp; HANDLING</Text>
            <Text style={styles.totalValue}>{invoice.shipping > 0 ? formatCurrency(invoice.shipping) : '0'}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL DUE</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}/-</Text>
          </View>
        </View>

        {/* Amount in words */}
        <Text style={styles.amountWords}>{numberToWords(invoice.total)}</Text>

        {/* Signature & Thank You */}
        <View style={styles.signatureSection}>
          <Text style={styles.thankYou}>Thank you for your business!</Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Page footer */}
        <View style={styles.pageFtr} fixed>
          <Text style={styles.pageFtrText}>Invoice #{invoice.invoice_number}</Text>
          <Text style={styles.pageFtrText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
