import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { login } from './api/authApi'
import { createInventory, createInvoice, fetchDashboard, fetchInventory } from './api/dashboardApi'
import type { CreateInventoryPayload, CreateInvoicePayload, DashboardPayload, InventoryItem, InvoiceType } from './types/dashboard'
import { MonolithicDashboard } from './components/MonolithicDashboard'
import { InventoryEnhanced } from './components/InventoryEnhanced'
import { AdminShops } from './components/AdminShops'
import { ForgotPassword } from './components/ForgotPassword'
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



const defaultInvoiceForm: CreateInvoicePayload = {
  customer: '',
  mobilenumber: '',
  address: '',
  items: [],
  type: 'GOLD_22K',
  amount: 0,
  status: 'Pending',
  makingCharge: 0,
  gstRate: 0.03,
  discount: 0,
  grossAmount: 0,
  netAmount: 0,
  paymentMethod: 'Cash'
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
  const [jewellerName, setJewellerName] = useState<string>(() => localStorage.getItem('luxegem_jeweller_name') || 'Jewellery Dashboard')
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('luxegem_role') || 'shop')
  const [shopLogo, setShopLogo] = useState<string>(() => localStorage.getItem('luxegem_logo') || '')
  const [shopAddress, setShopAddress] = useState<string>(() => localStorage.getItem('luxegem_shop_address') || '')
  const [shopContact, setShopContact] = useState<string>(() => localStorage.getItem('luxegem_shop_contact') || '')
  const [shopGst, setShopGst] = useState<string>(() => localStorage.getItem('luxegem_shop_gst') || '')
  const [shopEmail, setShopEmail] = useState<string>(() => localStorage.getItem('luxegem_email') || '')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [authError, setAuthError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const [activeTab, setActiveTab] = useState('Dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [savingInventory, setSavingInventory] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoicePayload>(defaultInvoiceForm)
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; type: InvoiceType; weight: string | ''; rate: string | ''; makingChargePercent: string | ''; gstRatePercent: string | '' }[]>([{ description: '', type: 'GOLD_22K', weight: '', rate: '', makingChargePercent: '8', gstRatePercent: '3' }])
  const [inventoryForm, setInventoryForm] = useState<CreateInventoryPayload>(defaultInventoryForm)

  const [data, setData] = useState<DashboardPayload | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportRangeType, setReportRangeType] = useState<'YTD' | 'MTD' | 'WTD' | 'CUSTOM'>('MTD')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  const todayDateInput = useMemo(() => new Date().toISOString().slice(0, 10), [])

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

  const salesReport = useMemo(() => {
    const invoices = data?.invoices ?? []
    const now = new Date()

    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekday = now.getDay()
    const diffToMonday = weekday === 0 ? 6 : weekday - 1
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    let startDate: Date | null = null
    let endDate: Date | null = null

    if (reportRangeType === 'YTD') {
      startDate = startOfYear
      endDate = now
    } else if (reportRangeType === 'MTD') {
      startDate = startOfMonth
      endDate = now
    } else if (reportRangeType === 'WTD') {
      startDate = startOfWeek
      endDate = now
    } else if (reportRangeType === 'CUSTOM') {
      startDate = customStartDate ? new Date(customStartDate) : null
      endDate = customEndDate ? new Date(customEndDate) : null
      if (endDate) {
        endDate.setHours(23, 59, 59, 999)
      }
    }

    const filteredInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt)
      if (Number.isNaN(invoiceDate.getTime())) {
        return false
      }
      if (startDate && invoiceDate < startDate) {
        return false
      }
      if (endDate && invoiceDate > endDate) {
        return false
      }
      return true
    })

    const totalSales = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const paidSales = filteredInvoices
      .filter((invoice) => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0)
    const pendingSales = filteredInvoices
      .filter((invoice) => invoice.status === 'Pending')
      .reduce((sum, invoice) => sum + invoice.amount, 0)

    return {
      filteredInvoices,
      totalSales,
      paidSales,
      pendingSales,
      rangeLabel: reportRangeType === 'CUSTOM' ? 'Custom Date Range' : reportRangeType
    }
  }, [customEndDate, customStartDate, data?.invoices, reportRangeType])

  const onLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoggingIn(true)
    setAuthError(null)

    try {
      const auth = await login(username, password)
      const resolvedShopName = auth.shopName?.trim() ? auth.shopName : 'Jewellery Dashboard'
      localStorage.setItem('luxegem_token', auth.token)
      localStorage.setItem('luxegem_username', username)
      localStorage.setItem('luxegem_jeweller_name', resolvedShopName)
      localStorage.setItem('luxegem_role', auth.role || 'shop')
      if (auth.email) {
        localStorage.setItem('luxegem_email', auth.email)
      } else {
        localStorage.removeItem('luxegem_email')
      }
      if (auth.logoUrl) {
        localStorage.setItem('luxegem_logo', auth.logoUrl)
      } else {
        localStorage.removeItem('luxegem_logo')
      }
      if (auth.address) {
        localStorage.setItem('luxegem_shop_address', auth.address)
      } else {
        localStorage.removeItem('luxegem_shop_address')
      }
      if (auth.contactNumber) {
        localStorage.setItem('luxegem_shop_contact', auth.contactNumber)
      } else {
        localStorage.removeItem('luxegem_shop_contact')
      }
      if (auth.gstNumber) {
        localStorage.setItem('luxegem_shop_gst', auth.gstNumber)
      } else {
        localStorage.removeItem('luxegem_shop_gst')
      }

      setToken(auth.token)
      setLoggedInUsername(username)
      setJewellerName(resolvedShopName)
      setUserRole(auth.role || 'shop')
      setShopLogo(auth.logoUrl || '')
      setShopAddress(auth.address || '')
      setShopContact(auth.contactNumber || '')
      setShopGst(auth.gstNumber || '')
      setShopEmail(auth.email || '')
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
      const totalBaseItems = invoiceItems.reduce((acc, item) => acc + ((Number(item.weight) || 0) * (Number(item.rate) || 0)), 0);
      const totalMakingCharge = invoiceItems.reduce((acc, item) => {
        const base = (Number(item.weight) || 0) * (Number(item.rate) || 0);
        const mcPercent = Number(item.makingChargePercent) || 0;
        return acc + (base * (mcPercent / 100));
      }, 0);
      const totalGstAmount = invoiceItems.reduce((acc, item) => {
        const base = (Number(item.weight) || 0) * (Number(item.rate) || 0);
        const mc = base * ((Number(item.makingChargePercent) || 0) / 100);
        const gstPercent = Number(item.gstRatePercent) || 0;
        return acc + ((base + mc) * (gstPercent / 100));
      }, 0);

      const overallBase = totalBaseItems + totalMakingCharge;
      const netAmountAmount = overallBase + totalGstAmount;

      const itemsPayload = invoiceItems
        .filter(i => i.description.trim())
        .map(i => ({
          description: i.description,
          type: i.type,
          weight: Number(i.weight) || 0,
          rate: Number(i.rate) || 0,
          makingChargePercent: Number(i.makingChargePercent) || 0,
          gstRatePercent: Number(i.gstRatePercent) || 0
        }));


      const invoicePayload = {
        ...invoiceForm,
        items: itemsPayload.length > 0 ? itemsPayload : [],
        grossAmount: overallBase,
        netAmount: netAmountAmount,
        amount: netAmountAmount,
        gstRate: 0,
        makingCharge: totalMakingCharge,
        discount: 0
      };

      const createdInvoice = await createInvoice(token, invoicePayload)
      await loadDashboard(token)
      setShowCreateModal(false)
      setInvoiceForm(defaultInvoiceForm)
      setInvoiceItems([{ description: '', type: 'GOLD_22K', weight: '', rate: '', makingChargePercent: '8', gstRatePercent: '3' }])

      // Auto-open print view for the new invoice. Delay allows new state to mount.
      if (createdInvoice && createdInvoice.invoiceId) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openInvoicePreview', { detail: createdInvoice.invoiceId }));
        }, 500);
      }
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
    localStorage.removeItem('luxegem_jeweller_name')
    localStorage.removeItem('luxegem_role')
    localStorage.removeItem('luxegem_email')
    localStorage.removeItem('luxegem_logo')
    localStorage.removeItem('luxegem_shop_address')
    localStorage.removeItem('luxegem_shop_contact')
    localStorage.removeItem('luxegem_shop_gst')
    setToken(null)
    setLoggedInUsername('admin')
    setJewellerName('Jewellery Dashboard')
    setUserRole('shop')
    setShopLogo('')
    setShopAddress('')
    setShopContact('')
    setShopGst('')
    setShopEmail('')
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
                <span className="badge-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#d4af37" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </span>
                Luxury Jewellery ERP Suite
              </div>
              <h1>Complete ERP Solution<br />for Modern Jewellery Businesses</h1>
              <p>
                Streamline billing, inventory, customers, and live bullion rates in one intelligent platform built for jewellery retailers.
              </p>

              <div className="cta-container">
                <button className="cta-primary">Start Free Trial</button>
                <button className="cta-secondary">Book Demo</button>
              </div>

              <div className="showcase-stats">
                <div className="stat-item">
                  <div className="stat-icon" style={{ color: '#d4af37' }}>📈</div>
                  <div className="showcase-stat-label">Live Gold & Silver Rates</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon" style={{ color: '#d4af37' }}>🧾</div>
                  <div className="showcase-stat-label">GST-Ready Smart Billing</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon" style={{ color: '#d4af37' }}>📊</div>
                  <div className="showcase-stat-label">Real-Time Business Insights</div>
                </div>
              </div>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-check"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                  <span>Smart Inventory Control</span>
                </div>
                <div className="feature-item">
                  <span className="feature-check"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                  <span>Multi-Metal Pricing Support</span>
                </div>
                <div className="feature-item">
                  <span className="feature-check"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                  <span>Advanced Reports & Profit Analytics</span>
                </div>
              </div>
            </div>
          </section>

          {showForgotPassword ? (
            <div style={{ alignSelf: 'center', width: '100%' }}>
              <ForgotPassword onBack={() => setShowForgotPassword(false)} />
            </div>
          ) : (
            <form className="login-card" onSubmit={onLogin}>
              <div className="login-header">
                <h2>Welcome Back</h2>
                <p>Sign in to continue to your dashboard</p>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </span>
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
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
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



              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{ background: 'none', border: 'none', color: '#d4af37', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="status">Loading dashboard...</div>
  }

  if (error || !data) {
    return (
      <div className="status error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingTop: '100px' }}>
        <div>{error ?? 'Dashboard failed to load.'}</div>
        <button
          onClick={onLogout}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ff4d4f', background: '#ffe6e6', color: '#ff4d4f', cursor: 'pointer' }}
        >
          Clear Session & Return to Login
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-emblem" style={shopLogo ? { background: 'none', border: 'none', width: '32px', height: '32px' } : {}}>
              {shopLogo ? (
                <img src={shopLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z" /><path d="M11 3 8 9l4 13 4-13-3-6" /><path d="M2 9h20" /></svg>
              )}
            </div>
            <div className="brand-name">{jewellerName}</div>
          </div>

          <nav className="nav">
            {[
              { id: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg> },
              { id: 'Inventory', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg> },
              { id: 'Billing', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
              { id: 'Customers', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              { id: 'Reports', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg> },
              ...((userRole === 'admin' || loggedInUsername === 'admin') ? [{ id: 'Shops', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.icon}
                {tab.id}
              </button>
            ))}
          </nav>

          <div className="system-title">SYSTEM</div>
          <button className="nav-item" onClick={() => setActiveTab('Settings' as any)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            Settings
          </button>
          <button className="nav-item" onClick={onLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            Logout
          </button>

          <div className="profile">
            <div className="avatar">{getInitials(loggedInUsername)}</div>
            <div>
              <div className="profile-name">{loggedInUsername.charAt(0).toUpperCase() + loggedInUsername.slice(1)}</div>
              <div className="profile-role" style={{ fontSize: '0.75rem', color: '#a0abc0', textTransform: 'capitalize' }}>{userRole}</div>
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

          {activeTab === 'Shops' ? (
            <AdminShops token={token} />
          ) : activeTab === 'Dashboard' ? (
            <MonolithicDashboard
              data={data}
              formatMoney={formatMoney}
              formatInvoiceType={formatInvoiceTypeFlexible}
              onCreateInvoice={() => setShowCreateModal(true)}
              jewellerName={jewellerName}
              shopAddress={shopAddress}
              shopContact={shopContact}
              shopGst={shopGst}
              shopEmail={shopEmail}
            />
          ) : activeTab === 'Reports' ? (
            <section className="table-card large" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Sales Report</h3>
                  <p style={{ margin: '0.35rem 0 0 0', color: '#a0abc0', fontSize: '0.9rem' }}>
                    Sales summary based on invoice sale amount
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['YTD', 'MTD', 'WTD', 'CUSTOM'] as const).map((range) => (
                    <button
                      key={range}
                      type="button"
                      className="date-pill"
                      onClick={() => setReportRangeType(range)}
                      style={{
                        cursor: 'pointer',
                        opacity: reportRangeType === range ? 1 : 0.65,
                        borderColor: reportRangeType === range ? '#d4af37' : undefined
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {reportRangeType === 'CUSTOM' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#cfd8ea', fontSize: '0.9rem' }}>
                    Start date
                    <input type="date" value={customStartDate} max={customEndDate || todayDateInput} onChange={(e) => setCustomStartDate(e.target.value)} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#cfd8ea', fontSize: '0.9rem' }}>
                    End date
                    <input type="date" value={customEndDate} min={customStartDate || undefined} max={todayDateInput} onChange={(e) => setCustomEndDate(e.target.value)} />
                  </label>
                </div>
              )}

              <div className="stats-footer" style={{ marginTop: '0.25rem' }}>
                <div className="stat-item">
                  <span className="stat-label">Report Type</span>
                  <span className="stat-number">{salesReport.rangeLabel}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Sales</span>
                  <span className="stat-number">{formatMoney(salesReport.totalSales)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Paid Sales</span>
                  <span className="stat-number">{formatMoney(salesReport.paidSales)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending Sales</span>
                  <span className="stat-number">{formatMoney(salesReport.pendingSales)}</span>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Sale Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#a0abc0', padding: '1.5rem' }}>
                          No sales found for selected range.
                        </td>
                      </tr>
                    ) : (
                      salesReport.filteredInvoices.map((invoice) => (
                        <tr key={invoice.invoiceId}>
                          <td>{invoice.invoiceId}</td>
                          <td>{invoice.customer}</td>
                          <td>{formatDateTime(invoice.createdAt)}</td>
                          <td>
                            <span className={`status-badge status-${invoice.status.toLowerCase()}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatMoney(invoice.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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
          <div className="modal-card invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="modal-header-icon">📋</span>
                <div>
                  <h2>Create Invoice</h2>
                  <p className="modal-subtitle">Fill in the details to generate a new invoice</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateModal(false)} aria-label="Close">✕</button>
            </div>

            <form onSubmit={onCreateInvoice} className="invoice-form">
              <div className="modal-body">
                {/* Customer Info Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <span className="section-icon">👤</span>
                    Customer Information
                  </div>
                  <div className="form-grid form-grid-2">
                    <div className="form-field">
                      <label>Customer Name</label>
                      <input
                        placeholder="e.g. Rajesh Kumar"
                        value={invoiceForm.customer}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, customer: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Mobile Number</label>
                      <input
                        placeholder="e.g. +91 9876543210"
                        value={invoiceForm.mobilenumber || ''}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, mobilenumber: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-grid form-grid-1" style={{ marginTop: '1rem' }}>
                    <div className="form-field">
                      <label>Address</label>
                      <input
                        placeholder="e.g. 123 Main St, Mumbai"
                        value={invoiceForm.address || ''}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Multiple Items Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <span className="section-icon">🛍️</span>
                    Invoice Items
                  </div>
                  <div className="invoice-items-list">
                    {invoiceItems.map((item, idx) => (
                      <div key={idx} className="invoice-item-row" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', position: 'relative', display: 'block', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            className="remove-item-btn"
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: '#F56565', border: 'none', cursor: 'pointer', fontSize: '1.2rem', margin: 0, padding: '0 5px' }}
                            onClick={() => {
                              const newItems = invoiceItems.filter((_, i) => i !== idx)
                              setInvoiceItems(newItems)
                            }}
                            aria-label="Remove item"
                          >
                            ✕
                          </button>
                        )}
                        <div className="form-grid form-grid-1" style={{ marginBottom: '1rem' }}>
                          <div className="form-field">
                            <label>Item Description</label>
                            <input
                              placeholder="e.g. Diamond Stud Earrings"
                              value={item.description}
                              onChange={(e) => {
                                const newItems = invoiceItems.map((it, i) =>
                                  i === idx ? { ...it, description: e.target.value } : it
                                )
                                setInvoiceItems(newItems)
                              }}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-grid form-grid-5">
                          <div className="form-field">
                            <label>Metal Type</label>
                            <select
                              value={item.type}
                              onChange={(e) => {
                                const newItems = invoiceItems.map((it, i) =>
                                  i === idx ? { ...it, type: e.target.value as InvoiceType } : it
                                )
                                setInvoiceItems(newItems)
                              }}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                                fontSize: '0.95rem'
                              }}
                            >
                              {invoiceTypeOptions.map((option) => (
                                <option key={option.value} value={option.value} style={{ background: '#111520', color: '#fff' }}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label>Weight (g)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              placeholder="0.000"
                              value={item.weight}
                              onChange={(e) => {
                                const newItems = invoiceItems.map((it, i) =>
                                  i === idx ? { ...it, weight: e.target.value } : it
                                )
                                setInvoiceItems(newItems)
                              }}
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label>Rate (₹/g)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.rate}
                              onChange={(e) => {
                                const newItems = invoiceItems.map((it, i) =>
                                  i === idx ? { ...it, rate: e.target.value } : it
                                )
                                setInvoiceItems(newItems)
                              }}
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label>Making Chg (%)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="0"
                              value={item.makingChargePercent}
                              onChange={(e) => {
                                const newItems = invoiceItems.map((it, i) =>
                                  i === idx ? { ...it, makingChargePercent: e.target.value } : it
                                )
                                setInvoiceItems(newItems)
                              }}
                            />
                          </div>
                          <div className="form-field">
                            <label>GST (%)</label>
                            <select
                              value={item.gstRatePercent}
                              onChange={(e) => {
                                const newItems = invoiceItems.map((it, i) =>
                                  i === idx ? { ...it, gstRatePercent: e.target.value } : it
                                )
                                setInvoiceItems(newItems)
                              }}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                                fontSize: '0.95rem'
                              }}
                            >
                              <option value="0" style={{ background: '#111520' }}>0%</option>
                              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num} style={{ background: '#111520', color: '#fff' }}>{num}%</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginTop: '1.2rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'right', fontSize: '1.2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ color: '#A0ABC0', marginRight: '0.5rem' }}>Net Amount:</span>
                          <span style={{ fontWeight: 'bold', color: '#d4af37' }}>
                            ₹{formatMoney(((((Number(item.weight) || 0) * (Number(item.rate) || 0)) * (1 + (Number(item.makingChargePercent) || 0) / 100)) * (1 + (Number(item.gstRatePercent) || 0) / 100))).replace('₹', '')}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-item-btn"
                      style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', border: '1px dashed rgba(212, 175, 55, 0.3)' }}
                      onClick={() => setInvoiceItems([...invoiceItems, { description: '', type: 'GOLD_22K', weight: '', rate: '', makingChargePercent: '8', gstRatePercent: '3' }])}
                    >
                      + Add Item
                    </button>
                  </div>
                </div>


                {/* Payment Details Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <span className="section-icon">💳</span>
                    Payment Details
                  </div>
                  <div className="form-grid form-grid-1">
                    <div className="form-field">
                      <label>Payment Method</label>
                      <select
                        className="payment-method-select"
                        value={invoiceForm.paymentMethod}
                        onChange={(e) =>
                          setInvoiceForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                        }
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Calculated Totals Section */}
                <div className="form-section totals-section">
                  <div className="form-section-title">
                    <span className="section-icon">🧮</span>
                    Calculated Totals
                  </div>
                  <div className="totals-grid">
                    <div className="total-item">
                      <span className="total-label">Base Amount</span>
                      <span className="total-value">
                        {formatMoney(
                          invoiceItems.reduce((acc, item) => acc + ((Number(item.weight) || 0) * (Number(item.rate) || 0)) * (1 + (Number(item.makingChargePercent) || 0) / 100), 0)
                        )}
                      </span>
                    </div>
                    <div className="total-item">
                      <span className="total-label">GST</span>
                      <span className="total-value">
                        {formatMoney(
                          invoiceItems.reduce((acc, item) => acc + (((Number(item.weight) || 0) * (Number(item.rate) || 0)) * (1 + (Number(item.makingChargePercent) || 0) / 100)) * ((Number(item.gstRatePercent) || 0) / 100), 0)
                        )}
                      </span>
                    </div>
                    <div className="total-item total-highlight">
                      <span className="total-label">Total Amount</span>
                      <span className="total-value">
                        {formatMoney(
                          invoiceItems.reduce((acc, item) => acc + (((Number(item.weight) || 0) * (Number(item.rate) || 0)) * (1 + (Number(item.makingChargePercent) || 0) / 100)) * (1 + (Number(item.gstRatePercent) || 0) / 100), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <span className="section-icon">📌</span>
                    Invoice Status
                  </div>
                  <div className="form-grid form-grid-1">
                    <div className="form-field">
                      <label>Payment Status</label>
                      <select
                        value={invoiceForm.status}
                        onChange={(e) =>
                          setInvoiceForm((prev) => ({ ...prev, status: e.target.value as CreateInvoicePayload['status'] }))
                        }
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="Paid">✅ Paid</option>
                        <option value="Draft">📝 Draft</option>
                      </select>
                    </div>
                  </div>
                </div>

                {createError && (
                  <div className="modal-error">
                    <span className="error-icon">⚠️</span>
                    {createError}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={savingInvoice}>
                  {savingInvoice ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>✨ Create Invoice</>
                  )}
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
