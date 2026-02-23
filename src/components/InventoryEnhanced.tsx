import { useState, useMemo } from 'react'
import type { InventoryItem } from '../types/dashboard'
import '../styles/inventory-enhanced.css'

interface InventoryProps {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  searchQuery: string
  formatMoney: (value: number) => string
  formatDateTime: (value: string) => string
  onAddClick: () => void
}

export function InventoryEnhanced({
  items,
  loading,
  error,
  searchQuery,
  formatDateTime,
  onAddClick
}: InventoryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeMetal, setActiveMetal] = useState<string>('All')
  const [localSearch, setLocalSearch] = useState<string>('')

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

    const searchStr = (localSearch || searchQuery).toLowerCase().trim()
    if (searchStr) {
      filtered = filtered.filter(item =>
        item.itemCode.toLowerCase().includes(searchStr) ||
        item.itemName.toLowerCase().includes(searchStr) ||
        (item.description && item.description.toLowerCase().includes(searchStr))
      )
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [items, searchQuery, localSearch, activeCategory, activeMetal])

  if (loading) {
    return (
      <div className="inventory-loading-modern" style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#D4AF37' }}>
        <div className="spinner-large"></div>
        <p style={{ marginLeft: '1rem', fontSize: '1.2rem', fontWeight: 500 }}>Loading Inventory Database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-error-modern" style={{ background: '#FFF5F5', color: '#C53030', padding: '1.5rem', borderRadius: '12px', border: '1px solid #FEB2B2', margin: '2rem 0' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Data Sync Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="inventory-premium-container" style={{ fontFamily: "'Inter', sans-serif", color: '#fff', background: '#0a0f1a', minHeight: '100%', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>

      {/* Header & Actions */}
      <div className="inventory-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#FFF' }}>
            Inventory <span style={{ color: '#D4AF37' }}>Catalogue</span>
          </h1>
          <p style={{ color: '#A0ABC0', margin: 0, fontSize: '1rem' }}>Manage your entire jewellery collection and perform billing lookups instantly.</p>
        </div>
        <button
          onClick={onAddClick}
          className="add-modern-btn"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            color: '#1a202c',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          + Add New Item
        </button>
      </div>

      {/* Filters & Search */}
      <div className="inventory-controls-modern" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>

        <div style={{ flex: '1 1 300px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#A0ABC0', marginBottom: '0.5rem' }}>Search Collection</label>
          <input
            type="text"
            placeholder="Search by code or item name..."
            value={localSearch || searchQuery}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ width: '100%', padding: '0.8rem 1.2rem', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FFF', fontSize: '0.95rem', outline: 'none' }}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#A0ABC0', marginBottom: '0.5rem' }}>Filter by Metal</label>
          <select
            value={activeMetal}
            onChange={(e) => setActiveMetal(e.target.value)}
            style={{ width: '100%', padding: '0.8rem 1.2rem', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FFF', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
          >
            {metals.map(metal => <option key={metal} value={metal}>{metal}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#A0ABC0', marginBottom: '0.5rem' }}>Filter by Category</label>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            style={{ width: '100%', padding: '0.8rem 1.2rem', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FFF', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Modern Card Grid */}
      <div className="inventory-grid-premium" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📦</span>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>No items found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.itemCode} className="inventory-card-premium" style={{
              background: 'linear-gradient(to bottom, #111827, #1f2937)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              {item.metalType?.toLowerCase() === 'gold' && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', padding: '0.4rem 1rem', borderBottomLeftRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(212, 175, 55, 0.2)', borderTop: 'none', borderRight: 'none' }}>
                  {item.purity} Gold
                </div>
              )}
              {item.metalType?.toLowerCase() === 'platinum' && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(229, 228, 226, 0.15)', color: '#E5E4E2', padding: '0.4rem 1rem', borderBottomLeftRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(229, 228, 226, 0.2)', borderTop: 'none', borderRight: 'none' }}>
                  Platinum
                </div>
              )}
              {item.metalType?.toLowerCase() === 'silver' && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(192, 192, 192, 0.15)', color: '#C0C0C0', padding: '0.4rem 1rem', borderBottomLeftRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(192, 192, 192, 0.2)', borderTop: 'none', borderRight: 'none' }}>
                  Silver
                </div>
              )}

              <div style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#A0ABC0', textTransform: 'uppercase' }}>{item.itemCode}</span>
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#FFF', margin: '0 0 1rem 0', fontWeight: 600, WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                {item.itemName}
              </h3>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.05)', color: '#CBD5E0', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {item.category}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.05)', color: '#CBD5E0', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {item.metalType}
                </span>
              </div>

              {item.description && (
                <p style={{ margin: 0, paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#A0ABC0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              )}

              <p style={{ margin: '0.8rem 0 0', color: '#718096', fontSize: '0.75rem' }}>
                Updated: {formatDateTime(item.updatedAt)}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
