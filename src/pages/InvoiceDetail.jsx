import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Trash2, Check } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { supabase } from '../lib/supabase'
import { useInvoices } from '../hooks/useInvoices'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'
import { formatCurrency, formatDateLong, formatDateShort } from '../lib/helpers'
import B2CInvoicePDF from '../components/pdf/B2CInvoicePDF.jsx'
import B2BInvoicePDF from '../components/pdf/B2BInvoicePDF.jsx'

const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'cancelled']

function StatusBadge({ status }) {
  const map = {
    draft: ['badge-muted', 'Draft'],
    sent: ['badge-info', 'Sent'],
    paid: ['badge-success', 'Paid'],
    cancelled: ['badge-danger', 'Cancelled'],
  }
  const [cls, label] = map[status] || ['badge-muted', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { update, remove } = useInvoices()
  const { settings } = useSettings()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    supabase.from('invoices').select('*').eq('id', id).single().then(({ data }) => {
      setInvoice(data)
      setLoading(false)
    })
  }, [id])

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    const { error } = await update(id, { status: newStatus })
    if (!error) {
      setInvoice(prev => ({ ...prev, status: newStatus }))
      toast.success(`Status updated to ${newStatus}`)
    } else {
      toast.error('Failed to update status')
    }
    setUpdatingStatus(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    await remove(id)
    toast.success('Invoice deleted')
    navigate('/invoices')
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!invoice) return <div className="page-body"><p className="text-secondary">Invoice not found.</p></div>

  const snap = invoice.customer_snapshot || {}
  const items = invoice.items || []
  const PDFComponent = invoice.invoice_type === 'B2B' ? B2BInvoicePDF : B2CInvoicePDF

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'var(--font-size-lg)' }}>Invoice #{invoice.invoice_number}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <StatusBadge status={invoice.status} />
            <span className={`badge badge-${invoice.invoice_type === 'B2B' ? 'primary' : 'info'}`} style={{ fontSize: 9 }}>
              {invoice.invoice_type}
            </span>
          </div>
        </div>
        <PDFDownloadLink
          document={<PDFComponent invoice={invoice} settings={settings} />}
          fileName={`Invoice-${invoice.invoice_number}-${invoice.invoice_type}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading: pdfLoading }) => (
            <button className="btn btn-accent btn-sm" disabled={pdfLoading}>
              <Download size={16} /> {pdfLoading ? 'PDF…' : 'PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="page-body">
        {/* Customer */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <p className="form-label" style={{ marginBottom: 'var(--space-3)' }}>👤 Customer</p>
          <p className="font-semibold">{snap.name}</p>
          {snap.company_name && <p className="text-secondary text-sm">{snap.company_name}</p>}
          {snap.phone && <p className="text-secondary text-sm">{snap.phone}</p>}
          {snap.billing_address && <p className="text-secondary text-sm" style={{ marginTop: 4 }}>{snap.billing_address}</p>}
          {snap.shipping_address && snap.shipping_address !== snap.billing_address && (
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
              <p className="form-label">📦 Shipping</p>
              <p className="text-secondary text-sm">{snap.shipping_name || snap.name}</p>
              <p className="text-secondary text-sm">{snap.shipping_address}</p>
            </div>
          )}
        </div>

        {/* Date & Meta */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <p className="form-label">Invoice Date</p>
              <p className="font-medium">{formatDateLong(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="form-label">Payment Due</p>
              <p className="font-medium">{formatDateLong(invoice.payment_due || invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="form-label">Created</p>
              <p className="font-medium text-secondary text-sm">{formatDateShort(invoice.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <p className="font-semibold">Items</p>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  {invoice.invoice_type === 'B2B' && <th style={{ width: 40 }}>#</th>}
                  <th>Description</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    {invoice.invoice_type === 'B2B' && <td className="text-secondary">{idx + 1}</td>}
                    <td>
                      <div className="font-medium">{item.name}</div>
                      {item.description && <div className="text-muted text-xs">{item.description}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
              <span className="text-secondary">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.shipping > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span className="text-secondary">Shipping & Handling</span>
                <span>{formatCurrency(invoice.shipping)}</span>
              </div>
            )}
            <div className="divider" style={{ margin: 'var(--space-2) 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-primary-lighter)' }}>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Status Control */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <p className="form-label" style={{ marginBottom: 'var(--space-3)' }}>Update Status</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className={`btn btn-sm ${invoice.status === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus || invoice.status === s}
                style={{ minHeight: 36 }}
              >
                {invoice.status === s && <Check size={14} />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <p className="form-label" style={{ marginBottom: 'var(--space-2)' }}>Notes</p>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.6 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Delete */}
        <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleDelete}>
          <Trash2 size={16} /> Delete Invoice
        </button>
      </div>
    </>
  )
}
