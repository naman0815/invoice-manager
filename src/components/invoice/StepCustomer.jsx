import { useState, useRef } from 'react'
import { Search, Plus, X, User, ChevronDown } from 'lucide-react'
import { getInitials } from '../../lib/helpers'

function CustomerForm({ data, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Customer name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Company (optional)</label>
          <input
            className="form-input"
            value={data.company_name}
            onChange={e => onChange({ company_name: e.target.value })}
            placeholder="Company / Firm"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile (optional)</label>
          <input
            className="form-input"
            type="tel"
            value={data.phone}
            onChange={e => onChange({ phone: e.target.value })}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Billing Address (optional)</label>
          <textarea
            className="form-input form-textarea"
            value={data.billing_address}
            onChange={e => onChange({ billing_address: e.target.value })}
            placeholder="Street, City, State, PIN"
            rows={3}
          />
        </div>
      </div>

      {/* Same shipping checkbox */}
      <div className="form-checkbox-row card card-sm" style={{ marginBottom: 0 }}>
        <input
          id="same-shipping"
          type="checkbox"
          className="form-checkbox"
          checked={data.sameShipping}
          onChange={e => onChange({ sameShipping: e.target.checked })}
        />
        <label htmlFor="same-shipping" style={{ cursor: 'pointer', flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
          Shipping address same as billing
        </label>
      </div>

      {!data.sameShipping && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <p className="text-secondary text-sm font-medium" style={{ marginBottom: 'var(--space-3)' }}>
              📦 Shipping Details
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Shipping Name</label>
            <input
              className="form-input"
              value={data.shipping_name}
              onChange={e => onChange({ shipping_name: e.target.value })}
              placeholder="Name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Shipping Phone</label>
            <input
              className="form-input"
              type="tel"
              value={data.shipping_phone}
              onChange={e => onChange({ shipping_phone: e.target.value })}
              placeholder="Mobile"
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Shipping Address</label>
            <textarea
              className="form-input form-textarea"
              value={data.shipping_address}
              onChange={e => onChange({ shipping_address: e.target.value })}
              placeholder="Shipping address"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function StepCustomer({ customer, setCustomer, customers, createCustomer }) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [mode, setMode] = useState('search') // 'search' | 'new' | 'selected'
  const [saving, setSaving] = useState(false)
  const inputRef = useRef()

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q) || c.phone?.includes(q)
  }).slice(0, 10)

  const selectCustomer = (c) => {
    setCustomer({
      id: c.id,
      name: c.name || '',
      company_name: c.company_name || '',
      phone: c.phone || '',
      billing_address: c.billing_address || '',
      sameShipping: true,
      shipping_name: c.shipping_name || '',
      shipping_phone: c.shipping_phone || '',
      shipping_address: c.shipping_address || '',
    })
    setMode('selected')
    setShowDropdown(false)
    setSearch('')
  }

  const startNew = () => {
    setCustomer({ id: null, name: search, company_name: '', phone: '', billing_address: '', sameShipping: true, shipping_name: '', shipping_phone: '', shipping_address: '' })
    setMode('new')
    setShowDropdown(false)
  }

  const saveNew = async () => {
    setSaving(true)
    const { data, error } = await createCustomer({
      name: customer.name,
      company_name: customer.company_name,
      phone: customer.phone,
      billing_address: customer.billing_address,
      shipping_address: customer.sameShipping ? customer.billing_address : customer.shipping_address,
      shipping_name: customer.sameShipping ? customer.name : customer.shipping_name,
      shipping_phone: customer.sameShipping ? customer.phone : customer.shipping_phone,
    })
    if (!error && data) {
      setCustomer(prev => ({ ...prev, id: data.id }))
      setMode('selected')
    }
    setSaving(false)
  }

  const reset = () => {
    setCustomer({ id: null, name: '', company_name: '', phone: '', billing_address: '', sameShipping: true, shipping_name: '', shipping_phone: '', shipping_address: '' })
    setMode('search')
    setSearch('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 4 }}>Who's this invoice for?</h2>
        <p className="text-secondary text-sm">Search an existing customer or create a new one</p>
      </div>

      {mode === 'search' && (
        <div style={{ position: 'relative' }}>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              ref={inputRef}
              className="form-input"
              placeholder="Search customer by name, company or phone…"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              autoFocus
            />
          </div>

          {showDropdown && (
            <div className="search-dropdown">
              {filtered.map(c => (
                <div key={c.id} className="search-dropdown-item" onClick={() => selectCustomer(c)}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-primary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-primary-lighter)', fontWeight: 700, fontSize: 13, flexShrink: 0
                  }}>
                    {getInitials(c.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-medium truncate">{c.name}</div>
                    {c.company_name && <div className="text-secondary text-xs truncate">{c.company_name}</div>}
                    {c.phone && <div className="text-muted text-xs">{c.phone}</div>}
                  </div>
                </div>
              ))}
              <div
                className="search-dropdown-item"
                onClick={startNew}
                style={{ color: 'var(--color-accent)', fontWeight: 600 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--color-accent-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Plus size={18} color="var(--color-accent)" />
                </div>
                <span>Create new customer{search ? ` "${search}"` : ''}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'selected' && (
        <div className="card" style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={reset}
            style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}
          >
            <X size={14} /> Change
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-primary-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary-lighter)', fontWeight: 700, fontSize: 18,
            }}>
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="font-semibold">{customer.name}</div>
              {customer.company_name && <div className="text-secondary text-sm">{customer.company_name}</div>}
            </div>
          </div>
          <CustomerForm data={customer} onChange={u => setCustomer(prev => ({ ...prev, ...u }))} />
        </div>
      )}

      {mode === 'new' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h3 className="font-semibold">New Customer</h3>
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              <X size={14} /> Cancel
            </button>
          </div>
          <CustomerForm data={customer} onChange={u => setCustomer(prev => ({ ...prev, ...u }))} />
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-primary"
              onClick={saveNew}
              disabled={saving || !customer.name.trim()}
            >
              {saving ? 'Saving…' : '✓ Save & Use'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setMode('selected') }}>
              Use without saving
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
