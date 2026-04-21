import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Plus, Package, Users, Settings
} from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="sidebar hide-mobile">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🌿</div>
          <div>
            <div className="logo-text">Invoices</div>
            <div className="logo-sub">Manager</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/invoices">
          <FileText size={20} /> Invoices
        </NavLink>
        <NavLink to="/inventory">
          <Package size={20} /> Inventory
        </NavLink>
        <NavLink to="/customers">
          <Users size={20} /> Customers
        </NavLink>
        <NavLink to="/settings">
          <Settings size={20} /> Settings
        </NavLink>
      </nav>

      <div className="sidebar-new-invoice">
        <NavLink to="/invoices/new">
          <button className="btn btn-accent w-full" style={{ gap: 'var(--space-2)', justifyContent: 'center' }}>
            <Plus size={18} /> New Invoice
          </button>
        </NavLink>
      </div>
    </aside>
  )
}

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end>
        <LayoutDashboard size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/invoices">
        <FileText size={22} />
        <span>Invoices</span>
      </NavLink>
      <NavLink to="/invoices/new" className="cta">
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -16,
          boxShadow: '0 4px 16px rgba(244,162,97,0.4)',
        }}>
          <Plus size={22} color="var(--color-text-inverse)" />
        </div>
        <span>New</span>
      </NavLink>
      <NavLink to="/inventory">
        <Package size={22} />
        <span>Items</span>
      </NavLink>
      <NavLink to="/customers">
        <Users size={22} />
        <span>People</span>
      </NavLink>
    </nav>
  )
}
