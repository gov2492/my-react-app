import { useState, useMemo, useEffect } from 'react'
import type { DashboardPayload, InvoiceType, Invoice } from '../types/dashboard'
import '../styles/jewellery-dashboard.css'

interface MonolithicDashboardProps {
  data: DashboardPayload
  formatMoney: (value: number, currency?: 'INR' | 'USD') => string
  formatInvoiceType: (type: InvoiceType | string) => string
  onCreateInvoice: () => void
  jewellerName: string
  shopAddress: string
  shopContact: string
  shopGst: string
  shopEmail: string
  externalTab?: string
}

export function MonolithicDashboard({
  data,
  formatMoney,
  formatInvoiceType,
  onCreateInvoice,
  jewellerName,
  shopAddress,
  shopContact,
  shopGst,
  shopEmail,
  externalTab
}: MonolithicDashboardProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'invoices' | 'allInvoices' | 'customers'>(() => {
    if (externalTab === 'Customers') return 'customers'
    if (externalTab === 'Billing') return 'invoices'
    return 'dashboard'
  })

  useEffect(() => {
    if (externalTab === 'Customers') setActiveView('customers')
    if (externalTab === 'Billing') setActiveView('invoices')
    if (externalTab === 'Dashboard') setActiveView('dashboard')
  }, [externalTab])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Draft'>('All')
  const [viewingInvoiceTemplate, setViewingInvoiceTemplate] = useState<Invoice | null>(null)

  useEffect(() => {
    const handleOpenPreview = (e: any) => {
      const createdId = e.detail;
      const invoice = data.invoices.find(inv => inv.invoiceId === createdId);
      if (invoice) {
        setViewingInvoiceTemplate(invoice);
        setTimeout(() => window.print(), 300);
      }
    };
    window.addEventListener('openInvoicePreview', handleOpenPreview);
    return () => window.removeEventListener('openInvoicePreview', handleOpenPreview);
  }, [data.invoices]);

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
            <h1>💎 {jewellerName}</h1>
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
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <label>Items</label>
                    <div className="items-table" style={{ marginTop: '0.5rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <thead style={{ backgroundColor: '#f8fafc', color: '#1e3a8a' }}>
                          <tr>
                            <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.85rem' }}>Description</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.85rem' }}>Details</th>
                            <th style={{ padding: '0.8rem', textAlign: 'right', fontSize: '0.85rem' }}>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items.map((item, idx) => (
                            <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem', fontWeight: 500, color: '#1e3a8a' }}>{item.description}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.85rem', color: '#64748b' }}>
                                ₹{item.rate}/g • {formatInvoiceType(item.type)}<br />
                                <span style={{ fontSize: '0.75rem' }}>MC: {item.makingChargePercent}% | GST: {item.gstRatePercent}%</span>
                              </td>
                              <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 600, color: '#1e3a8a' }}>{item.weight}g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                        <td>
                          <div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '0.85rem', maxWidth: '300px' }}>
                            {invoice.items.map((item, idx) => (
                              <div key={idx} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                <strong>{item.weight}g</strong> {item.description}
                              </div>
                            ))}
                          </div>
                        </td>
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

              if (totalSpent <= 0) return null;

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
                    <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recent Purchases</h4>
                    {customerInvoices.slice(0, 3).map((inv) => (
                      <div key={inv.invoiceId} className="purchase-detail-card" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '0.85rem' }}>#{inv.invoiceId}</span>
                          <span className={`status status-${inv.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', margin: 0 }}>
                            {inv.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inv.items?.map(i => i.description).join(', ') || 'No items listed'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: '#059669', fontWeight: 'bold' }}>{formatMoney(inv.amount)}</span>
                          <span style={{ color: '#94a3b8' }}>
                            {new Date(inv.createdAt || (inv as any).issueDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
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
                  <h1>{jewellerName}</h1>
                  <div className="subtitle">Premium Jewellery Retailer</div>
                  <div className="company-contact">
                    <p>GSTIN: {shopGst || '27XXXXXXXXXXXXXX01'}</p>
                    <p>{shopAddress || '123 Jewellery Park, Main Market, City'}</p>
                    <p>📞 {shopContact || '+91-XXXXXXXXXX'} | ✉️ {shopEmail || (data.invoices.length > 0 ? `info@${jewellerName.toLowerCase().replace(/\s+/g, '')}.com` : 'info@luxegem.local')}</p>
                  </div>
                </div>
                <div className="invoice-meta">
                  <h2 className="invoice-title">INVOICE</h2>
                  <div className="invoice-meta-item">
                    <span className="invoice-meta-label">Invoice No:</span>
                    <span className="invoice-meta-value">{viewingInvoiceTemplate!.invoiceId}</span>
                  </div>
                  <div className="invoice-meta-item">
                    <span className="invoice-meta-label">Date:</span>
                    <span className="invoice-meta-value">
                      {viewingInvoiceTemplate!.createdAt || (viewingInvoiceTemplate as any).issueDate
                        ? new Date(viewingInvoiceTemplate!.createdAt || (viewingInvoiceTemplate as any).issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="customer-section">
                <div className="customer-column">
                  <h3>Bill To</h3>
                  <div className="customer-row">
                    <span className="label">Customer Name:</span>
                    <span className="value">{viewingInvoiceTemplate!.customer}</span>
                  </div>
                  <div className="customer-row">
                    <span className="label">Mobile Number:</span>
                    <span className="value">{viewingInvoiceTemplate!.mobilenumber || 'N/A'}</span>
                  </div>
                  <div className="customer-row">
                    <span className="label">Address:</span>
                    <span className="value">{viewingInvoiceTemplate!.address || 'N/A'}</span>
                  </div>
                </div>
                <div className="customer-column">
                  <h3>Invoice Details</h3>
                  <div className="customer-row">
                    <span className="label">Salesperson:</span>
                    <span className="value">Admin / Staff</span>
                  </div>
                  <div className="customer-row">
                    <span className="label">Status:</span>
                    <span className="value">{viewingInvoiceTemplate!.status}</span>
                  </div>
                  <div className="customer-row">
                    <span className="label">Payment Type:</span>
                    <span className="value">{viewingInvoiceTemplate!.paymentMethod || 'Cash'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table Section */}
              <div className="invoice-items-section">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th className="col-center">Sr.No</th>
                      <th className="col-left">Description</th>
                      <th className="col-center">Metal Type</th>
                      <th className="col-center">Purity</th>
                      <th className="col-right">Weight (g)</th>
                      <th className="col-right">Rate (₹/g)</th>
                      <th className="col-right">MC (%)</th>
                      <th className="col-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoiceTemplate!.items.map((item, idx) => {
                      const base = item.weight * item.rate;
                      const mc = base * (item.makingChargePercent / 100);
                      const totalBeforeGst = base + mc;

                      // Display logic: show type dynamically (e.g. GOLD_22K -> GOLD, 22K)
                      const parts = item.type.split('_');
                      const metalStr = parts[0] || item.type;
                      const purityStr = parts[1] || '-';

                      return (
                        <tr key={idx}>
                          <td className="col-center">{idx + 1}</td>
                          <td className="col-left item-desc">{item.description}</td>
                          <td className="col-center">{metalStr}</td>
                          <td className="col-center">{purityStr}</td>
                          <td className="col-right">{item.weight.toFixed(3)}</td>
                          <td className="col-right">{formatMoney(item.rate).replace('₹', '')}</td>
                          <td className="col-right">{item.makingChargePercent}%</td>
                          <td className="col-right">{formatMoney(totalBeforeGst).replace('₹', '')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Calculations Section */}
              <div className="invoice-summary-section">
                <div className="summary-box">
                  <div className="summary-row">
                    <span>Base Amount</span>
                    <span className="value">{formatMoney(viewingInvoiceTemplate!.items.reduce((acc, curr) => acc + (curr.weight * curr.rate), 0))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total Making Charges</span>
                    <span className="value">{formatMoney(viewingInvoiceTemplate!.items.reduce((acc, curr) => acc + ((curr.weight * curr.rate) * (curr.makingChargePercent / 100)), 0))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Subtotal Before GST</span>
                    <span className="value">{formatMoney(viewingInvoiceTemplate!.grossAmount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Add: Total GST ({viewingInvoiceTemplate?.items[0]?.gstRatePercent || 3}%)</span>
                    <span className="value">{formatMoney(viewingInvoiceTemplate!.amount - viewingInvoiceTemplate!.grossAmount + viewingInvoiceTemplate!.discount)}</span>
                  </div>
                  {viewingInvoiceTemplate!.discount > 0 && (
                    <div className="summary-row">
                      <span>Less: Discount</span>
                      <span className="value" style={{ color: '#dc2626' }}>- {formatMoney(viewingInvoiceTemplate!.discount)}</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span>Net Payable</span>
                    <span className="value">{formatMoney(viewingInvoiceTemplate!.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="invoice-bottom-layout">
                <div className="terms-box">
                  <h4>Terms & Conditions</h4>
                  <ul>
                    <li>Goods once sold will not be taken back without proper bill.</li>
                    <li>Exchange is valid within 7 days in original condition.</li>
                    <li>All disputes are subject to local jurisdiction only.</li>
                    <li>Making charges and GST are applicable as per government norms.</li>
                    <li>Please keep this invoice safely for warranty and future exchange.</li>
                  </ul>
                </div>

                <div className="signature-box">
                  <div className="line"></div>
                  <p>Authorized Signatory</p>
                  <span>For {jewellerName}</span>
                </div>
              </div>

              <div className="thank-you-msg">
                Thank you for shopping with us! Looking forward to serving you again.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
