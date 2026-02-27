import { useMemo, useState } from 'react'
import type { InventoryItem } from '../types/dashboard'
import '../styles/inventory-enhanced.css'

interface InventoryProps {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  searchQuery: string
  formatMoney: (n: number) => string
  formatDateTime: (s: string) => string
  onAddClick: () => void
}

const PAGE_SIZE = 10

export function InventoryEnhanced({
  items,
  loading,
  error,
  searchQuery: _searchQuery,
  formatDateTime,
  onAddClick
}: InventoryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeMetal, setActiveMetal] = useState<string>('All')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique filters
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map(item => item.category)))]
  }, [items])

  const metals = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map(item => item.metalType)))]
  }, [items])

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items

    if (activeCategory !== 'All') {
      filtered = filtered.filter(item => item.category === activeCategory)
    }

    if (activeMetal !== 'All') {
      filtered = filtered.filter(item => item.metalType === activeMetal)
    }

    const searchStr = localSearch.toLowerCase().trim()
    if (searchStr) {
      filtered = filtered.filter(item =>
        item.itemCode.toLowerCase().includes(searchStr) ||
        item.itemName.toLowerCase().includes(searchStr) ||
        (item.description && item.description.toLowerCase().includes(searchStr))
      )
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [items, localSearch, activeCategory, activeMetal])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE)

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="inventory-enhanced" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-large" />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading Inventory Database...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-enhanced">
        <div className="inventory-error" style={{ padding: '1.5rem', borderRadius: '12px', margin: '2rem 0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Data Sync Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="inventory-enhanced">
      {/* Hero Header */}
      <div className="inventory-hero" style={{
        background: 'var(--hero-gradient)',
        padding: '2rem 2.5rem',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
              📦 Inventory <span style={{ opacity: 0.9 }}>Catalogue</span>
            </h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Manage your entire jewellery collection and perform billing lookups</p>
          </div>
          <button
            onClick={onAddClick}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            + Add New Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stats-card">
          <div className="stats-value">{items.length}</div>
          <div className="stats-label">Total Items</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{new Set(items.map(i => i.category)).size}</div>
          <div className="stats-label">Categories</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{new Set(items.map(i => i.metalType)).size}</div>
          <div className="stats-label">Metal Types</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{filteredItems.length}</div>
          <div className="stats-label">Showing</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="inventory-controls">
        <div style={{ flex: '1 1 300px' }}>
          <label className="inv-filter-label">Search Collection</label>
          <input
            type="text"
            placeholder="Search by code or item name..."
            value={localSearch}
            onChange={(e) => handleFilterChange(setLocalSearch, e.target.value)}
            className="inventory-search"
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label className="inv-filter-label">Filter by Metal</label>
          <select
            value={activeMetal}
            onChange={(e) => handleFilterChange(setActiveMetal, e.target.value)}
            className="inventory-filter-select"
          >
            {metals.map(metal => <option key={metal} value={metal}>{metal}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label className="inv-filter-label">Filter by Category</label>
          <select
            value={activeCategory}
            onChange={(e) => handleFilterChange(setActiveCategory, e.target.value)}
            className="inventory-filter-select"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="inventory-table-card">
        {filteredItems.length === 0 ? (
          <div className="inventory-empty">
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📦</span>
            <h3>No items found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>SKU Code</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Metal</th>
                    <th>Purity</th>
                    <th>Stock</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(item => (
                    <tr key={item.itemCode}>
                      <td><code className="inventory-sku">{item.itemCode}</code></td>
                      <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                      <td><span className="inventory-badge">{item.category}</span></td>
                      <td>
                        <span className={`inventory-badge metal-${item.metalType?.toLowerCase()}`}>
                          {item.metalType}
                        </span>
                      </td>
                      <td>{item.purity || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{item.stockQuantity ?? '—'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDateTime(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="inventory-pagination">
                <span className="pagination-info">
                  Showing {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
                </span>
                <div className="pagination-btns">
                  <button
                    className="page-btn"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    ‹ Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="page-ellipsis">…</span>}
                        <button
                          className={`page-btn ${p === safeCurrentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    className="page-btn"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
