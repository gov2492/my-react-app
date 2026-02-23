import { useEffect, useMemo, useState } from 'react'
import { fetchSalesReport } from '../api/dashboardApi'
import type {
  PaymentDistribution,
  SalesDateFilter,
  SalesReportQuery,
  SalesReportResponse,
  SalesReportRow,
  SalesTrendPoint
} from '../types/salesReport'
import '../styles/sales-report.css'

interface SalesReportTabProps {
  token: string
  formatMoney: (value: number, currency?: 'INR' | 'USD') => string
  globalSearch?: string
}

const dateFilterOptions: Array<{ value: SalesDateFilter; label: string }> = [
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'CUSTOM', label: 'Custom Date Range' }
]

const chartColors = ['#D4AF37', '#7C6CF6', '#4ADE80', '#F59E0B', '#60A5FA', '#F472B6', '#A78BFA']

const emptyReport: SalesReportResponse = {
  summary: {
    totalSalesAmount: 0,
    totalInvoices: 0,
    totalGstCollected: 0,
    totalGoldSoldGrams: 0,
    totalSilverSoldGrams: 0
  },
  salesTrend: [],
  paymentDistribution: [],
  metalComparison: [],
  rows: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildTrendPoints(data: SalesTrendPoint[]) {
  if (data.length === 0) {
    return ''
  }

  const width = 720
  const height = 220
  const padding = 30
  const values = data.map((point) => point.amount)
  const maxValue = Math.max(...values, 1)
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  return data
    .map((point, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth
      const y = padding + chartHeight - (point.amount / maxValue) * chartHeight
      return `${x},${y}`
    })
    .join(' ')
}

function paymentGradient(distribution: PaymentDistribution[]) {
  if (distribution.length === 0) {
    return 'conic-gradient(#334155 0deg 360deg)'
  }

  const total = distribution.reduce((sum, item) => sum + item.amount, 0)
  if (total <= 0) {
    return 'conic-gradient(#334155 0deg 360deg)'
  }

  let currentAngle = 0
  const segments = distribution.map((item, index) => {
    const percentage = item.amount / total
    const sweep = percentage * 360
    const start = currentAngle
    const end = currentAngle + sweep
    currentAngle = end
    return `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`
  })

  return `conic-gradient(${segments.join(', ')})`
}

function SortHeader({
  label,
  sortKey,
  activeSort,
  sortDir,
  onSort
}: {
  label: string
  sortKey: string
  activeSort: string
  sortDir: 'asc' | 'desc'
  onSort: (sortKey: string) => void
}) {
  const active = activeSort === sortKey
  return (
    <button type="button" className="sort-btn" onClick={() => onSort(sortKey)}>
      {label}
      <span style={{ color: active ? '#D4AF37' : '#718096', fontSize: '10px' }}>
        {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </button>
  )
}

export function SalesReportTab({ token, formatMoney, globalSearch }: SalesReportTabProps) {
  const today = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => {
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return toInputDate(firstDayOfMonth)
  }, [today])
  const defaultTo = useMemo(() => toInputDate(today), [today])

  const [dateFilter, setDateFilter] = useState<SalesDateFilter>('THIS_YEAR')
  const [customFrom, setCustomFrom] = useState(defaultFrom)
  const [customTo, setCustomTo] = useState(defaultTo)
  const [appliedCustomFrom, setAppliedCustomFrom] = useState(defaultFrom)
  const [appliedCustomTo, setAppliedCustomTo] = useState(defaultTo)

  const [search, setSearch] = useState(globalSearch ?? '')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [metalType, setMetalType] = useState('')
  const [salesperson, setSalesperson] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SalesReportResponse>(emptyReport)

  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch)
      setPage(0)
    }
  }, [globalSearch])

  const query = useMemo<SalesReportQuery>(() => {
    const payload: SalesReportQuery = {
      dateFilter,
      page,
      size,
      sortBy,
      sortDir,
      search,
      paymentMethod,
      metalType,
      salesperson
    }

    if (dateFilter === 'CUSTOM') {
      payload.from = appliedCustomFrom
      payload.to = appliedCustomTo
    }

    if (minAmount.trim()) {
      const min = Number(minAmount)
      if (Number.isFinite(min)) {
        payload.minAmount = min
      }
    }
    if (maxAmount.trim()) {
      const max = Number(maxAmount)
      if (Number.isFinite(max)) {
        payload.maxAmount = max
      }
    }

    return payload
  }, [
    appliedCustomFrom,
    appliedCustomTo,
    dateFilter,
    maxAmount,
    metalType,
    minAmount,
    page,
    paymentMethod,
    salesperson,
    search,
    size,
    sortBy,
    sortDir
  ])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchSalesReport(token, query)
        if (!cancelled) {
          setReport(response)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sales report')
          setReport(emptyReport)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [token, query])

  const onDateFilterChange = (value: SalesDateFilter) => {
    setDateFilter(value)
    setPage(0)
  }

  const onApplyCustomRange = () => {
    if (!customFrom || !customTo) {
      return
    }

    if (customFrom <= customTo) {
      setAppliedCustomFrom(customFrom)
      setAppliedCustomTo(customTo)
    } else {
      setAppliedCustomFrom(customTo)
      setAppliedCustomTo(customFrom)
    }
    setPage(0)
  }

  const onSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((previous) => (previous === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
    setPage(0)
  }

  const pageButtons = useMemo(() => {
    if (report.totalPages <= 1) {
      return []
    }

    const start = Math.max(0, page - 2)
    const end = Math.min(report.totalPages - 1, page + 2)
    const pages: number[] = []
    for (let i = start; i <= end; i += 1) {
      pages.push(i)
    }
    return pages
  }, [page, report.totalPages])

  const trendPolyline = useMemo(() => buildTrendPoints(report.salesTrend), [report.salesTrend])
  const pieGradient = useMemo(() => paymentGradient(report.paymentDistribution), [report.paymentDistribution])
  const maxMetalAmount = useMemo(() => Math.max(...report.metalComparison.map((item) => item.amount), 1), [report.metalComparison])

  const summaryCards = [
    { label: 'Total Sales', value: formatMoney(report.summary.totalSalesAmount), accent: 'gold-accent', icon: '💎' },
    { label: 'Invoices', value: report.summary.totalInvoices.toLocaleString('en-IN'), accent: 'slate-accent', icon: '📄' },
    { label: 'Tax Collected', value: formatMoney(report.summary.totalGstCollected), accent: 'purple-accent', icon: '🏦' },
    { label: 'Gold Sold (g)', value: report.summary.totalGoldSoldGrams.toFixed(3), accent: 'gold-accent', icon: '✨' },
    { label: 'Silver Sold (g)', value: report.summary.totalSilverSoldGrams.toFixed(3), accent: 'silver-accent', icon: '🌙' }
  ]

  const emptyRowsMessage = useMemo(() => {
    if (dateFilter === 'CUSTOM') {
      return 'No sales records found for this shop in the selected custom date range.'
    }
    return 'No sales records found for this shop in the selected period. Try This Year or Custom Date Range.'
  }, [dateFilter])

  const exportRows = async (): Promise<SalesReportRow[]> => {
    const exportData = await fetchSalesReport(token, {
      ...query,
      page: 0,
      size: 5000
    })
    return exportData.rows
  }

  const onExportExcel = async () => {
    try {
      const rows = await exportRows()
      const headers = ['Invoice Number', 'Date', 'Customer Name', 'Payment Method', 'Metal Type', 'Total Weight', 'GST', 'Net Amount', 'Salesperson']
      const csvRows = rows.map((row) => [
        row.invoiceNumber,
        row.date,
        row.customerName,
        row.paymentMethod,
        row.metalType,
        row.totalWeight.toFixed(3),
        row.gst.toFixed(2),
        row.netAmount.toFixed(2),
        row.salesperson
      ])

      const csvContent = [headers, ...csvRows]
        .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export Excel report')
    }
  }

  const onExportPdf = async () => {
    try {
      const rows = await exportRows()
      const printWindow = window.open('', '_blank', 'width=1200,height=900')
      if (!printWindow) {
        return
      }

      const tableRows = rows
        .map((row) => `<tr>
            <td>${escapeHtml(row.invoiceNumber)}</td>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.customerName)}</td>
            <td>${escapeHtml(row.paymentMethod)}</td>
            <td>${escapeHtml(row.metalType)}</td>
            <td style="text-align:right;">${row.totalWeight.toFixed(3)}</td>
            <td style="text-align:right;">${row.gst.toFixed(2)}</td>
            <td style="text-align:right;">${row.netAmount.toFixed(2)}</td>
            <td>${escapeHtml(row.salesperson)}</td>
          </tr>`)
        .join('')

      printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>Sales Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    h1 { margin: 0 0 8px 0; }
    .meta { margin-bottom: 16px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Sales Report</h1>
  <div class="meta">Generated on ${new Date().toLocaleString('en-IN')} | Filter: ${escapeHtml(dateFilter)}</div>
  <table>
    <thead>
      <tr>
        <th>Invoice Number</th><th>Date</th><th>Customer Name</th><th>Payment Method</th><th>Metal Type</th><th>Total Weight</th><th>GST</th><th>Net Amount</th><th>Salesperson</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF report')
    }
  }

  const onPrint = () => {
    window.print()
  }

  return (
    <div className="sales-report-modern-root">

      {/* Header */}
      <div className="sales-report-header-premium">
        <div>
          <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            📈 <span>Sales Overview</span>
          </h2>
          <p className="report-subtitle-modern">Track store performance, compare sales data, and extract detailed analytics.</p>
        </div>
        <div className="report-actions-modern">
          <button type="button" className="report-btn-outline" onClick={() => void onExportPdf()}>PDF</button>
          <button type="button" className="report-btn-outline" onClick={() => void onExportExcel()}>CSV</button>
          <button type="button" className="report-btn-primary" onClick={onPrint}>Print</button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div style={{ background: '#FFF5F5', color: '#C53030', padding: '16px', borderRadius: '12px', border: '1px solid #FEB2B2' }}>
          <strong>Error loading report:</strong> {error}
        </div>
      )}

      {/* Filters Card */}
      <div className="premium-card">
        <div className="filters-grid-modern">

          <div className="filter-group">
            <label>Date Filter</label>
            <select className="filter-input" value={dateFilter} onChange={(e) => onDateFilterChange(e.target.value as SalesDateFilter)}>
              {dateFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {dateFilter === 'CUSTOM' && (
            <>
              <div className="filter-group">
                <label>From Date</label>
                <input className="filter-input" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>To Date</label>
                <input className="filter-input" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>&nbsp;</label>
                <button type="button" className="filter-apply-btn" onClick={onApplyCustomRange}>Apply Focus</button>
              </div>
            </>
          )}

          <div className="filter-group">
            <label>Keyword Search</label>
            <input className="filter-input" type="text" value={search} placeholder="Invoice or Customer" onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
          </div>

          <div className="filter-group">
            <label>Payment Method</label>
            <select className="filter-input" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(0) }}>
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Salesperson</label>
            <input className="filter-input" type="text" value={salesperson} placeholder="Admin / Staff" onChange={(e) => { setSalesperson(e.target.value); setPage(0) }} />
          </div>

          <div className="filter-group">
            <label>Metal Focus</label>
            <select className="filter-input" value={metalType} onChange={(e) => { setMetalType(e.target.value); setPage(0) }}>
              <option value="">All Metals</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Min Amt (₹)</label>
            <input className="filter-input" type="number" value={minAmount} placeholder="e.g. 5000" min="0" onChange={(e) => { setMinAmount(e.target.value); setPage(0) }} />
          </div>

          <div className="filter-group">
            <label>Max Amt (₹)</label>
            <input className="filter-input" type="number" value={maxAmount} placeholder="e.g. 100000" min="0" onChange={(e) => { setMaxAmount(e.target.value); setPage(0) }} />
          </div>

        </div>
      </div>

      {/* Overview Stats */}
      <div className="summary-cards-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className={`summary-stat-card ${card.accent}`}>
            <span className="icon-bg">{card.icon}</span>
            <div className="summary-label">{card.label}</div>
            <h3 className="summary-value">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Visual Analytics */}
      <div className="charts-grid-modern">
        <div className="premium-card">
          <h3 className="chart-title">📊 Sales Value Trend</h3>
          {report.salesTrend.length > 0 ? (
            <>
              <svg viewBox="0 0 720 220" className="line-chart-svg">
                <polyline points={trendPolyline} fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ textAlign: 'center', color: '#A0ABC0', fontSize: '0.8rem', marginTop: '10px' }}>
                Showing timeline distributions based on selection.
              </p>
            </>
          ) : (
            <div className="empty-state">No trend data available.</div>
          )}
        </div>

        <div className="premium-card">
          <h3 className="chart-title">💳 Payment Modes</h3>
          <div className="pie-layout-modern">
            {report.paymentDistribution.length > 0 ? (
              <>
                <div className="pie-chart-circle" style={{ background: pieGradient }} />
                <div className="legend-list-modern">
                  {report.paymentDistribution.map((item, index) => {
                    const total = report.paymentDistribution.reduce((sum, entry) => sum + entry.amount, 0) || 1
                    const share = (item.amount / total) * 100
                    return (
                      <div className="legend-item" key={item.paymentMethod}>
                        <div className="legend-item-left">
                          <span className="legend-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                          <span>{item.paymentMethod}</span>
                        </div>
                        <strong>{share.toFixed(1)}%</strong>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ width: '100%' }}>No payment distributions.</div>
            )}
          </div>
        </div>

        <div className="premium-card">
          <h3 className="chart-title">💍 Segment Analysis</h3>
          <div className="bar-layout-modern">
            {report.metalComparison.length > 0 ? (
              report.metalComparison.map((item, index) => (
                <div key={item.metalType} className="bar-row-modern">
                  <div className="bar-label-modern">{item.metalType}</div>
                  <div className="bar-track-modern">
                    <div
                      className="bar-fill-modern"
                      style={{
                        width: `${(item.amount / maxMetalAmount) * 100}%`,
                        backgroundColor: chartColors[index % chartColors.length]
                      }}
                    />
                  </div>
                  <div className="bar-value-modern">{formatMoney(item.amount)}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No segments mapped yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Complex Data Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Detailed Transaction Logs</h3>
          <span style={{ color: '#D4AF37', background: 'rgba(212, 175, 55, 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
            {report.totalElements} Records Found
          </span>
        </div>

        {loading && <div className="empty-state" style={{ padding: '60px' }}>Loading transaction records...</div>}

        {!loading && (
          <div style={{ padding: '24px' }}>
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <table className="sales-table-premium">
                <thead>
                  <tr>
                    <th><SortHeader label="INV#" sortKey="invoiceNumber" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Date" sortKey="date" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Customer" sortKey="customerName" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Method" sortKey="paymentMethod" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Metal" sortKey="metalType" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th className="text-right">Weight</th>
                    <th className="text-right">Tax (GST)</th>
                    <th className="text-right"><SortHeader label="Net Amount" sortKey="netAmount" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-state" style={{ borderBottom: 'none' }}>{emptyRowsMessage}</td>
                    </tr>
                  ) : (
                    report.rows.map((row) => (
                      <tr key={`${row.invoiceNumber}-${row.date}`}>
                        <td className="font-mono text-gold font-bold">{row.invoiceNumber}</td>
                        <td style={{ color: '#A0ABC0' }}>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                        <td className="font-bold">{row.customerName}</td>
                        <td><span className="badge-tag">{row.paymentMethod}</span></td>
                        <td>{row.metalType}</td>
                        <td className="text-right" style={{ color: '#A0ABC0' }}>{row.totalWeight.toFixed(3)}g</td>
                        <td className="text-right" style={{ color: '#A0ABC0' }}>{formatMoney(row.gst)}</td>
                        <td className="text-right text-gold font-bold" style={{ fontSize: '1.05rem' }}>{formatMoney(row.netAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Layer */}
            {report.rows.length > 0 && (
              <div className="pagination-modern">
                <div className="page-size-wrap" style={{ color: '#A0ABC0', fontSize: '0.9rem' }}>
                  Rows per page
                  <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="pagination-controls-modern">
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                    &larr; Prev
                  </button>
                  {pageButtons.map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === page ? 'active' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                  <button className="page-btn" disabled={page + 1 >= report.totalPages} onClick={() => setPage(p => Math.min(report.totalPages - 1, p + 1))}>
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
