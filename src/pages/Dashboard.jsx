import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, FileText, Users, Package, ChevronRight, IndianRupee } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { useCustomers } from '../hooks/useCustomers'
import { useInventory } from '../hooks/useInventory'
import { formatCurrency, formatDateShort, getInitials } from '../lib/helpers'

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

export default function Dashboard() {
  const { invoices, loading, getStats } = useInvoices()
  const { customers } = useCustomers()
  const { items } = useInventory()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [getStats])

  const recent = [...invoices]
    .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date) || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary text-sm">Welcome back 👋</p>
        </div>
        <Link to="/invoices/new">
          <button className="btn btn-accent btn-sm">
            <Plus size={16} /> New Invoice
          </button>
        </Link>
      </div>

      <div className="page-body">
        {/* Big CTA for mobile */}
        <Link to="/invoices/new" style={{ display: 'block', marginBottom: 'var(--space-6)' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-lighter) 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#fff' }}>
                ＋ New Invoice
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                Create B2B or B2C invoice
              </div>
            </div>
            <div style={{
              width: 56, height: 56, background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={28} color="#fff" />
            </div>
          </div>
        </Link>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card green">
            <div className="stat-icon"><IndianRupee size={18} /></div>
            <div className="stat-value">
              {stats ? formatCurrency(stats.monthRevenue).replace('₹', '') : '—'}
            </div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon"><TrendingUp size={18} /></div>
            <div className="stat-value">
              {stats ? formatCurrency(stats.allRevenue).replace('₹', '') : '—'}
            </div>
            <div className="stat-label">All Time Revenue</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon"><FileText size={18} /></div>
            <div className="stat-value">{stats?.total ?? '—'}</div>
            <div className="stat-label">Total Invoices</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon"><Users size={18} /></div>
            <div className="stat-value">{customers.length}</div>
            <div className="stat-label">Customers</div>
          </div>
        </div>

        {/* Quick Stats Row moved to grid or removed */}
        {/* We keep Items count in the main grid instead of purple users if needed, but let's just remove the row for now as requested */}

        {/* Recent Invoices */}
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Recent Invoices</h2>
          <Link to="/invoices" className="text-primary text-sm font-medium" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            See all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={28} /></div>
            <p className="font-medium">No invoices yet</p>
            <p className="text-secondary text-sm">Tap "New Invoice" to get started</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recent.map(inv => (
              <div key={inv.id} className="invoice-list-item" onClick={() => navigate(`/invoices/${inv.id}`)}>
                <div className="invoice-list-avatar">
                  {getInitials(inv.customer_snapshot?.name || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-medium truncate">{inv.customer_snapshot?.name || 'Unknown'}</div>
                  <div className="text-secondary text-xs">#{inv.invoice_number} · {formatDateShort(inv.invoice_date)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-semibold" style={{ fontSize: 'var(--font-size-sm)' }}>{formatCurrency(inv.total)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
