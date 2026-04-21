import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Save, Check } from 'lucide-react'
import B2CInvoicePDF from '../pdf/B2CInvoicePDF.jsx'
import B2BInvoicePDF from '../pdf/B2BInvoicePDF.jsx'
import { formatCurrency, formatDateShort, formatDateLong } from '../../lib/helpers'

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
      <span className="text-secondary text-sm" style={{ width: 120, flexShrink: 0 }}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default function StepReview({
  customer, lineItems, shipping, subtotal, total,
  notes, setNotes,
  invoiceType, setInvoiceType,
  invoiceDate, setInvoiceDate,
  b2bSeqOverride, setB2bSeqOverride,
  savedInvoice, onSave, saving, settings,
}) {
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved

  const handleSave = async (status) => {
    setSaveStatus('saving')
    await onSave(status)
    setSaveStatus('saved')
  }

  // Build a preview invoice object for the PDF
  const previewInvoice = {
    invoice_number: savedInvoice?.invoice_number || '—',
    invoice_type: invoiceType,
    invoice_date: invoiceDate,
    payment_due: invoiceDate,
    customer_snapshot: {
      name: customer.name,
      company_name: customer.company_name,
      phone: customer.phone,
      billing_address: customer.billing_address,
      shipping_name: customer.sameShipping ? customer.name : customer.shipping_name,
      shipping_phone: customer.sameShipping ? customer.phone : customer.shipping_phone,
      shipping_address: customer.sameShipping ? customer.billing_address : customer.shipping_address,
    },
    items: lineItems.map(i => ({
      name: i.name,
      description: i.description,
      qty: Number(i.qty),
      unit_price: Number(i.unit_price),
      total: Number(i.qty) * Number(i.unit_price),
    })),
    subtotal,
    shipping: Number(shipping || 0),
    total,
    notes,
    status: savedInvoice?.status || 'draft',
  }

  const PDFComponent = invoiceType === 'B2B' ? B2BInvoicePDF : B2CInvoicePDF
  const canDownload = !!savedInvoice

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 4 }}>Review & Generate</h2>
        <p className="text-secondary text-sm">Choose invoice type and download</p>
      </div>

      {/* Invoice Type Toggle */}
      <div>
        <p className="form-label" style={{ marginBottom: 'var(--space-2)' }}>Invoice Type</p>
        <div className="type-toggle">
          <button className={`type-toggle-btn ${invoiceType === 'B2C' ? 'active' : ''}`} onClick={() => setInvoiceType('B2C')}>
            B2C Retail
          </button>
          <button className={`type-toggle-btn ${invoiceType === 'B2B' ? 'active' : ''}`} onClick={() => setInvoiceType('B2B')}>
            B2B Business
          </button>
        </div>
        <p className="text-muted text-xs" style={{ marginTop: 'var(--space-2)' }}>
          {invoiceType === 'B2B'
            ? 'Business format with Sl. No., Ship To, and Authorized Signatory'
            : 'Retail format with itemized pricing and payment details'}
        </p>
      </div>

      {/* Invoice Date */}
      <div className="form-group">
        <label className="form-label">Invoice Date</label>
        <input
          className="form-input"
          type="date"
          value={invoiceDate}
          onChange={e => setInvoiceDate(e.target.value)}
        />
      </div>

      {/* B2B sequence override */}
      {invoiceType === 'B2B' && (
        <div className="form-group">
          <label className="form-label">Invoice Sequence (B2B)</label>
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="Auto (next in sequence)"
            value={b2bSeqOverride}
            onChange={e => setB2bSeqOverride(e.target.value)}
          />
          <span className="text-muted text-xs">Will generate format: YY/NN e.g. 26/03. Leave blank for auto.</span>
        </div>
      )}

      {/* Summary */}
      <div className="card">
        <p className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>📋 Summary</p>
        <ReviewRow label="Customer" value={customer.name} />
        {customer.company_name && <ReviewRow label="Company" value={customer.company_name} />}
        {customer.phone && <ReviewRow label="Phone" value={customer.phone} />}
        {customer.billing_address && <ReviewRow label="Address" value={customer.billing_address} />}
        <div className="divider" />
        <ReviewRow label="Items" value={`${lineItems.length} item${lineItems.length !== 1 ? 's' : ''}`} />
        <ReviewRow label="Subtotal" value={formatCurrency(subtotal)} />
        {Number(shipping) > 0 && <ReviewRow label="Shipping" value={formatCurrency(Number(shipping))} />}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <span className="text-secondary text-sm" style={{ width: 120, flexShrink: 0, fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary-lighter)' }}>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Notes / Instructions (optional)</label>
        <textarea
          className="form-input form-textarea"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Payment instructions, delivery notes, terms…"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {!savedInvoice ? (
          <>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => handleSave('draft')}
              disabled={saving || saveStatus === 'saved'}
            >
              {saving
                ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Saving…</>
                : saveStatus === 'saved'
                ? <><Check size={18} /> Saved!</>
                : <><Save size={18} /> Save Invoice</>}
            </button>
            <p className="text-muted text-xs text-center">Save first to enable PDF download</p>
          </>
        ) : (
          <>
            <div className="card" style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(64,192,87,0.3)' }}>
              <p className="text-success font-medium text-sm">
                ✅ Invoice #{savedInvoice.invoice_number} saved as {savedInvoice.status}
              </p>
            </div>

            <PDFDownloadLink
              document={<PDFComponent invoice={previewInvoice} settings={settings} />}
              fileName={`Invoice-${previewInvoice.invoice_number}-${invoiceType}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ blob, url, loading, error }) => (
                <button className="btn btn-accent btn-lg" disabled={loading} style={{ width: '100%' }}>
                  {loading
                    ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Generating PDF…</>
                    : <><Download size={18} /> Download {invoiceType} PDF</>}
                </button>
              )}
            </PDFDownloadLink>

            {/* Mark as Paid */}
            {savedInvoice.status !== 'paid' && (
              <button
                className="btn btn-ghost"
                onClick={() => onSave('paid')}
                style={{ width: '100%' }}
              >
                ✓ Mark as Paid
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
