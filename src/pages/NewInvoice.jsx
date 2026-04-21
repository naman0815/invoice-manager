import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, User, Package, Eye, Download } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { useCustomers } from '../hooks/useCustomers'
import { useInventory } from '../hooks/useInventory'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'
import { todayISO, generateB2CInvoiceNumber, generateB2BInvoiceNumber } from '../lib/helpers'
import StepCustomer from '../components/invoice/StepCustomer.jsx'
import StepItems from '../components/invoice/StepItems.jsx'
import StepReview from '../components/invoice/StepReview.jsx'

const STEPS = [
  { label: 'Customer', icon: User },
  { label: 'Items', icon: Package },
  { label: 'Review', icon: Eye },
]

const emptyCustomer = {
  id: null,
  name: '',
  company_name: '',
  phone: '',
  billing_address: '',
  sameShipping: true,
  shipping_name: '',
  shipping_phone: '',
  shipping_address: '',
}

export default function NewInvoice() {
  const navigate = useNavigate()
  const toast = useToast()
  const { create, getNextB2CSeq, getNextB2BSeq } = useInvoices()
  const { customers, create: createCustomer } = useCustomers()
  const { items: inventoryItems, create: createItem } = useInventory()
  const { settings } = useSettings()

  const [step, setStep] = useState(0)
  const [customer, setCustomer] = useState(emptyCustomer)
  const [lineItems, setLineItems] = useState([])
  const [shipping, setShipping] = useState(0)
  const [notes, setNotes] = useState('')
  const [invoiceType, setInvoiceType] = useState('B2C')
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [b2bSeqOverride, setB2bSeqOverride] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedInvoice, setSavedInvoice] = useState(null)

  const subtotal = lineItems.reduce((sum, i) => sum + (i.qty * i.unit_price), 0)
  const total = subtotal + Number(shipping || 0)

  const canNext = () => {
    if (step === 0) return customer.name.trim().length > 0
    if (step === 1) return lineItems.length > 0
    return true
  }

  const handleSave = async (status = 'draft') => {
    setSaving(true)
    try {
      const now = new Date(invoiceDate)
      let invoiceNumber

      if (invoiceType === 'B2C') {
        const seq = await getNextB2CSeq(now)
        invoiceNumber = generateB2CInvoiceNumber(seq, now)
      } else {
        const seq = b2bSeqOverride || await getNextB2BSeq(now)
        invoiceNumber = generateB2BInvoiceNumber(seq, now)
      }

      const customerSnapshot = {
        id: customer.id,
        name: customer.name,
        company_name: customer.company_name,
        phone: customer.phone,
        billing_address: customer.billing_address,
        shipping_name: customer.sameShipping ? customer.name : customer.shipping_name,
        shipping_phone: customer.sameShipping ? customer.phone : customer.shipping_phone,
        shipping_address: customer.sameShipping ? customer.billing_address : customer.shipping_address,
      }

      const payload = {
        invoice_number: invoiceNumber,
        invoice_type: invoiceType,
        invoice_date: invoiceDate,
        payment_due: invoiceDate,
        customer_id: customer.id || null,
        customer_snapshot: customerSnapshot,
        items: lineItems.map(i => ({
          id: i.id,
          name: i.name,
          description: i.description || '',
          qty: Number(i.qty),
          unit: i.unit || 'pcs',
          unit_price: Number(i.unit_price),
          total: Number(i.qty) * Number(i.unit_price),
        })),
        subtotal,
        shipping: Number(shipping || 0),
        total,
        notes,
        status,
      }

      const { data, error } = await create(payload)
      if (error) {
        toast.error('Failed to save: ' + error.message)
        return
      }
      setSavedInvoice(data)
      toast.success('Invoice saved!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ flex: 1 }}>New Invoice</h1>
      </div>

      <div className="page-body">
        {/* Steps Bar */}
        <div className="steps-bar">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className={`step-item ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => i < step && setStep(i)}
              style={{ cursor: i < step ? 'pointer' : 'default' }}
            >
              <div className="step-dot">
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && (
          <StepCustomer
            customer={customer}
            setCustomer={setCustomer}
            customers={customers}
            createCustomer={createCustomer}
          />
        )}
        {step === 1 && (
          <StepItems
            lineItems={lineItems}
            setLineItems={setLineItems}
            shipping={shipping}
            setShipping={setShipping}
            inventoryItems={inventoryItems}
            createItem={createItem}
          />
        )}
        {step === 2 && (
          <StepReview
            customer={customer}
            lineItems={lineItems}
            shipping={shipping}
            subtotal={subtotal}
            total={total}
            notes={notes}
            setNotes={setNotes}
            invoiceType={invoiceType}
            setInvoiceType={setInvoiceType}
            invoiceDate={invoiceDate}
            setInvoiceDate={setInvoiceDate}
            b2bSeqOverride={b2bSeqOverride}
            setB2bSeqOverride={setB2bSeqOverride}
            savedInvoice={savedInvoice}
            onSave={handleSave}
            saving={saving}
            settings={settings}
          />
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 'var(--space-8)', gap: 'var(--space-3)'
        }}>
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
            >
              Next <ArrowRight size={18} />
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}
