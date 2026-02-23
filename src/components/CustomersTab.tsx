import { useState, useMemo, useEffect } from 'react'
import type { Invoice } from '../types/dashboard'
import { useCustomers } from '../hooks/useCustomers'
import type { CustomerProfile } from '../hooks/useCustomers'

// Mocking the notification system since it was not found, we'll use a simple alert/console fallback
const useNotification = () => {
    return {
        showNotification: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`)
            if (type === 'error' || type === 'warning') alert(`${title}\n${message}`)
        }
    }
}

import '../styles/customers-tab.css'

interface CustomersTabProps {
    invoices: Invoice[]
    formatMoney: (value: number, currency?: 'INR' | 'USD') => string
    onViewInvoice?: (invoiceId: string) => void
}

export function CustomersTab({ invoices, formatMoney, onViewInvoice }: CustomersTabProps) {
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers(invoices)
    const { showNotification } = useNotification()

    // State
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [filterCriteria, setFilterCriteria] = useState<'All' | 'Outstanding' | 'Top'>('All')
    const [currentPage, setCurrentPage] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null)
    const [viewingCustomer, setViewingCustomer] = useState<CustomerProfile | null>(null)

    const itemsPerPage = 8

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(0)
    }, [debouncedSearch, filterCriteria])

    // Derived Data
    const filteredCustomers = useMemo(() => {
        let result = customers

        // Search
        if (debouncedSearch) {
            const lowerSearch = debouncedSearch.toLowerCase()
            result = result.filter(
                c => c.fullName.toLowerCase().includes(lowerSearch) ||
                    c.mobileNumber.includes(lowerSearch) ||
                    c.gstNumber?.toLowerCase().includes(lowerSearch)
            )
        }

        // Filter
        if (filterCriteria === 'Outstanding') {
            result = result.filter(c => c.outstandingBalance > 0)
        } else if (filterCriteria === 'Top') {
            // Top 20% or min 5 purchases
            result = [...result].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, Math.max(5, Math.floor(result.length * 0.2)))
        }

        return result
    }, [customers, debouncedSearch, filterCriteria])

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
    const paginatedCustomers = filteredCustomers.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )

    // Export Handlers
    const handleExportCSV = () => {
        try {
            const headers = ['Name,Phone,Address,Total Purchases,Outstanding Balance,Last Purchase']
            const rows = filteredCustomers.map(c =>
                `"${c.fullName}","${c.mobileNumber}","${c.address || ''}","${c.totalPurchases}","${c.outstandingBalance}","${c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString() : 'N/A'}"`
            )
            const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n")
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            showNotification('Success', 'CSV Export downloaded successfully', 'success')
        } catch (e) {
            showNotification('Error', 'Failed to export CSV', 'error')
        }
    }

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=800')
        if (!printWindow) return

        const tableRows = filteredCustomers.map(c => `
      <tr>
        <td style="padding:10px; border:1px solid #e2e8f0;">${c.fullName}</td>
        <td style="padding:10px; border:1px solid #e2e8f0;">${c.mobileNumber}</td>
        <td style="padding:10px; border:1px solid #e2e8f0;">${c.address || '-'}</td>
        <td style="padding:10px; border:1px solid #e2e8f0;">${formatMoney(c.totalPurchases).replace('₹', '')}</td>
        <td style="padding:10px; border:1px solid #e2e8f0;">${formatMoney(c.outstandingBalance).replace('₹', '')}</td>
      </tr>
    `).join('')

        printWindow.document.write(`
      <html>
        <head>
          <title>Customer Export PDF</title>
          <style>body{font-family:sans-serif;color:#1e293b;} table{border-collapse:collapse;width:100%;} th{background:#f8fafc;padding:10px;border:1px solid #e2e8f0;text-align:left;}</style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>Customer Directory</h2>
          <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Total Purchases</th><th>Balance Due</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `)
        printWindow.document.close()
    }

    // Delete Handler
    const handleDelete = (customer: CustomerProfile) => {
        try {
            if (customer.invoices.length > 0) {
                showNotification('Cannot Delete', `${customer.fullName} has ${customer.invoices.length} billed invoices. Delete invoices first.`, 'warning')
                return
            }
            if (window.confirm(`Are you sure you want to delete ${customer.fullName}?`)) {
                deleteCustomer(customer.id)
                showNotification('Success', 'Customer deleted successfully', 'success')
                if (viewingCustomer?.id === customer.id) setViewingCustomer(null)
            }
        } catch (error: any) {
            showNotification('Error', error.message, 'error')
        }
    }

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    // Views
    if (viewingCustomer) {
        return <CustomerDetailsView
            customer={viewingCustomer}
            onBack={() => setViewingCustomer(null)}
            onEdit={() => { setEditingCustomer(viewingCustomer); setIsModalOpen(true); }}
            formatMoney={formatMoney}
            onViewInvoice={onViewInvoice}
        />
    }

    return (
        <div className="customers-tab-modern">
            {/* Top Header */}
            <div className="customers-header-premium">
                <div>
                    <h2><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Customers</h2>
                    <p className="subtitle-modern">Manage and view all customer details, outstanding balances, and purchase history.</p>
                </div>
                <div className="header-actions-right">
                    <div className="search-wrapper-modern">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            className="search-input-modern"
                            placeholder="Search Name, Phone, GST..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filters & Export */}
            <div className="filters-row-modern">
                <div className="filter-pills">
                    <button className={`filter-pill ${filterCriteria === 'All' ? 'active' : ''}`} onClick={() => setFilterCriteria('All')}>All Customers</button>
                    <button className={`filter-pill ${filterCriteria === 'Outstanding' ? 'active' : ''}`} onClick={() => setFilterCriteria('Outstanding')}>Outstanding Balance</button>
                    <button className={`filter-pill ${filterCriteria === 'Top' ? 'active' : ''}`} onClick={() => setFilterCriteria('Top')}>Top Customers</button>
                </div>
                <div className="export-actions">
                    <button className="btn-export" onClick={handleExportPDF}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> PDF
                    </button>
                    <button className="btn-export" onClick={handleExportCSV}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Excel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-card-wrapper" style={{ overflowX: 'auto' }}>
                <table className="customers-modern-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Mobile Number</th>
                            <th>Address</th>
                            <th>Total Purchases</th>
                            <th>Outstanding</th>
                            <th>Last Purchase</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCustomers.map((customer) => (
                            <tr key={customer.id}>
                                <td data-label="Customer Name">
                                    <div className="cust-name-cell">
                                        <div className="cust-avatar-mini">{getInitials(customer.fullName)}</div>
                                        <div>
                                            <div className="cust-name-text">{customer.fullName}</div>
                                            {customer.isManual && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Manually Added</span>}
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Mobile Number">
                                    <div className="cust-name-text">{customer.mobileNumber || '-'}</div>
                                </td>
                                <td data-label="Address">{customer.address || '-'}</td>
                                <td data-label="Total Purchases" className="money-text">{formatMoney(customer.totalPurchases)}</td>
                                <td data-label="Outstanding">
                                    {customer.outstandingBalance > 0 ? (
                                        <span className="status-badge red" title={formatMoney(customer.outstandingBalance)}>Pending Payment</span>
                                    ) : (
                                        <span className="status-badge green">No Due</span>
                                    )}
                                </td>
                                <td data-label="Last Purchase">{customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                                <td data-label="Actions">
                                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                                        <button className="action-icon-btn view" title="View Details" onClick={() => setViewingCustomer(customer)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                        <button className="action-icon-btn edit" title="Edit Customer" onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button
                                            className="action-icon-btn delete"
                                            title={customer.invoices.length > 0 ? "Cannot delete: Invoices exist" : "Delete Customer"}
                                            disabled={customer.invoices.length > 0}
                                            onClick={() => handleDelete(customer)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedCustomers.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No customers found matching the criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Wrapper */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                style={{ padding: '6px 12px', background: currentPage === 0 ? '#f1f5f9' : 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', color: currentPage === 0 ? '#94a3b8' : '#1e293b', fontWeight: 'bold' }}
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                style={{ padding: '6px 12px', background: currentPage >= totalPages - 1 ? '#f1f5f9' : 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', color: currentPage >= totalPages - 1 ? '#94a3b8' : '#1e293b', fontWeight: 'bold' }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <CustomerFormModal
                    onClose={() => setIsModalOpen(false)}
                    existingCustomer={editingCustomer}
                    onSave={(data) => {
                        try {
                            if (editingCustomer) {
                                updateCustomer({ ...editingCustomer, ...data })
                                showNotification('Success', 'Customer updated successfully', 'success')
                            } else {
                                addCustomer(data as any)
                                showNotification('Success', 'Customer added successfully', 'success')
                            }
                            setIsModalOpen(false)
                        } catch (err: any) {
                            showNotification('Error', err.message, 'error')
                        }
                    }}
                />
            )}
        </div>
    )
}

// ============================================
// Add/Edit Form Modal Component
// ============================================
function CustomerFormModal({ onClose, existingCustomer, onSave }: { onClose: () => void, existingCustomer: CustomerProfile | null, onSave: (data: any) => void }) {
    const [formData, setFormData] = useState({
        fullName: existingCustomer?.fullName || '',
        mobileNumber: existingCustomer?.mobileNumber || '',
        email: existingCustomer?.email || '',
        address: existingCustomer?.address || '',
        city: existingCustomer?.city || '',
        state: existingCustomer?.state || '',
        pincode: existingCustomer?.pincode || '',
        gstNumber: existingCustomer?.gstNumber || '',
        notes: existingCustomer?.notes || '',
        creditLimit: existingCustomer?.creditLimit || 0
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = () => {
        let newErrors: Record<string, string> = {}
        if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required'
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required'
        else if (!/^\+?[\d\s-]{10,15}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Invalid mobile number format'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    return (
        <div className="modern-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modern-modal-content">
                <div className="modern-modal-header">
                    <h3>{existingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                    <button className="modal-close-btn" onClick={onClose}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>

                <div className="modern-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    {/* Col 1 */}
                    <div className="floating-input-group" style={{ gridColumn: 'span 2' }}>
                        <input type="text" className="floating-input" placeholder=" " value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} disabled={!!existingCustomer && !existingCustomer.isManual && existingCustomer.invoices.length > 0} />
                        <label className="floating-label">Full Name * {!!existingCustomer && !existingCustomer.isManual && existingCustomer.invoices.length > 0 && '(Locked - Derived from Invoice)'}</label>
                        {errors.fullName && <span className="input-error-text">{errors.fullName}</span>}
                    </div>

                    <div className="floating-input-group">
                        <input type="text" className="floating-input" placeholder=" " value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} />
                        <label className="floating-label">Mobile Number *</label>
                        {errors.mobileNumber && <span className="input-error-text">{errors.mobileNumber}</span>}
                    </div>

                    <div className="floating-input-group">
                        <input type="email" className="floating-input" placeholder=" " value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <label className="floating-label">Email Address (Optional)</label>
                    </div>

                    <div className="floating-input-group" style={{ gridColumn: 'span 2' }}>
                        <input type="text" className="floating-input" placeholder=" " value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        <label className="floating-label">Full Address (Optional)</label>
                    </div>

                    <div className="floating-input-group">
                        <input type="text" className="floating-input" placeholder=" " value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        <label className="floating-label">City (Optional)</label>
                    </div>

                    <div className="floating-input-group">
                        <input type="text" className="floating-input" placeholder=" " value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                        <label className="floating-label">State (Optional)</label>
                    </div>

                    <div className="floating-input-group">
                        <input type="text" className="floating-input" placeholder=" " value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
                        <label className="floating-label">GST Number (Optional)</label>
                    </div>

                    <div className="floating-input-group">
                        <input type="number" className="floating-input" placeholder=" " value={formData.creditLimit || ''} onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })} />
                        <label className="floating-label">Credit Limit ₹ (Optional)</label>
                    </div>
                </div>

                <div className="modern-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-gold-gradient" onClick={() => { if (validate()) onSave(formData) }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        Save Customer
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Detail View Component
// ============================================
function CustomerDetailsView({ customer, onBack, onEdit, formatMoney, onViewInvoice }: { customer: CustomerProfile, onBack: () => void, onEdit: () => void, formatMoney: (v: number) => string, onViewInvoice?: (id: string) => void }) {
    const [activeTab, setActiveTab] = useState<'purchases' | 'payments'>('purchases')

    return (
        <div className="details-view-container">
            <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#64748b', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to Customers
            </button>

            {/* Top Stat Card */}
            <div className="details-top-card">
                <div className="details-header-main">
                    <div className="details-avatar-large">{customer.fullName.substring(0, 2).toUpperCase()}</div>
                    <div className="details-info">
                        <h1>{customer.fullName}</h1>
                        <p>
                            <span>📞 {customer.mobileNumber || 'N/A'}</span>
                            <span>✉️ {customer.email || 'N/A'}</span>
                            <span>📍 {customer.city || customer.address || 'Address not listed'}</span>
                        </p>
                    </div>
                </div>
                <div className="details-stats-group">
                    <div className="d-stat"><span className="label">Total Spent</span><span className="val gold">{formatMoney(customer.totalPurchases)}</span></div>
                    <div className="d-stat"><span className="label">Paid</span><span className="val green">{formatMoney(customer.totalPaid)}</span></div>
                    <div className="d-stat"><span className="label">Outstanding</span><span className={`val ${customer.outstandingBalance > 0 ? 'red' : 'green'}`}>{formatMoney(customer.outstandingBalance)}</span></div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '-10px' }}>
                <button className="btn-gold-gradient" onClick={onEdit} style={{ padding: '8px 16px' }}>Edit Profile</button>
            </div>

            <div className="details-tabs-body">
                <div className="details-tab-nav">
                    <div className={`d-tab ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>Purchase History</div>
                    <div className={`d-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Payment Ledger</div>
                </div>

                {activeTab === 'purchases' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="customers-modern-table" style={{ borderTop: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Invoice No.</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customer.invoices.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No purchase history found.</td></tr>
                                ) : (
                                    customer.invoices.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((inv: any) => (
                                        <tr key={inv.invoiceId}>
                                            <td style={{ fontWeight: 800, color: '#1e3a8a' }}>#{inv.invoiceId}</td>
                                            <td>{new Date(inv.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                            <td className="money-text">{formatMoney(inv.amount)}</td>
                                            <td className="money-text" style={{ color: inv.status === 'Paid' ? '#059669' : '#94a3b8' }}>{inv.status === 'Paid' ? formatMoney(inv.amount) : formatMoney(0)}</td>
                                            <td className="money-text">{inv.status === 'Pending' ? <span className="status-badge red">{formatMoney(inv.amount)}</span> : <span className="status-badge green">Paid</span>}</td>
                                            <td>
                                                <button className="action-icon-btn view" title="View Invoice" onClick={() => onViewInvoice?.(inv.invoiceId)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" style={{ marginBottom: '16px' }}><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        <p>Payment ledger functionality is scheduled for a future update. <br /> Currently, full invoice amounts are considered settled when marked "Paid".</p>
                    </div>
                )}

            </div >
        </div >
    )
}
