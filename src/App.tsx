import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { login } from './api/authApi'
import { createInventory, createInvoice, fetchDashboard, fetchInventory } from './api/dashboardApi'
import type { CreateInventoryPayload, CreateInvoicePayload, DashboardPayload, InventoryItem, InvoiceType } from './types/dashboard'
import { MonolithicDashboard } from './components/MonolithicDashboard'
import { InventoryEnhanced } from './components/InventoryEnhanced'
import './styles/billing-dashboard.css'
import './styles/dashboard-premium.css'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function formatMoney(value: number, currency: 'INR' | 'USD' = 'INR'): string {
  if (currency === 'USD') {
    return usdFormatter.format(value)
  }
  return inrFormatter.format(value)
}
/* Utility function removed - kept for reference
// Previously used but now unused - consider removing if no future use
*/

const defaultInvoiceForm: CreateInvoicePayload = {
  customer: '',
  items: '',
  type: 'GOLD_22K',
  amount: 0,
  status: 'Pending'
}

const defaultInventoryForm: CreateInventoryPayload = {
  sku: '',
  itemName: '',
  type: 'GOLD_22K',
  weightGrams: 1,
  quantity: 1,
  unitPrice: 1000,
  lowStockThreshold: 1
}

const invoiceTypeOptions: Array<{ value: InvoiceType; label: string }> = [
  { value: 'GOLD_18K', label: 'Gold 18K' },
  { value: 'GOLD_22K', label: 'Gold 22K' },
  { value: 'GOLD_24K', label: 'Gold 24K' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'PLATINUM', label: 'Platinum' },
  { value: 'DIAMOND', label: 'Diamond' },
  { value: 'OTHER', label: 'Other' }
]

function formatInvoiceType(type: InvoiceType): string {
  return invoiceTypeOptions.find((option) => option.value === type)?.label ?? type
}

