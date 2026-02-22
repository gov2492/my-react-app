import { useMemo, useState } from 'react'
import type { Invoice } from '../types/dashboard'
import '../styles/reports.css'

type RangeType = 'YTD' | 'MTD' | 'WTD' | 'CUSTOM'

interface ReportsSectionProps {
  invoices: Invoice[]
  formatMoney: (value: number, currency?: 'INR' | 'USD') => string
}

function getStartOfWeek(date: Date): Date {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diff = day === 0 ? -6 : 1 - day
  weekStart.setDate(weekStart.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function toInputDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ReportsSection({ invoices, formatMoney }: ReportsSectionProps) {
  const today = useMemo(() => new Date(), [])
  const [rangeType, setRangeType] = useState<RangeType>('MTD')
  const [customStartDate, setCustomStartDate] = useState<string>(toInputDateValue(today))
  const [customEndDate, setCustomEndDate] = useState<string>(toInputDateValue(today))

  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const rangeStart = new Date(now)
    rangeStart.setHours(0, 0, 0, 0)

    const rangeEnd = new Date(now)
    rangeEnd.setHours(23, 59, 59, 999)

    if (rangeType === 'YTD') {
      rangeStart.setMonth(0, 1)
      return { startDate: rangeStart, endDate: rangeEnd }
    }

    if (rangeType === 'MTD') {
      rangeStart.setDate(1)
      return { startDate: rangeStart, endDate: rangeEnd }
    }

    if (rangeType === 'WTD') {
      return { startDate: getStartOfWeek(now), endDate: rangeEnd }
    }

    const start = customStartDate ? new Date(customStartDate) : rangeStart
    const end = customEndDate ? new Date(customEndDate) : rangeEnd

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return { startDate: start, endDate: end }
  }, [rangeType, customStartDate, customEndDate])

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, startDate, endDate])

  const totalSales = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + (invoice.netAmount || invoice.amount || 0), 0)
  }, [filteredInvoices])

  const paidSales = useMemo(() => {
    return filteredInvoices
      .filter((invoice) => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + (invoice.netAmount || invoice.amount || 0), 0)
  }, [filteredInvoices])

  const averageSale = filteredInvoices.length > 0 ? totalSales / filteredInvoices.length : 0

  return (
    <section className="reports-section">
      <div className="reports-header">
        <h2>Sales Report</h2>
        <p>Track total sales based on selected period.</p>
      </div>

      <div className="reports-filters">
        {(['YTD', 'MTD', 'WTD', 'CUSTOM'] as const).map((type) => (
          <button
            key={type}
            className={`range-btn ${rangeType === type ? 'active' : ''}`}
            onClick={() => setRangeType(type)}
            type="button"
          >
            {type}
          </button>
        ))}
      </div>

      {rangeType === 'CUSTOM' && (
        <div className="custom-date-row">
          <label>
            Start Date
            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
          </label>
          <label>
            End Date
            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
          </label>
        </div>
      )}

      <div className="report-cards">
        <article className="report-card">
          <span>Total Sales</span>
          <strong>{formatMoney(totalSales)}</strong>
        </article>
        <article className="report-card">
          <span>Paid Sales</span>
          <strong>{formatMoney(paidSales)}</strong>
        </article>
        <article className="report-card">
          <span>Transactions</span>
          <strong>{filteredInvoices.length}</strong>
        </article>
        <article className="report-card">
          <span>Average Sale</span>
          <strong>{formatMoney(averageSale)}</strong>
        </article>
      </div>

      <div className="reports-table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">No sales found for selected range.</td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.invoiceId}>
                  <td>{invoice.invoiceId}</td>
                  <td>{invoice.customer}</td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>{invoice.status}</td>
                  <td>{formatMoney(invoice.netAmount || invoice.amount || 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
