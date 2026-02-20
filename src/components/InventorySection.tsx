import { useState, useMemo } from 'react'
import type { InventoryItem, InvoiceType } from '../types/dashboard'
import '../styles/inventory.css'

interface InventoryProps {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  searchQuery: string
  formatMoney: (value: number) => string
  formatInvoiceType: (type: InvoiceType) => string
  formatDateTime: (value: string) => string
  onAddClick: () => void
}

export function InventorySection({
  items,
  loading,
  error,
  searchQuery,
  formatMoney,
  formatInvoiceType,
  formatDateTime,
  onAddClick
}: InventoryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'price' | 'updated'>('updated')
  const [filterType, setFilterType] = useState<string>('All')

  // Get unique types for filter
  const types = useMemo(() => {
    const unique = new Set(items.map(item => item.type))
    return Array.from(unique)
  }, [items])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items

    if (filterType !== 'All') {
      filtered = filtered.filter(item => item.type === filterType)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.sku.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.itemName.localeCompare(b.itemName)
        case 'qty':
          return b.quantity - a.quantity
        case 'price':
          return b.unitPrice - a.unitPrice
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
  }, [items, searchQuery, filterType, sortBy])

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      totalItems: items.length,
      uniqueSKUs: new Set(items.map(i => i.sku)).size,
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
      lowStock: items.filter(item => item.quantity <= 5).length
    }
  }, [items])

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'GOLD_18K':
        return '#FFD700'
      case 'GOLD_22K':
        return '#FFA500'
      case 'GOLD_24K':
        return '#FF8C00'
      case 'SILVER':
        return '#C0C0C0'
      case 'PLATINUM':
        return '#E5E4E2'
      case 'DIAMOND':
        return '#B9F3FF'
      default:
        return '#9CA3AF'
    }
  }

  const getStockStatus = (quantity: number): { label: string; className: string } => {
    if (quantity === 0) return { label: 'Out of Stock', className: 'stock-critical' }
    if (quantity <= 5) return { label: 'Low Stock', className: 'stock-low' }
    if (quantity <= 20) return { label: 'Medium', className: 'stock-medium' }
    return { label: 'In Stock', className: 'stock-high' }
  }

  if (loading) {
    return <div className="inventory-loading">
      <div className="spinner"></div>
      <p>Loading inventory...</p>
    </div>
  }

  if (error) {
    return <div className="inventory-error">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
    </div>
  }

  return (
    <div className="inventory-container">
      {/* Header with Stats */}
      <div className="inventory-header">
        <div className="header-content">
          <h1>📦 Inventory Management</h1>
          <p>Manage your jewelry stock efficiently</p>
        </div>
        <button className="add-item-btn" onClick={onAddClick}>
          ✨ Add New Item
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.totalItems}</div>
            <div className="stat-detail">In inventory</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-label">Unique SKUs</div>
            <div className="stat-value">{stats.uniqueSKUs}</div>
            <div className="stat-detail">Different items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Value</div>
            <div className="stat-value">{formatMoney(stats.totalValue)}</div>
            <div className="stat-detail">Stock worth</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-detail">Items to reorder</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="inventory-controls">
        <div className="control-group">
          <label>Filter by Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="All">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{formatInvoiceType(type)}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
            <option value="updated">Recently Updated</option>
            <option value="name">Item Name</option>
            <option value="qty">Quantity</option>
            <option value="price">Unit Price</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            ⊞ Grid
          </button>
          <button
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            ≡ Table
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Showing <span className="result-count">{filteredItems.length}</span> of <span className="total-count">{items.length}</span> items
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="inventory-grid">
          {filteredItems.length === 0 ? (
            <div className="no-items">
              <div className="no-items-icon">🛍️</div>
              <p>No items found</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const stockStatus = getStockStatus(item.quantity)
              return (
                <div key={item.sku} className="inventory-card">
                  <div className="card-header">
                    <div className="type-badge" style={{ backgroundColor: getTypeColor(item.type) }}>
                      {formatInvoiceType(item.type as InvoiceType)}
                    </div>
                    <div className={`stock-badge ${stockStatus.className}`}>
                      {stockStatus.label}
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="item-name">{item.itemName}</div>
                    <div className="item-sku">SKU: {item.sku}</div>

                    <div className="item-details">
                      <div className="detail-row">
                        <span className="detail-label">Weight:</span>
                        <span className="detail-value">{item.weightGrams.toFixed(3)}g</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Quantity:</span>
                        <span className="detail-value qty-value">{item.quantity}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Unit Price:</span>
                        <span className="detail-value price-value">{formatMoney(item.unitPrice)}</span>
                      </div>
                    </div>

                    <div className="item-total">
                      Total: <strong>{formatMoney(item.quantity * item.unitPrice)}</strong>
                    </div>

                    <div className="item-updated">
                      Updated: {formatDateTime(item.updatedAt)}
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="card-action-btn edit">Edit</button>
                    <button className="card-action-btn delete">Delete</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="inventory-table-wrapper">
          {filteredItems.length === 0 ? (
            <div className="no-items">
              <div className="no-items-icon">🛍️</div>
              <p>No items found</p>
            </div>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Weight (g)</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.quantity)
                  const totalValue = item.quantity * item.unitPrice
                  return (
                    <tr key={item.sku} className={stockStatus.className}>
                      <td className="sku-cell"><strong>{item.sku}</strong></td>
                      <td>{item.itemName}</td>
                      <td>
                        <span
                          className="type-tag"
                          style={{ backgroundColor: getTypeColor(item.type), color: '#000' }}
                        >
                          {formatInvoiceType(item.type as InvoiceType)}
                        </span>
                      </td>
                      <td className="numeric">{item.weightGrams.toFixed(3)}</td>
                      <td className="numeric qty-cell">{item.quantity}</td>
                      <td className="numeric">{formatMoney(item.unitPrice)}</td>
                      <td className="numeric total-cell">
                        <strong>{formatMoney(totalValue)}</strong>
                      </td>
                      <td>
                        <span className={`status-badge ${stockStatus.className}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="datetime">{formatDateTime(item.updatedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
