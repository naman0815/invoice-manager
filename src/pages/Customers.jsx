import { useState, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Upload, Users } from 'lucide-react'
import Papa from 'papaparse'
import { useCustomers } from '../hooks/useCustomers'
import { useToast } from '../hooks/useToast'
import { getInitials } from '../lib/helpers'

const emptyCustomer = {
  name: '', company_name: '', phone: '',
  billing_address: '', shipping_address: ''
}

function CustomerModal({ customer, onSave, onClose, saving }) {
  const [form, setForm] = useState(customer || emptyCustomer)
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">{customer ? 'Edit Customer' : 'Add Customer'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Billing Address</label>
              <textarea className="form-input form-textarea" value={form.billing_address} onChange={e => setForm(f => ({ ...f, billing_address: e.target.value }))} placeholder="Street, City, State, PIN" rows={3} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Shipping Address (if different)</label>
              <textarea className="form-input form-textarea" value={form.shipping_address} onChange={e => setForm(f => ({ ...f, shipping_address: e.target.value }))} placeholder="Leave blank if same as billing" rows={2} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : <><Check size={16} /> Save</>}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerDetailsModal({ customer, onClose, onEdit }) {
  if (!customer) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Customer Details</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div className="text-secondary text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</div>
            <div className="font-medium" style={{ fontSize: 'var(--font-size-lg)' }}>{customer.name}</div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {customer.company_name && (
              <div>
                <div className="text-secondary text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</div>
                <div>{customer.company_name}</div>
              </div>
            )}
            {customer.phone && (
              <div>
                <div className="text-secondary text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div>
                <div>{customer.phone}</div>
              </div>
            )}
          </div>

          {customer.billing_address && (
            <div>
              <div className="text-secondary text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Billing Address</div>
              <div style={{ whiteSpace: 'pre-line', padding: 'var(--space-2)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                {customer.billing_address}
              </div>
            </div>
          )}
          {customer.shipping_address && (
            <div>
              <div className="text-secondary text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipping Address</div>
              <div style={{ whiteSpace: 'pre-line', padding: 'var(--space-2)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                {customer.shipping_address}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onClose(); onEdit(); }}>
              <Pencil size={16} /> Edit Customer
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const { customers, loading, create, update, remove, bulkImport } = useCustomers()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const importRef = useRef()
  const jsonRef = useRef()


  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q) || c.phone?.includes(q)
  })

  const handleSave = async (form) => {
    setSaving(true)
    let error
    if (modal.mode === 'new') {
      ;({ error } = await create(form))
    } else {
      ;({ error } = await update(modal.customer.id, form))
    }
    if (error) toast.error('Error: ' + error.message)
    else { toast.success('Saved!'); setModal(null) }
    setSaving(false)
  }

  const handleDelete = async (customer) => {
    if (!confirm(`Delete "${customer.name}"?`)) return
    const { error } = await remove(customer.id)
    if (error) toast.error('Failed to delete')
    else toast.success('Deleted')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async ({ data }) => {
        const rows = data.map(r => ({
          name: r.name || r.Name || '',
          company_name: r.company_name || r.company || r.Company || '',
          phone: r.phone || r.Phone || r.mobile || '',
          billing_address: r.billing_address || r.address || r.Address || '',
          shipping_address: r.shipping_address || '',
        })).filter(r => r.name)
        const { error } = await bulkImport(rows)
        if (error) toast.error('Import failed: ' + error.message)
        else toast.success(`Imported ${rows.length} customers`)
        e.target.value = ''
      }
    })
  }

  const handleJsonImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result)
        const { importCustomersFromJSON } = await import('../lib/importers')
        const rows = importCustomersFromJSON(json)
        if (rows.length === 0) {
          toast.error('No customers found in JSON')
          return
        }
        const { error } = await bulkImport(rows)
        if (error) toast.error('Import failed: ' + error.message)
        else toast.success(`Imported ${rows.length} customers from JSON`)
      } catch (err) {
        toast.error('Invalid JSON file')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }


  return (
    <>
      <div className="page-header">
        <h1>Customers</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> CSV
          </button>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          
          <button className="btn btn-ghost btn-sm" onClick={() => jsonRef.current?.click()}>
            <Upload size={16} /> JSON
          </button>
          <input ref={jsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonImport} />

          <button className="btn btn-accent btn-sm" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={16} /> Add
          </button>
        </div>

      </div>

      <div className="page-body">
        <div className="search-bar" style={{ marginBottom: 'var(--space-5)', position: 'relative' }}>
          <Search size={18} className="search-icon" />
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" />
        </div>

        {/* CSV hint */}
        <div className="card card-sm" style={{ marginBottom: 'var(--space-5)', background: 'var(--color-info-bg)', border: '1px solid rgba(77,171,247,0.2)' }}>
          <p className="text-sm font-medium text-info">📥 CSV Import Format</p>
          <p className="text-secondary text-xs" style={{ marginTop: 4 }}>
            Columns: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>name, company_name, phone, billing_address</code>
          </p>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <p className="font-medium">No customers yet</p>
            <button className="btn btn-primary" onClick={() => setModal({ mode: 'new' })}>
              <Plus size={16} /> Add First Customer
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer'
              }}
              onClick={() => setModal({ mode: 'view', customer: c })}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--color-primary-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary-lighter)', fontWeight: 700, fontSize: 15, flexShrink: 0
                }}>
                  {getInitials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-medium truncate">{c.name}</div>
                  {c.company_name && <div className="text-secondary text-xs truncate">{c.company_name}</div>}
                  {c.phone && <div className="text-muted text-xs">{c.phone}</div>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', customer: c }) }} style={{ minHeight: 36, minWidth: 36 }}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(c) }} style={{ minHeight: 36, minWidth: 36 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal?.mode === 'view' ? (
        <CustomerDetailsModal
          customer={modal.customer}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ mode: 'edit', customer: modal.customer })}
        />
      ) : modal && (
        <CustomerModal
          customer={modal.mode === 'edit' ? modal.customer : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </>
  )
}
