import { useState, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Upload, Package } from 'lucide-react'
import Papa from 'papaparse'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../hooks/useToast'
import { formatCurrency } from '../lib/helpers'
import { importInventoryFromJSON } from '../lib/importers'

const emptyItem = { name: '', description: '', unit: 'pcs', last_price: '' }

function ItemModal({ item, onSave, onClose, saving }) {
  const [form, setForm] = useState(item || emptyItem)
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">{item ? 'Edit Item' : 'Add Item'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Syngonium Kokedama" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-input form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {['pcs', 'kg', 'set', 'sqft', 'sqm', 'hour', 'day', 'lot', 'litre'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Last Price (₹)</label>
              <input className="form-input" type="number" min="0" value={form.last_price} onChange={e => setForm(f => ({ ...f, last_price: e.target.value }))} placeholder="0" />
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

export default function Inventory() {
  const { items, loading, create, update, remove, bulkImport } = useInventory()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | {mode: 'new'} | {mode: 'edit', item}
  const [saving, setSaving] = useState(false)
  const importRef = useRef()
  const jsonRef = useRef()

  const handleJsonImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result)
        const mappedItems = importInventoryFromJSON(jsonData)
        
        if (mappedItems.length > 0) {
          const { error } = await bulkImport(mappedItems)
          if (error) throw error
          toast.success(`Imported ${mappedItems.length} items from JSON`)
        } else {
          toast.error('No items found or invalid structure')
        }
      } catch (err) {
        console.error('Import error:', err)
        toast.error('Failed to import JSON: ' + err.message)
      }
      e.target.value = '' // Reset input
    }
    reader.readAsText(file)
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    return i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
  })

  const handleSave = async (form) => {
    setSaving(true)
    const payload = { ...form, last_price: Number(form.last_price) || 0 }
    let error
    if (modal.mode === 'new') {
      ;({ error } = await create(payload))
    } else {
      ;({ error } = await update(modal.item.id, payload))
    }
    if (error) toast.error('Error: ' + error.message)
    else { toast.success('Saved!'); setModal(null) }
    setSaving(false)
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    const { error } = await remove(item.id)
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
          description: r.description || r.Description || '',
          unit: r.unit || r.Unit || 'pcs',
          last_price: Number(r.price || r.last_price || r.Price || 0),
          hsn_code: r.hsn_code || r.HSN || '',
        })).filter(r => r.name)
        const { error } = await bulkImport(rows)
        if (error) toast.error('Import failed: ' + error.message)
        else toast.success(`Imported ${rows.length} items`)
        e.target.value = ''
      }
    })
  }

  return (
    <>
      <div className="page-header">
        <h1>Inventory</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> Import CSV
          </button>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          
          <button className="btn btn-outline btn-sm" onClick={() => jsonRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </button>
          <input ref={jsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonImport} />
          <button className="btn btn-accent btn-sm" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 'var(--space-5)', position: 'relative' }}>
          <Search size={18} className="search-icon" />
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" />
        </div>

        {/* CSV format hint */}
        <div className="card card-sm" style={{ marginBottom: 'var(--space-5)', background: 'var(--color-info-bg)', border: '1px solid rgba(77,171,247,0.2)' }}>
          <p className="text-sm font-medium text-info">📥 CSV Import Format</p>
          <p className="text-secondary text-xs" style={{ marginTop: 4 }}>
            Columns: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>name, description, unit, price, hsn_code</code>
          </p>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="font-medium">No items yet</p>
            <p className="text-secondary text-sm">Add items to use them in invoices</p>
            <button className="btn btn-primary" onClick={() => setModal({ mode: 'new' })}>
              <Plus size={16} /> Add First Item
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0
                }}>🌿</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-secondary text-xs truncate">{item.description || 'No description'}</div>
                  <div className="text-muted text-xs">{item.unit}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-primary-lighter)' }}>
                    {item.last_price ? formatCurrency(item.last_price) : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal({ mode: 'edit', item })} style={{ minHeight: 36, minWidth: 36 }}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(item)} style={{ minHeight: 36, minWidth: 36 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ItemModal
          item={modal.mode === 'edit' ? modal.item : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </>
  )
}
