export type SalesDateFilter = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'CUSTOM'

export interface SalesSummary {
  totalSalesAmount: number
  totalInvoices: number
  totalGstCollected: number
  totalGoldSoldGrams: number
  totalSilverSoldGrams: number
}

export interface SalesTrendPoint {
  label: string
  amount: number
  invoiceCount: number
}

export interface PaymentDistribution {
  paymentMethod: string
  amount: number
  invoiceCount: number
}

export interface MetalSalesComparison {
  metalType: string
  amount: number
  totalWeightGrams: number
}

export interface SalesReportRow {
  invoiceNumber: string
  date: string
  customerName: string
  paymentMethod: string
  metalType: string
  totalWeight: number
  gst: number
  netAmount: number
  salesperson: string
}

export interface SalesReportResponse {
  summary: SalesSummary
  salesTrend: SalesTrendPoint[]
  paymentDistribution: PaymentDistribution[]
  metalComparison: MetalSalesComparison[]
  rows: SalesReportRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface SalesReportQuery {
  dateFilter: SalesDateFilter
  from?: string
  to?: string
  search?: string
  paymentMethod?: string
  metalType?: string
  salesperson?: string
  minAmount?: number
  maxAmount?: number
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
