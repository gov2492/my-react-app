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
    <button type="button" className="sort-header" onClick={() => onSort(sortKey)}>
      {label}
      <span className={`sort-caret ${active ? 'active' : ''}`}>{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
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
    { label: 'Total Sales Amount', value: formatMoney(report.summary.totalSalesAmount), accent: 'gold' },
    { label: 'Total Invoices', value: report.summary.totalInvoices.toLocaleString('en-IN'), accent: 'slate' },
    { label: 'Total GST Collected', value: formatMoney(report.summary.totalGstCollected), accent: 'purple' },
    { label: 'Total Gold Sold (grams)', value: report.summary.totalGoldSoldGrams.toFixed(3), accent: 'gold' },
    { label: 'Total Silver Sold (grams)', value: report.summary.totalSilverSoldGrams.toFixed(3), accent: 'silver' }
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
    <section className="sales-report-root">
      <header className="sales-report-header">
        <div>
          <p className="report-breadcrumb">Reports / Sales Report</p>
          <h2>Sales Report</h2>
          <p className="report-subtitle">Track performance with date-wise analytics, filters, and export-ready summaries.</p>
        </div>
        <div className="report-actions">
          <button type="button" className="report-action" onClick={() => void onExportPdf()}>Export as PDF</button>
          <button type="button" className="report-action" onClick={() => void onExportExcel()}>Export as Excel</button>
          <button type="button" className="report-action" onClick={onPrint}>Print Report</button>
        </div>
      </header>

      <section className="report-filters-card">
        <div className="report-filter-grid">
          <label>
            Date Filter
            <select value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value as SalesDateFilter)}>
              {dateFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {dateFilter === 'CUSTOM' && (
            <>
              <label>
                From Date
                <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              </label>
              <label>
                To Date
                <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
              </label>
              <div className="filter-apply-wrap">
                <button type="button" className="apply-btn" onClick={onApplyCustomRange}>Apply</button>
              </div>
            </>
          )}
        </div>

        <div className="report-filter-grid advanced">
          <label>
            Search (Invoice / Customer)
            <input
              type="text"
              value={search}
              placeholder="Search invoice number or customer"
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
            />
          </label>

          <label>
            Payment Method
            <select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setPage(0) }}>
              <option value="">All</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </label>

          <label>
            Metal Type
            <select value={metalType} onChange={(event) => { setMetalType(event.target.value); setPage(0) }}>
              <option value="">All</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </label>

          <label>
            Salesperson
            <input type="text" value={salesperson} placeholder="Admin / Staff" onChange={(event) => { setSalesperson(event.target.value); setPage(0) }} />
          </label>

          <label>
            Min Amount
            <input type="number" value={minAmount} placeholder="0" min="0" onChange={(event) => { setMinAmount(event.target.value); setPage(0) }} />
          </label>

          <label>
            Max Amount
            <input type="number" value={maxAmount} placeholder="100000" min="0" onChange={(event) => { setMaxAmount(event.target.value); setPage(0) }} />
          </label>
        </div>
      </section>

      <section className="summary-card-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className={`summary-card ${card.accent}`}>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="charts-grid">
        <article className="chart-card">
          <h3>Sales Trend</h3>
          {report.salesTrend.length > 0 ? (
            <>
              <svg viewBox="0 0 720 220" className="line-chart" role="img" aria-label="Sales trend chart">
                <polyline points={trendPolyline} fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="chart-footnote">{report.salesTrend.length} points</div>
            </>
          ) : (
            <div className="chart-empty">No trend data for selected range</div>
          )}
        </article>

        <article className="chart-card">
          <h3>Payment Distribution</h3>
          <div className="pie-layout">
            <div className="pie-chart" style={{ background: pieGradient }} />
            <ul className="legend-list">
              {report.paymentDistribution.length === 0 && <li className="legend-empty">No payment data</li>}
              {report.paymentDistribution.map((item, index) => {
                const total = report.paymentDistribution.reduce((sum, entry) => sum + entry.amount, 0) || 1
                const share = (item.amount / total) * 100
                return (
                  <li key={item.paymentMethod}>
                    <span className="dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span>{item.paymentMethod}</span>
                    <strong>{share.toFixed(1)}%</strong>
                  </li>
                )
              })}
            </ul>
          </div>
        </article>

        <article className="chart-card">
          <h3>Metal-wise Sales</h3>
          <div className="bar-chart">
            {report.metalComparison.length === 0 && <div className="chart-empty">No metal data</div>}
            {report.metalComparison.map((item, index) => (
              <div key={item.metalType} className="bar-row">
                <div className="bar-label">{item.metalType}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(item.amount / maxMetalAmount) * 100}%`,
                      backgroundColor: chartColors[index % chartColors.length]
                    }}
                  />
                </div>
                <div className="bar-value">{formatMoney(item.amount)}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="sales-table-card">
        <div className="table-header-row">
          <h3>Sales Details</h3>
          <div className="table-meta">{report.totalElements.toLocaleString('en-IN')} records</div>
        </div>

        {loading && <div className="table-state">Loading report...</div>}
        {error && <div className="table-state error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="sales-report-table-wrap">
              <table className="sales-report-table">
                <thead>
                  <tr>
                    <th><SortHeader label="Invoice Number" sortKey="invoiceNumber" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Date" sortKey="date" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Customer Name" sortKey="customerName" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Payment Method" sortKey="paymentMethod" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Metal Type" sortKey="metalType" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th>Total Weight</th>
                    <th>GST</th>
                    <th><SortHeader label="Net Amount" sortKey="netAmount" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                    <th><SortHeader label="Salesperson" sortKey="salesperson" activeSort={sortBy} sortDir={sortDir} onSort={onSort} /></th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-cell">{emptyRowsMessage}</td>
                    </tr>
                  )}
                  {report.rows.map((row) => (
                    <tr key={`${row.invoiceNumber}-${row.date}`}>
                      <td className="mono">{row.invoiceNumber}</td>
                      <td>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td>{row.customerName}</td>
                      <td>{row.paymentMethod}</td>
                      <td>{row.metalType}</td>
                      <td className="numeric">{row.totalWeight.toFixed(3)} g</td>
                      <td className="numeric">{formatMoney(row.gst)}</td>
                      <td className="numeric net">{formatMoney(row.netAmount)}</td>
                      <td>{row.salesperson}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="pagination-bar">
              <div className="page-size-select">
                <span>Rows per page</span>
                <select
                  value={size}
                  onChange={(event) => {
                    setSize(Number(event.target.value))
                    setPage(0)
                  }}
                >
                  {[10, 20, 50].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="pagination-controls">
                <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0}>Previous</button>
                {pageButtons.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? 'active' : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, Math.max(report.totalPages - 1, 0)))}
                  disabled={page + 1 >= report.totalPages}
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </section>
  )
}
