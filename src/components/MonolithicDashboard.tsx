import { useState, useMemo } from 'react'
import type { DashboardPayload, InvoiceType, Invoice } from '../types/dashboard'
import '../styles/jewellery-dashboard.css'

interface MonolithicDashboardProps {
  data: DashboardPayload
  formatMoney: (value: number, currency?: 'INR' | 'USD') => string
  formatInvoiceType: (type: InvoiceType | string) => string
  onCreateInvoice: () => void
}

export function MonolithicDashboard({
  data,
  formatMoney,
  formatInvoiceType,
  onCreateInvoice
}: MonolithicDashboardProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'invoices' | 'allInvoices' | 'customers'>('dashboard')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Draft'>('All')
  const [viewingInvoiceTemplate, setViewingInvoiceTemplate] = useState<Invoice | null>(null)

  const billingStats = useMemo(() => {
    const invoices = data.invoices
    const paidInvoices = invoices.filter((inv) => inv.status === 'Paid')
    const pendingInvoices = invoices.filter((inv) => inv.status === 'Pending')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      averageOrderValue: invoices.length > 0 ? totalAmount / invoices.length : 0,
      conversionRate: invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    }
  }, [data.invoices])

  const filteredInvoices = useMemo(() => {
    let filtered = data.invoices

    if (statusFilter !== 'All') {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    return filtered.filter(inv => 
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data.invoices, statusFilter, searchTerm])

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const printInvoice = () => {
    window.print()
  }

  return (
    <div className="jewellery-dashboard">
      {/* ===== HEADER ===== */}
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-title">
            <h1>💎 Akash Jewellers</h1>
            <p>Premium Gold, Platinum & Silver Shop</p>
          </div>
          <button className="btn-create-invoice" onClick={onCreateInvoice}>
            ✨ Create New Invoice
          </button>
        </div>

        {/* Navigation */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-tab ${activeView === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveView('invoices')}
          >
            📋 Invoices ({data.invoices.length})
          </button>
          <button 
            className={`nav-tab ${activeView === 'allInvoices' ? 'active' : ''}`}
            onClick={() => setActiveView('allInvoices')}
          >
            📑 All Invoices ({data.invoices.length})
          </button>
          <button 
            className={`nav-tab ${activeView === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveView('customers')}
          >
            👥 Customers
          </button>
        </div>
      </div>

      {/* ===== DASHBOARD VIEW ===== */}
      {activeView === 'dashboard' && (
        <div className="view-content dashboard-view">
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <p className="kpi-label">Total Revenue</p>
                <h3 className="kpi-value">{formatMoney(billingStats.totalRevenue)}</h3>
                <span className="kpi-meta">{billingStats.paidInvoices} paid invoices</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">📈</div>
              <div className="kpi-content">
                <p className="kpi-label">Today's Sales</p>
                <h3 className="kpi-value">{formatMoney(data.overview.revenue)}</h3>
                <span className="kpi-meta">+{data.overview.revenueDeltaPercent}% vs yesterday</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">⏳</div>
              <div className="kpi-content">
                <p className="kpi-label">Pending Amount</p>
                <h3 className="kpi-value">{formatMoney(billingStats.pendingAmount)}</h3>
                <span className="kpi-meta">{billingStats.pendingInvoices} invoices</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">✅</div>
              <div className="kpi-content">
                <p className="kpi-label">Conversion Rate</p>
                <h3 className="kpi-value">{billingStats.conversionRate.toFixed(1)}%</h3>
                <span className="kpi-meta">Paid ratio</span>
              </div>
            </div>
          </div>

          {/* Metals Section */}
          <div className="metals-section">
            <h2>🥇 Live Metal Prices</h2>
            <div className="metals-grid">
              {data.marketRates.map((rate) => (
                <div key={rate.metal} className="metal-card">
                  <h4>{rate.metal}</h4>
                  <p className="price">{formatMoney(rate.pricePerGram, rate.currency as any)}/gram</p>
                  <p className={`change ${rate.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {rate.changePercent >= 0 ? '↑' : '↓'} {Math.abs(rate.changePercent)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="recent-section">
            <h2>📋 Recent Invoices</h2>
            <div className="invoice-list">
              {data.invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.invoiceId} className="invoice-row">
                  <div className="invoice-info">
                    <div className="invoice-header">
                      <strong>{invoice.customer}</strong>
                      <span className={`badge status-${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="invoice-details">
                      <span>{invoice.invoiceId}</span>
                      <span>{formatInvoiceType(invoice.type)}</span>
                    </div>
                  </div>
                  <div className="invoice-amount">
                    {formatMoney(invoice.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== INVOICES VIEW ===== */}
      {activeView === 'invoices' && (
        <div className="view-content invoices-view">
          <div className="filters">
            <input
              type="text"
              placeholder="Search by customer or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {selectedInvoice ? (
            <div className="invoice-details-view">
              <button className="btn-back" onClick={() => setSelectedInvoice(null)}>
                ← Back
              </button>
              
              <div className="invoice-detail-card">
                <div className="invoice-header-detail">
                  <h2>Invoice #{selectedInvoice.invoiceId}</h2>
                  <span className={`badge status-${selectedInvoice.status.toLowerCase()}`}>
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Customer</label>
                    <p>{selectedInvoice.customer}</p>
                  </div>
                  <div className="detail-item">
                    <label>Metal Type</label>
                    <p>{formatInvoiceType(selectedInvoice.type)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Items</label>
                    <p>{selectedInvoice.items}</p>
                  </div>
                  <div className="detail-item">
                    <label>Amount</label>
                    <p className="amount">{formatMoney(selectedInvoice.amount)}</p>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn-secondary"
                    onClick={() => setViewingInvoiceTemplate(selectedInvoice)}
                  >
                    📋 View Invoice
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="invoices-table">
              {filteredInvoices.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Metal Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.invoiceId}>
                          <td>
                            <code>{invoice.invoiceId}</code>
                          </td>
                          <td>{invoice.customer}</td>
                          <td>
                            <span className="metal-badge">
                              {formatInvoiceType(invoice.type)}
                            </span>
                          </td>
                          <td className="amount-cell">
                            {formatMoney(invoice.amount)}
                          </td>
                          <td>
                            <span className={`badge status-${invoice.status.toLowerCase()}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-view"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No invoices found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ALL INVOICES VIEW ===== */}
      {activeView === 'allInvoices' && (
        <div className="view-content all-invoices-view">
          <div className="all-invoices-header">
            <h2>📑 All Invoices</h2>
            <p className="invoice-count">Total: {data.invoices.length} invoices</p>
          </div>

          <div className="all-invoices-table">
            {data.invoices.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Customer</th>
                      <th>Metal Type</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((invoice) => (
                      <tr key={invoice.invoiceId}>
                        <td>
                          <code>{invoice.invoiceId}</code>
                        </td>
                        <td>{invoice.customer}</td>
                        <td>
                          <span className="metal-badge">
                            {formatInvoiceType(invoice.type)}
                          </span>
                        </td>
                        <td>{invoice.items}</td>
                        <td className="amount-cell">
                          {formatMoney(invoice.amount)}
                        </td>
                        <td>
                          <span className={`badge status-${invoice.status.toLowerCase()}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>{new Date().toLocaleDateString('en-IN')}</td>
                        <td>
                          <button
                            className="btn-download"
                            onClick={() => setViewingInvoiceTemplate(invoice)}
                            title="View invoice template"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No invoices found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CUSTOMERS VIEW ===== */}
      {activeView === 'customers' && (
        <div className="view-content customers-view">
          <div className="customers-grid">
            {[...new Set(data.invoices.map(inv => inv.customer))].map((customer) => {
              const customerInvoices = data.invoices.filter(inv => inv.customer === customer)
              const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.amount, 0)

              return (
                <div key={customer} className="customer-card">
                  <div className="customer-avatar">
                    {getInitials(customer)}
                  </div>
                  <h3>{customer}</h3>
                  <div className="customer-stats">
                    <div className="stat">
                      <span className="label">Total Spent</span>
                      <span className="value">{formatMoney(totalSpent)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Purchases</span>
                      <span className="value">{customerInvoices.length}</span>
                    </div>
                  </div>
                  <div className="customer-purchases">
                    {customerInvoices.slice(0, 3).map((inv) => (
                      <div key={inv.invoiceId} className="purchase">
                        <span>{formatInvoiceType(inv.type)}</span>
                        <span className={`status status-${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    {/* ===== BEAUTIFUL INVOICE TEMPLATE ===== */}
    {viewingInvoiceTemplate && (
      <div className="invoice-template-overlay">
        <div className="invoice-template-container">
          <div className="invoice-template-header-controls">
            <button className="btn-close-template" onClick={() => setViewingInvoiceTemplate(null)}>✕ Close</button>
            <button className="btn-print-template" onClick={printInvoice}>🖨️ Print</button>
          </div>

          <div className="invoice-template">
            {/* Header Section */}
            <div className="invoice-header-section">
              <div className="company-branding">
                <h1>💎 AKASH JEWELLERS</h1>
                <p className="subtitle">Premium Gold, Platinum & Silver Shop</p>
              </div>
              <div className="company-contact">
                <p>📱 +91-XXXXXXXXXX</p>
                <p>✉️ info@akashjewellers.com</p>
                <p>📍 Address, City, State</p>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="invoice-title-section">
              <h2>INVOICE</h2>
              <div className={`invoice-status-badge status-${viewingInvoiceTemplate!.status.toLowerCase()}`}>
                {viewingInvoiceTemplate!.status}
              </div>
            </div>

            {/* Invoice Info Grid */}
            <div className="invoice-info-grid">
              <div className="info-box">
                <label>Invoice Number</label>
                <p>{viewingInvoiceTemplate!.invoiceId}</p>
              </div>
              <div className="info-box">
                <label>Invoice Date</label>
                <p>{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="info-box">
                <label>GST Number</label>
                <p>27XXXXXXXXXXXXXX01</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="customer-section">
              <h3>Customer Details</h3>
              <div className="detail-grid">
                <div>
                  <strong>Name:</strong> {viewingInvoiceTemplate!.customer}
                </div>
                <div>
                  <strong>Metal Type:</strong> {viewingInvoiceTemplate!.type}
                </div>
                <div>
                  <strong>Items:</strong> {viewingInvoiceTemplate!.items}
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="amount-section">
              <div className="amount-box">
                <div className="amount-label">Subtotal</div>
                <div className="amount-value">{formatMoney(viewingInvoiceTemplate!.amount * 0.88)}</div>
              </div>
              <div className="amount-box highlight">
                <div className="amount-label">GST (12%)</div>
                <div className="amount-value">{formatMoney(viewingInvoiceTemplate!.amount * 0.12)}</div>
              </div>
              <div className="amount-box total">
                <div className="amount-label">Total Amount</div>
                <div className="amount-value-large">{formatMoney(viewingInvoiceTemplate!.amount)}</div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="payment-section">
              <div className="payment-status">
                <strong>Payment Status:</strong> {viewingInvoiceTemplate!.status}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="terms-section">
              <h4>Terms & Conditions</h4>
              <ul>
                <li>Items are sold as per description provided</li>
                <li>No returns or refunds accepted after 7 days</li>
                <li>All prices are inclusive of GST</li>
                <li>Payment method as per invoice status</li>
                <li>Please keep this invoice for warranty purposes</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
              <div className="signature-section">
                <div className="signature-line"></div>
                <p>Authorized Signatory</p>
              </div>
              <p className="footer-text">Thank you for choosing Akash Jewellers! 🙏</p>
              <p className="generated-date">Generated on {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
