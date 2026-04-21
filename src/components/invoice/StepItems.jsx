import { useState } from 'react'
import { Search, Plus, Trash2, X } from 'lucide-react'
import { formatCurrency } from '../../lib/helpers'

function QuickAddItem({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: '', description: '', unit: 'pcs', last_price: '' })

  return (
    <div className="card" style={{ border: '1px solid var(--color-accent)', marginTop: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h4 className="font-semibold text-accent">Quick Add to Inventory</h4>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Item Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Syngonium Kokedama" />
        </div>
        <div className="form-group">
          <label className="form-label">Unit</label>
          <select className="form-input form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {['pcs', 'kg', 'set', 'sqft', 'hour', 'lot'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Price (₹)</label>
          <input className="form-input" type="number" min="0" value={form.last_price} onChange={e => setForm(f => ({ ...f, last_price: e.target.value }))} placeholder="0" />
        </div>
      </div>
      <button
        className="btn btn-accent"
        style={{ marginTop: 'var(--space-4)', width: '100%' }}
        disabled={!form.name.trim()}
        onClick={() => onAdd({ ...form, last_price: Number(form.last_price) || 0 })}
      >
        <Plus size={16} /> Add to Invoice & Inventory
      </button>
    </div>
  )
}

export default function StepItems({ lineItems, setLineItems, shipping, setShipping, inventoryItems, createItem }) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const filtered = inventoryItems.filter(i => {
    const q = search.toLowerCase()
    return i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
  }).slice(0, 8)

  const addItem = (inv) => {
    const existing = lineItems.find(l => l.id === inv.id)
    if (existing) {
      setLineItems(prev => prev.map(l => l.id === inv.id ? { ...l, qty: l.qty + 1 } : l))
    } else {
      setLineItems(prev => [...prev, {
        id: inv.id, name: inv.name, description: inv.description || '',
        unit: inv.unit || 'pcs', unit_price: inv.last_price || 0, qty: 1
      }])
    }
    setSearch('')
    setShowDropdown(false)
  }

  const handleQuickAdd = async (formData) => {
    const { data, error } = await createItem(formData)
    if (!error && data) {
      addItem({ ...data, last_price: data.last_price || formData.last_price })
    }
    setShowQuickAdd(false)
  }

  const removeItem = (idx) => setLineItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx, field, val) => setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l))

  const subtotal = lineItems.reduce((sum, i) => sum + (Number(i.qty) * Number(i.unit_price)), 0)
  const total = subtotal + Number(shipping || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 4 }}>Add Items</h2>
        <p className="text-secondary text-sm">Search and add products or services</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search inventory…"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
          />
        </div>
        {showDropdown && (
          <div className="search-dropdown">
            {filtered.map(item => (
              <div key={item.id} className="search-dropdown-item" onClick={() => addItem(item)}>
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>🌿</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-medium truncate">{item.name}</div>
                  {item.description && <div className="text-muted text-xs truncate">{item.description}</div>}
                </div>
                <div style={{ flexShrink: 0, fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-lighter)' }}>
                  {item.last_price ? formatCurrency(item.last_price) : 'No price'}
                </div>
              </div>
            ))}
            <div
              className="search-dropdown-item"
              style={{ color: 'var(--color-accent)', fontWeight: 600 }}
              onClick={() => { setShowDropdown(false); setShowQuickAdd(true) }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--color-accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={18} color="var(--color-accent)" />
              </div>
              <span>Quick add{search ? ` "${search}"` : ' new item'} to inventory</span>
            </div>
          </div>
        )}
      </div>

      {showQuickAdd && (
        <QuickAddItem
          onAdd={handleQuickAdd}
          onCancel={() => setShowQuickAdd(false)}
        />
      )}

      {/* Line Items */}
      {lineItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 72px 100px 72px',
            gap: 'var(--space-2)', padding: '0 var(--space-3)',
            fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)'
          }}>
            <span>ITEM</span><span style={{ textAlign: 'center' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>PRICE (₹)</span><span />
          </div>

          {lineItems.map((item, idx) => (
            <div key={idx} className="card card-sm" style={{ display: 'grid', gridTemplateColumns: '1fr 72px 100px 40px', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3)' }}>
              <div style={{ minWidth: 0 }}>
                <div className="font-medium truncate" style={{ fontSize: 'var(--font-size-sm)' }}>{item.name}</div>
                {item.description && <div className="text-muted" style={{ fontSize: 10, truncate: true }}>{item.description}</div>}
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  Total: {formatCurrency(item.qty * item.unit_price)}
                </div>
              </div>
              <input
                className="form-input"
                type="number"
                min="0.01"
                step="0.01"
                value={item.qty}
                onChange={e => updateItem(idx, 'qty', e.target.value)}
                style={{ minHeight: 40, textAlign: 'center', padding: '0.4rem 0.5rem', fontSize: 'var(--font-size-sm)' }}
              />
              <input
                className="form-input"
                type="number"
                min="0"
                value={item.unit_price}
                onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                style={{ minHeight: 40, textAlign: 'right', padding: '0.4rem 0.5rem', fontSize: 'var(--font-size-sm)' }}
              />
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => removeItem(idx)}
                style={{ minHeight: 40, minWidth: 40, padding: 0 }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
          <div className="empty-state-icon"><Search size={24} /></div>
          <p className="text-secondary text-sm">Search above to add items</p>
        </div>
      )}

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
              <span className="text-secondary">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-secondary text-sm">Shipping & Handling</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>₹</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={shipping}
                  onChange={e => setShipping(e.target.value)}
                  style={{ width: 100, minHeight: 36, textAlign: 'right', padding: '0.3rem 0.5rem', fontSize: 'var(--font-size-sm)' }}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="divider" style={{ margin: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-primary-lighter)' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
