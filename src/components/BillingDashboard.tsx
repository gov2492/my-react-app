import { useState, useMemo } from 'react'
import type { DashboardPayload } from '../types/dashboard'
import '../styles/billing-dashboard.css'

interface BillingStats {
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  averageOrderValue: number
  conversionRate: number
}

interface BillingDashboardProps {
  data: DashboardPayload
  formatMoney: (value: number, currency?: 'INR' | 'USD') => string
  onCreateInvoice: () => void
}

export function BillingDashboard({ data, formatMoney, onCreateInvoice }: BillingDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Draft'>('All')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date')

  // Calculate billing statistics
  const stats = useMemo((): BillingStats => {
    const invoices = data.invoices
    const paidInvoices = invoices.filter((inv) => inv.status === 'Paid')
    const pendingInvoices = invoices.filter((inv) => inv.status === 'Pending')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const averageOrderValue = invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length : 0

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      averageOrderValue,
      conversionRate: invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0
    }
  }, [data.invoices])

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = data.invoices

    if (statusFilter !== 'All') {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount
        case 'customer':
          return a.customer.localeCompare(b.customer)
        case 'date':
        default:
          return 0
      }
    })

    return sorted
  }, [data.invoices, statusFilter, sortBy])

  // Calculate status breakdown for visualization
  const statusBreakdown = useMemo(() => {
    const breakdown = {
      Paid: data.invoices.filter((inv) => inv.status === 'Paid').length,
      Pending: data.invoices.filter((inv) => inv.status === 'Pending').length,
      Draft: data.invoices.filter((inv) => inv.status === 'Draft').length
    }
    return breakdown
  }, [data.invoices])

  // Calculate product type distribution
  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}
    data.invoices.forEach((inv) => {
      distribution[inv.type] = (distribution[inv.type] || 0) + inv.amount
    })
    return Object.entries(distribution)
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [data.invoices])

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Paid':
        return '#10b981'
      case 'Pending':
        return '#f59e0b'
      case 'Draft':
        return '#6b7280'
      default:
        return '#9ca3af'
    }
  }

  const getStatusBgClass = (status: string): string => {
    switch (status) {
      case 'Paid':
        return 'status-paid'
      case 'Pending':
        return 'status-pending'
      case 'Draft':
        return 'status-draft'
      default:
        return 'status-default'
    }
  }

  return (
    <div className="billing-dashboard">
      {/* Header Section */}
      <section className="billing-header">
        <div className="header-content">
          <h1>💎 Billing Dashboard</h1>
          <p>Manage invoices, track payments, and monitor your sales performance</p>
        </div>
        <button className="primary-btn create-btn" onClick={onCreateInvoice}>
          ✨ Create New Invoice
        </button>
      </section>

      {/* Key Metrics */}
      <section className="metrics-container">
        <div className="metric-card premium">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">{formatMoney(stats.totalRevenue)}</div>
            <div className="metric-subtext">{stats.paidInvoices} paid invoices</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Average Order</div>
            <div className="metric-value">{formatMoney(stats.averageOrderValue)}</div>
            <div className="metric-subtext">Per transaction</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Conversion Rate</div>
            <div className="metric-value">{stats.conversionRate.toFixed(1)}%</div>
            <div className="metric-subtext">Paid vs total</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <div className="metric-label">Pending Amount</div>
            <div className="metric-value">{formatMoney(data.invoices.filter((inv) => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0))}</div>
            <div className="metric-subtext">{stats.pendingInvoices} invoices</div>
          </div>
        </div>
      </section>

      {/* Analytics and Controls */}
      <section className="analytics-section">
        {/* Status Overview */}
        <article className="chart-card">
          <h3>Invoice Status Overview</h3>
          <div className="status-overview">
            <div className="status-item">
              <div className="status-dot" style={{ background: getStatusColor('Paid') }} />
              <div className="status-info">
                <div className="status-name">Paid</div>
                <div className="status-count">{statusBreakdown.Paid}</div>
              </div>
              <div className="status-bar" style={{ '--filled': `${(statusBreakdown.Paid / data.invoices.length) * 100}%` } as any}>
                <div className="bar-fill" style={{ background: getStatusColor('Paid') }} />
              </div>
            </div>

            <div className="status-item">
              <div className="status-dot" style={{ background: getStatusColor('Pending') }} />
              <div className="status-info">
                <div className="status-name">Pending</div>
                <div className="status-count">{statusBreakdown.Pending}</div>
              </div>
              <div className="status-bar" style={{ '--filled': `${(statusBreakdown.Pending / data.invoices.length) * 100}%` } as any}>
                <div className="bar-fill" style={{ background: getStatusColor('Pending') }} />
              </div>
            </div>

            <div className="status-item">
              <div className="status-dot" style={{ background: getStatusColor('Draft') }} />
              <div className="status-info">
                <div className="status-name">Draft</div>
                <div className="status-count">{statusBreakdown.Draft}</div>
              </div>
              <div className="status-bar" style={{ '--filled': `${(statusBreakdown.Draft / data.invoices.length) * 100}%` } as any}>
                <div className="bar-fill" style={{ background: getStatusColor('Draft') }} />
              </div>
            </div>
          </div>
        </article>

        {/* Product Distribution */}
        <article className="chart-card">
          <h3>Top Products by Revenue</h3>
          <div className="product-distribution">
            {typeDistribution.map((item) => {
              const totalAmount = data.invoices.reduce((sum, inv) => sum + inv.amount, 0)
              const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
              return (
                <div key={item.type} className="product-bar-item">
                  <div className="product-label">
                    <span className="product-name">{item.type}</span>
                    <span className="product-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="product-bar">
                    <div className="product-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="product-amount">{formatMoney(item.amount)}</div>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      {/* Filters and Controls */}
      <section className="controls-section">
        <div className="filter-group">
          <div className="filter-item">
            <label>Period</label>
            <div className="button-group">
              {['today', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period as any)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-item">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="filter-select">
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="filter-select">
              <option value="date">Recent</option>
              <option value="amount">Highest Amount</option>
              <option value="customer">Customer Name</option>
            </select>
          </div>

          <div className="filter-info">
            <span className="invoice-count">{filteredInvoices.length} invoices</span>
          </div>
        </div>
      </section>

      {/* Invoice Table */}
      <section className="invoice-table-section">
        <article className="table-card large">
          <div className="table-header">
            <h3>Invoices & Transactions</h3>
            <div className="table-actions">
              <button className="filter-toggle">🔄 Refresh</button>
            </div>
          </div>

          {filteredInvoices.length > 0 ? (
            <div className="table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Customer</th>
                    <th>Product Type</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, idx) => (
                    <tr key={`${invoice.invoiceId}-${idx}`} className="invoice-row">
                      <td>
                        <span className="invoice-id">{invoice.invoiceId}</span>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">{invoice.customer.charAt(0)}</div>
                          <span>{invoice.customer}</span>
                        </div>
                      </td>
                      <td>
                        <span className="type-badge">{invoice.type}</span>
                      </td>
                      <td>
                        <span className="items-text">{invoice.items.length} Product(s)</span>
                      </td>
                      <td>
                        <span className="amount-value">{formatMoney(invoice.amount)}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBgClass(invoice.status)}`}>{invoice.status}</span>
                      </td>
                      <td>
                        <button className="action-btn">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No invoices found for the selected filters</div>
              <button className="primary-btn" onClick={onCreateInvoice}>
                Create First Invoice
              </button>
            </div>
          )}
        </article>
      </section>

      {/* Quick Stats Footer */}
      <section className="stats-footer">
        <div className="stat-item">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-number">{stats.totalInvoices}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Success Rate</div>
          <div className="stat-number">{stats.conversionRate.toFixed(0)}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Outstanding Balance</div>
          <div className="stat-number">
            {formatMoney(
              data.invoices.filter((inv) => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.amount, 0)
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
