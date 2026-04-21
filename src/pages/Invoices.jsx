import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Filter, X, Upload } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { useToast } from '../hooks/useToast'
import { formatCurrency, formatDateShort, getInitials } from '../lib/helpers'
import { importTransactionsFromJSON } from '../lib/importers'

export default function Invoices() {
  const { invoices, loading, bulkImport } = useInvoices()
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const jsonRef = useRef()

  const handleJsonImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result)
        const mappedInvoices = importTransactionsFromJSON(jsonData)
        
        if (mappedInvoices.length > 0) {
          const { error } = await bulkImport(mappedInvoices)
          if (error) throw error
          toast.success(`Imported ${mappedInvoices.length} invoices from JSON`)
        } else {
          toast.error('No invoices found or invalid structure')
        }
      } catch (err) {
        console.error('Import error:', err)
        toast.error('Failed to import JSON: ' + err.message)
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q || inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_snapshot?.name?.toLowerCase().includes(q) ||
      inv.customer_snapshot?.company_name?.toLowerCase().includes(q) ||
      String(inv.total).includes(q) ||
      (inv.items && Array.isArray(inv.items) && inv.items.some(item => item.name?.toLowerCase().includes(q)))

    let matchDate = true
    if (dateFilter !== 'all' && inv.invoice_date) {
      const invDate = new Date(inv.invoice_date)
      const now = new Date()
      // Reset time to start of day for comparison
      now.setHours(0, 0, 0, 0)
      
      if (dateFilter === 'week') {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        matchDate = invDate >= startOfWeek
      } else if (dateFilter === 'month') {
        matchDate = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
      } else if (dateFilter === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        matchDate = invDate >= lastMonth && invDate <= endOfLastMonth
      } else if (dateFilter === 'year') {
        matchDate = invDate.getFullYear() === now.getFullYear()
      }
    }

    return matchSearch && matchDate
  }).sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date) || new Date(b.created_at) - new Date(a.created_at))

  // Reset page when filter changes
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Use an effect to reset page if it's out of bounds after filter change
  if (page > totalPages && totalPages > 0) {
    setPage(1)
  }

  return (
    <>
      <div className="page-header">
        <h1>Invoices</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-outline btn-sm" onClick={() => jsonRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </button>
          <input ref={jsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonImport} />
          <button className="btn btn-accent btn-sm" onClick={() => navigate('/invoices/new')}>
            + New
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 'var(--space-3)', position: 'relative' }}>
          <Search size={18} className="search-icon" />
          <input
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or invoice number…"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'lastMonth', label: 'Last Month' },
            { id: 'year', label: 'This Year' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setDateFilter(t.id); setPage(1); }}
              className={`btn btn-sm ${dateFilter === t.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minHeight: 36 }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Filter size={28} /></div>
            <p className="font-medium">No invoices found</p>
            <p className="text-secondary text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {paginated.map(inv => (
              <div key={inv.id} className="invoice-list-item" onClick={() => navigate(`/invoices/${inv.id}`)}>
                <div className="invoice-list-avatar">
                  {getInitials(inv.customer_snapshot?.name || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="font-medium truncate">{inv.customer_snapshot?.name || 'Unknown'}</span>
                  </div>
                  <div className="text-secondary text-xs">#{inv.invoice_number} · {formatDateShort(inv.invoice_date)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className="font-semibold" style={{ fontSize: 'var(--font-size-sm)' }}>{formatCurrency(inv.total)}</div>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-surface-1)'
              }}>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <div className="text-sm font-medium text-secondary">
                  Page {page} of {totalPages}
                </div>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
