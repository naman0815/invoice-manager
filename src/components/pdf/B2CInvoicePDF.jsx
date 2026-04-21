import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatCurrency, formatDateLong, formatDateShort } from '../../lib/helpers'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2D6A4F',
  },
  senderBlock: { flexDirection: 'column', gap: 3 },
  senderName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2D6A4F' },
  senderSub: { fontSize: 10, color: '#555' },
  invoiceBlock: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginBottom: 6 },
  invoiceMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 3, alignItems: 'flex-start' },
  invoiceMetaLabel: { fontSize: 9, color: '#888', width: 80, textAlign: 'right' },
  invoiceMetaValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  // Bill to
  billingSection: { flexDirection: 'row', marginBottom: 24, gap: 20 },
  billingBlock: { flex: 1 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  billName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  billText: { fontSize: 9.5, color: '#333', lineHeight: 1.5 },
  // Amount due box
  amountDueBox: {
    backgroundColor: '#f0f7f4',
    borderWidth: 1,
    borderColor: '#2D6A4F',
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDueLabel: { fontSize: 9, color: '#555' },
  amountDueValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2D6A4F' },
  // Table
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D6A4F',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  tableHeaderCell: { color: '#ffffff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e9',
  },
  tableRowAlt: { backgroundColor: '#f9fdfa' },
  tableCell: { fontSize: 9.5, color: '#333' },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'center' },
  colPrice: { width: 70, textAlign: 'right' },
  colAmount: { width: 80, textAlign: 'right' },
  // Totals
  totalsSection: { alignItems: 'flex-end', marginBottom: 24 },
  totalRow: { flexDirection: 'row', gap: 8, marginBottom: 4, width: 220 },
  totalLabel: { flex: 1, fontSize: 9.5, color: '#555', textAlign: 'right' },
  totalValue: { width: 90, fontSize: 9.5, textAlign: 'right' },
  grandTotalRow: {
    flexDirection: 'row', gap: 8, width: 220,
    backgroundColor: '#2D6A4F', paddingVertical: 7, paddingHorizontal: 8,
    borderRadius: 4, marginTop: 4
  },
  grandTotalLabel: { flex: 1, fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right' },
  grandTotalValue: { width: 90, fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right' },
  // Notes
  notesSection: {
    borderTopWidth: 1, borderTopColor: '#d0e8d8',
    paddingTop: 14, marginTop: 4
  },
  notesTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  notesText: { fontSize: 9, color: '#444', lineHeight: 1.6 },
  noteItem: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  noteNum: { fontSize: 9, color: '#2D6A4F', fontFamily: 'Helvetica-Bold' },
  // Footer
  footer: {
    position: 'absolute', bottom: 30, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: '#eee',
    paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#999' },
})

export default function B2CInvoicePDF({ invoice, settings }) {
  const s = settings || {}
  const snap = invoice.customer_snapshot || {}
  const items = invoice.items || []
  const totalLines = items.length

  const senderName = s.business_owner || s.business_name || 'Your Business'
  const senderSub = s.business_name || ''
  const senderAddress = [s.city, s.state].filter(Boolean).join(', ') || ''
  const senderPhone = s.phone || ''

  const defaultNotes = [
    s.gpay && `Payment Details: Google Pay: ${s.gpay}`,
    (s.bank_account && s.bank_name) && `Bank Account: ${s.bank_name} | Account: ${s.bank_account} | IFSC: ${s.bank_ifsc || ''}`,
  ].filter(Boolean)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.senderBlock}>
            <Text style={styles.senderName}>{senderName}</Text>
            {senderSub && <Text style={styles.senderSub}>{senderSub}</Text>}
            {senderAddress && <Text style={styles.senderSub}>{senderAddress}</Text>}
            {s.address && <Text style={styles.senderSub}>{s.address}</Text>}
            {senderPhone && <Text style={styles.senderSub}>{senderPhone}</Text>}
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice Number:</Text>
              <Text style={styles.invoiceMetaValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice Date:</Text>
              <Text style={styles.invoiceMetaValue}>{formatDateLong(invoice.invoice_date)}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Payment Due:</Text>
              <Text style={styles.invoiceMetaValue}>{formatDateLong(invoice.payment_due || invoice.invoice_date)}</Text>
            </View>
          </View>
        </View>

        {/* Amount Due Highlight */}
        <View style={styles.amountDueBox}>
          <View>
            <Text style={styles.amountDueLabel}>Amount Due (INR)</Text>
          </View>
          <Text style={styles.amountDueValue}>{formatCurrency(invoice.total)}</Text>
        </View>

        {/* Bill To */}
        <View style={styles.billingSection}>
          <View style={styles.billingBlock}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.billName}>{snap.name}</Text>
            {snap.company_name ? <Text style={styles.billText}>{snap.company_name}</Text> : null}
            {snap.billing_address ? <Text style={styles.billText}>{snap.billing_address}</Text> : null}
            {snap.phone ? <Text style={styles.billText}>{snap.phone}</Text> : null}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Items</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty, { textAlign: 'center' }]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice, { textAlign: 'right' }]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount, { textAlign: 'right' }]}>Amount</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <View style={styles.colDesc}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{item.name}</Text>
                {item.description ? <Text style={[styles.tableCell, { color: '#888', fontSize: 8 }]}>{item.description}</Text> : null}
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
          {/* Shipping row */}
          {invoice.shipping > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDesc]}>Shipping and handling</Text>
              <Text style={[styles.tableCell, styles.colQty]}>1</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(invoice.shipping)}</Text>
              <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(invoice.shipping)}</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 6 }]}>
            <Text style={[styles.totalLabel, { fontFamily: 'Helvetica-Bold', color: '#222' }]}>Amount Due (INR):</Text>
            <Text style={[styles.totalValue, { fontFamily: 'Helvetica-Bold', color: '#222' }]}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {(invoice.notes || defaultNotes.length > 0) && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes / Terms</Text>
            {defaultNotes.map((line, i) => (
              <Text key={i} style={[styles.notesText, { marginBottom: 3 }]}>{line}</Text>
            ))}
            {invoice.notes && (
              <Text style={[styles.notesText, { marginTop: 6 }]}>{invoice.notes}</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Invoice #{invoice.invoice_number}</Text>
          <Text style={styles.footerText}>{senderName}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
