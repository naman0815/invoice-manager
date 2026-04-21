import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'

const FIELDS = [
  { section: 'Business', fields: [
    { key: 'business_owner', label: 'Owner Name', placeholder: 'e.g. Nisha Bhimaiah' },
    { key: 'business_name', label: 'Business / Brand Name', placeholder: 'e.g. Sterling Gardens' },
    { key: 'address', label: 'Address', placeholder: 'Street, Area', type: 'textarea' },
    { key: 'city', label: 'City', placeholder: 'e.g. Bengaluru' },
    { key: 'phone', label: 'Phone', placeholder: '+91 9980020311', type: 'tel' },
    { key: 'pan', label: 'PAN Number', placeholder: 'XXXXX0000X' },
    { key: 'gstin', label: 'GSTIN (optional)', placeholder: '22XXXXX0000X1Z5' },
  ]},
  { section: 'Payment Details', fields: [
    { key: 'gpay', label: 'Google Pay Number', placeholder: 'Same as phone usually' },
    { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
    { key: 'bank_account', label: 'Account Number', placeholder: '10008184337' },
    { key: 'bank_ifsc', label: 'IFSC Code', placeholder: 'SBIN0013281' },
    { key: 'bank_type', label: 'Account Type', placeholder: 'Savings / Current' },
  ]},
  { section: 'Invoice Numbering', fields: [
    { key: 'invoice_notes', label: 'Default Invoice Notes / Terms', placeholder: 'Any default notes for all invoices…', type: 'textarea' },
  ]},
]

export default function Settings() {
  const { settings, loading, save } = useSettings()
  const toast = useToast()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await save(form)
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Settings saved!')
    setSaving(false)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : <><Save size={16} /> Save</>}
        </button>
      </div>

      <div className="page-body">
        <div className="card card-sm" style={{ marginBottom: 'var(--space-6)', background: 'var(--color-warning-bg)', border: '1px solid rgba(250,176,5,0.25)' }}>
          <p className="text-sm font-medium text-warning">⚙️ These details appear on every invoice PDF</p>
          <p className="text-secondary text-xs" style={{ marginTop: 4 }}>Fill these in before creating your first invoice.</p>
        </div>

        {FIELDS.map(({ section, fields }) => (
          <div key={section} style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-primary-lighter)' }}>
              {section}
            </h2>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {fields.map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      className="form-input form-textarea"
                      value={form[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  ) : (
                    <input
                      className="form-input"
                      type={f.type || 'text'}
                      value={form[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : <><Save size={18} /> Save All Settings</>}
        </button>
      </div>
    </>
  )
}
