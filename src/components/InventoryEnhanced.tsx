import { useState, useMemo } from 'react'
import type { InventoryItem, InvoiceType } from '../types/dashboard'
import '../styles/inventory-enhanced.css'

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

// Jewelry product images/icons mapping
const jewelryImages: Record<string, string> = {
  'GOLD_18K': '👑',
  'GOLD_22K': '💍',
  'GOLD_24K': '✨',
  'SILVER': '🌙',
  'PLATINUM': '💎',
  'DIAMOND': '💠',
  'OTHER': '🎁'
}

export function InventoryEnhanced({
  items,
  loading,
  error,
  searchQuery,
  formatMoney,
  formatInvoiceType,
  formatDateTime,
  onAddClick
}: InventoryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'gallery'>('gallery')
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'price' | 'updated'>('updated')
  const [filterType, setFilterType] = useState<string>('All')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

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
      lowStock: items.filter(item => item.quantity <= 5).length,
      byType: items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [items])

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'GOLD_18K': '#F4A460',
      'GOLD_22K': '#FFD700',
      'GOLD_24K': '#FFA500',
      'SILVER': '#C0C0C0',
      'PLATINUM': '#E5E4E2',
      'DIAMOND': '#B9F3FF',
      'OTHER': '#DEB887'
    }
    return colors[type] || '#9CA3AF'
  }

  const getStockStatus = (quantity: number): { label: string; className: string; icon: string } => {
    if (quantity === 0) return { label: 'Out of Stock', className: 'stock-critical', icon: '❌' }
    if (quantity <= 5) return { label: 'Low Stock', className: 'stock-low', icon: '⚠️' }
    if (quantity <= 20) return { label: 'Medium', className: 'stock-medium', icon: '📦' }
    return { label: 'In Stock', className: 'stock-high', icon: '✅' }
  }

  if (loading) {
    return <div className="inventory-loading">
      <div className="spinner"></div>
      <p>Loading your precious collection...</p>
    </div>
  }

  if (error) {
    return <div className="inventory-error">
      <div className="error-icon">🚨</div>
      <p>{error}</p>
    </div>
  }

  return (
    <div className="inventory-enhanced-container">
      {/* Hero Header */}
      <div className="inventory-hero">
        <div className="hero-content">
          <h1>✨ Jewelry Inventory</h1>
          <p>Manage your precious collection with elegance</p>
        </div>
        <button className="add-item-btn-hero" onClick={onAddClick}>
          + Add New Item
        </button>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-showcase">
        <div className="stat-showcase-card">
          <div className="stat-icon large">📊</div>
          <div className="stat-showcase-content">
            <div className="stat-number">{stats.totalItems}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>
        <div className="stat-showcase-card">
          <div className="stat-icon large">💰</div>
          <div className="stat-showcase-content">
            <div className="stat-number">{formatMoney(stats.totalValue).split('.')[0]}</div>
            <div className="stat-label">Inventory Value</div>
          </div>
        </div>
        <div className="stat-showcase-card">
          <div className="stat-icon large">⭐</div>
          <div className="stat-showcase-content">
            <div className="stat-number">{stats.uniqueSKUs}</div>
            <div className="stat-label">Unique Items</div>
          </div>
        </div>
        <div className="stat-showcase-card warning">
          <div className="stat-icon large">⚠️</div>
          <div className="stat-showcase-content">
            <div className="stat-number">{stats.lowStock}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="type-distribution">
        <h3>📈 Collection by Type</h3>
        <div className="type-badges-grid">
          {types.map(type => (
            <div 
              key={type} 
              className={`type-dist-badge ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(filterType === type ? 'All' : type)}
              style={{ borderColor: getTypeColor(type) }}
            >
              <span className="type-emoji">{jewelryImages[type]}</span>
              <span className="type-name">{formatInvoiceType(type as InvoiceType)}</span>
              <span className="type-count">{stats.byType[type] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="inventory-controls-enhanced">
        <div className="control-row">
          <div className="sort-control">
            <label>Sort:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
              <option value="updated">Recently Updated</option>
              <option value="name">Item Name</option>
              <option value="qty">Quantity</option>
              <option value="price">Unit Price</option>
            </select>
          </div>

          <div className="view-modes">
            <button
              className={`view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
              title="Gallery View"
            >
              🖼️ Gallery
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞ Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ≡ List
            </button>
          </div>
        </div>
        <div className="result-count">
          Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items
        </div>
      </div>

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="inventory-gallery">
          {filteredItems.length === 0 ? (
            <div className="no-items-message">
              <div className="no-items-icon">💍</div>
              <p>No items match your search</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const stockStatus = getStockStatus(item.quantity)
              return (
                <div
                  key={item.sku}
                  className="gallery-card"
                  onMouseEnter={() => setHoveredCard(item.sku)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="gallery-image-wrapper">
                    <div 
                      className="gallery-image"
                      style={{ backgroundColor: getTypeColor(item.type) }}
                    >
                      <span className="product-emoji">{jewelryImages[item.type]}</span>
                    </div>
                    <div className="status-ribbon" style={{ background: getTypeColor(item.type) }}>
                      {formatInvoiceType(item.type as InvoiceType)}
                    </div>
                  </div>

                  <div className="gallery-content">
                    <h3 className="item-name">{item.itemName}</h3>
                    <div className="item-sku">SKU: {item.sku}</div>

                    <div className="item-specs">
                      <div className="spec-item">
                        <span className="spec-icon">⚖️</span>
                        <span className="spec-value">{item.weightGrams.toFixed(3)}g</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">📦</span>
                        <span className="spec-value">{item.quantity} pcs</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">💵</span>
                        <span className="spec-value">{formatMoney(item.unitPrice)}</span>
                      </div>
                    </div>

                    <div className="item-total-value">
                      Total: <strong>{formatMoney(item.quantity * item.unitPrice)}</strong>
                    </div>

                    <div className={`stock-status ${stockStatus.className}`}>
                      <span className="status-icon">{stockStatus.icon}</span>
                      {stockStatus.label}
                    </div>

                    {hoveredCard === item.sku && (
                      <div className="card-actions">
                        <button className="action-btn edit">✏️ Edit</button>
                        <button className="action-btn delete">🗑️ Delete</button>
                      </div>
                    )}

                    <div className="item-date">
                      Updated: {formatDateTime(item.updatedAt)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="inventory-grid-enhanced">
          {filteredItems.length === 0 ? (
            <div className="no-items-message">
              <div className="no-items-icon">💍</div>
              <p>No items match your search</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const stockStatus = getStockStatus(item.quantity)
              return (
                <div key={item.sku} className="grid-card-enhanced">
                  <div className="grid-card-header" style={{ backgroundColor: getTypeColor(item.type) }}>
                    <span className="card-emoji">{jewelryImages[item.type]}</span>
                    <span className="card-type">{formatInvoiceType(item.type as InvoiceType)}</span>
                  </div>
                  <div className="grid-card-body">
                    <h4>{item.itemName}</h4>
                    <p className="sku">{item.sku}</p>
                    <div className="details">
                      <div>Weight: {item.weightGrams.toFixed(3)}g</div>
                      <div>Qty: <strong>{item.quantity}</strong></div>
                      <div>Price: {formatMoney(item.unitPrice)}</div>
                    </div>
                    <div className={`status-badge ${stockStatus.className}`}>
                      {stockStatus.label}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="inventory-table-enhanced">
          {filteredItems.length === 0 ? (
            <div className="no-items-message">
              <div className="no-items-icon">💍</div>
              <p>No items match your search</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Weight</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.quantity)
                  return (
                    <tr key={item.sku} className={stockStatus.className}>
                      <td className="type-cell">
                        <span className="type-emoji-small">{jewelryImages[item.type]}</span>
                        {formatInvoiceType(item.type as InvoiceType)}
                      </td>
                      <td>{item.itemName}</td>
                      <td className="sku-cell">{item.sku}</td>
                      <td>{item.weightGrams.toFixed(3)}g</td>
                      <td className="qty-cell">{item.quantity}</td>
                      <td className="price-cell">{formatMoney(item.unitPrice)}</td>
                      <td className="total-cell">{formatMoney(item.quantity * item.unitPrice)}</td>
                      <td>
                        <span className={`status-badge-table ${stockStatus.className}`}>
                          {stockStatus.icon} {stockStatus.label}
                        </span>
                      </td>
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