// Wrapper for components that expect string type
const formatInvoiceTypeFlexible = (type: InvoiceType | string): string => {
  return invoiceTypeOptions.find((option) => option.value === type)?.label ?? String(type)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN')
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('luxegem_token'))
  const [loggedInUsername, setLoggedInUsername] = useState<string>(() => localStorage.getItem('luxegem_username') || 'admin')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [authError, setAuthError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const [activeTab, setActiveTab] = useState('Dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [savingInventory, setSavingInventory] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoicePayload>(defaultInvoiceForm)
  const [inventoryForm, setInventoryForm] = useState<CreateInventoryPayload>(defaultInventoryForm)

  const [data, setData] = useState<DashboardPayload | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async (authToken: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchDashboard(authToken)
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dashboard failed to load.')
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async (authToken: string, query?: string) => {
    setInventoryLoading(true)
    setInventoryError(null)

    try {
      const response = await fetchInventory(authToken, query)
      setInventory(response)
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : 'Inventory failed to load.')
    } finally {
      setInventoryLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setData(null)
      return
    }

    loadDashboard(token)
    loadInventory(token)
  }, [token])

  useEffect(() => {
    if (!token || activeTab !== 'Inventory') {
      return
    }

    const timeout = setTimeout(() => {
      loadInventory(token, searchQuery)
    }, 250)

    return () => clearTimeout(timeout)
  }, [token, activeTab, searchQuery])

  const dateLabel = useMemo(() => {
    const date = data?.overview.date ? new Date(data.overview.date) : new Date()
    return dateFormatter.format(date)
  }, [data])

  const onLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoggingIn(true)
    setAuthError(null)

    try {
      const auth = await login(username, password)
      localStorage.setItem('luxegem_token', auth.token)
      localStorage.setItem('luxegem_username', username)
      setToken(auth.token)
      setLoggedInUsername(username)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoggingIn(false)
    }
  }

  const onCreateInvoice = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) {
      return
    }

    setSavingInvoice(true)
    setCreateError(null)

    try {
      await createInvoice(token, invoiceForm)
      await loadDashboard(token)
      setShowCreateModal(false)
      setInvoiceForm(defaultInvoiceForm)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
      setSavingInvoice(false)
    }
  }

  const onCreateInventory = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) {
      return
    }

    setSavingInventory(true)
    setCreateError(null)

    try {
      await createInventory(token, inventoryForm)
      await loadInventory(token, searchQuery)
      setShowInventoryModal(false)
      setInventoryForm(defaultInventoryForm)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create inventory')
    } finally {
      setSavingInventory(false)
    }
  }

  const onLogout = () => {
    localStorage.removeItem('luxegem_token')
    localStorage.removeItem('luxegem_username')
    setToken(null)
    setLoggedInUsername('admin')
  }

  if (!token) {
    return (
      <div className="login-screen">
        <div className="animated-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="login-shell">
          <section className="login-showcase">
            <div className="showcase-content">
              <div className="showcase-badge">
                <span className="badge-icon">✨</span>
                AKASH JWELLERS
              </div>
              <h1>Crafted Elegance<br/>for Every Occasion</h1>
              <p>
                Manage inventory, invoices, customers, and live Indian bullion rates in one modern workspace tailored for
                jewellery retail operations.
              </p>
              <div className="showcase-stats">
                <div className="stat-item">
                  <div className="stat-icon">🏆</div>
                  <div className="showcase-stat-value">24K Live</div>
                  <div className="showcase-stat-label">Gold Tracking</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">💎</div>
                  <div className="showcase-stat-value">INR Ready</div>
                  <div className="showcase-stat-label">Billing Format</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">⚡</div>
                  <div className="showcase-stat-value">Real-time</div>
                  <div className="showcase-stat-label">Updates</div>
                </div>
              </div>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Real-time inventory tracking</span>
                </div>
                <div className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Multi-metal pricing support</span>
                </div>
                <div className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Advanced reporting & analytics</span>
                </div>
              </div>
            </div>
          </section>

          <form className="login-card" onSubmit={onLogin}>
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your dashboard</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input 
                  id="username"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter your username" 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {authError}
              </div>
            )}

            <button className="login-button" type="submit" disabled={loggingIn}>
              <span className="button-content">
                {loggingIn ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="button-arrow">→</span>
                  </>
                )}
              </span>
            </button>

            <div className="login-divider">
              <span>Demo Account</span>
            </div>

            <div className="demo-credentials">
              <div className="credential">
                <span className="label">Username:</span>
                <span className="value">admin</span>
              </div>
              <div className="credential">
                <span className="label">Password:</span>
                <span className="value">admin123</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="status">Loading dashboard...</div>
  }

  if (error || !data) {
    return <div className="status error">{error ?? 'Dashboard failed to load.'}</div>
  }

  return (
    <>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-emblem">AJ</div>
            <div className="brand-name">Akash Jwellers</div>
          </div>

          <nav className="nav">
            {['Dashboard', 'Inventory', 'Billing', 'Customers', 'Reports'].map((tab) => (
              <button
                key={tab}
                className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="system-title">SYSTEM</div>
          <button className="nav-item" onClick={() => setActiveTab('Settings')}>
            Settings
          </button>
          <button className="nav-item" onClick={onLogout}>
            Logout
          </button>

          <div className="profile">
            <div className="avatar">{getInitials(loggedInUsername)}</div>
            <div>
              <div className="profile-name">{loggedInUsername.charAt(0).toUpperCase() + loggedInUsername.slice(1)}</div>
              <div className="profile-role">Store Manager</div>
            </div>
          </div>
        </aside>

        <main className="content">
          <header className="topbar">
            <input
              placeholder="Search invoices, SKUs, or clients..."
              className="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="topbar-right">
              <button className="date-pill">{dateLabel}</button>
            </div>
          </header>

          {activeTab === 'Dashboard' ? (
            <MonolithicDashboard 
              data={data} 
              formatMoney={formatMoney}
              formatInvoiceType={formatInvoiceTypeFlexible}
              onCreateInvoice={() => setShowCreateModal(true)}
            />
          ) : (
            <InventoryEnhanced
              items={inventory}
              loading={inventoryLoading}
              error={inventoryError}
              searchQuery={searchQuery}
              formatMoney={formatMoney}
              formatInvoiceType={formatInvoiceType}
              formatDateTime={formatDateTime}
              onAddClick={() => setShowInventoryModal(true)}
            />
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Create Invoice</h2>
            <form onSubmit={onCreateInvoice} className="invoice-form">
              <input
                placeholder="Customer Name"
                value={invoiceForm.customer}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, customer: e.target.value }))}
                required
              />
              <input
                placeholder="Items"
                value={invoiceForm.items}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, items: e.target.value }))}
                required
              />
              <select
                value={invoiceForm.type}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, type: e.target.value as CreateInvoicePayload['type'] }))
                }
              >
                {invoiceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Amount"
                value={invoiceForm.amount || ''}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                required
              />
              <select
                value={invoiceForm.status}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, status: e.target.value as CreateInvoicePayload['status'] }))
                }
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Draft">Draft</option>
              </select>

              {createError && <div className="login-error">{createError}</div>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={savingInvoice}>
                  {savingInvoice ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Add Inventory</h2>
            <form onSubmit={onCreateInventory} className="invoice-form">
              <input
                placeholder="SKU (optional, auto-generated if empty)"
                value={inventoryForm.sku ?? ''}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, sku: e.target.value }))}
              />
              <input
                placeholder="Item Name"
                value={inventoryForm.itemName}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, itemName: e.target.value }))}
                required
              />
              <select
                value={inventoryForm.type}
                onChange={(e) =>
                  setInventoryForm((prev) => ({ ...prev, type: e.target.value as CreateInventoryPayload['type'] }))
                }
              >
                {invoiceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Weight (grams)"
                value={inventoryForm.weightGrams || ''}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, weightGrams: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Quantity"
                value={inventoryForm.quantity || ''}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Unit Price (INR)"
                value={inventoryForm.unitPrice || ''}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, unitPrice: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Low Stock Threshold"
                value={inventoryForm.lowStockThreshold || ''}
                onChange={(e) =>
                  setInventoryForm((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) }))
                }
                required
              />

              {createError && <div className="login-error">{createError}</div>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowInventoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={savingInventory}>
                  {savingInventory ? 'Saving...' : 'Add Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
