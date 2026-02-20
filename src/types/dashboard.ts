export interface Overview {
  date: string
  revenue: number
  revenueDeltaPercent: number
  pendingInvoices: number
}

export interface MarketRate {
  metal: string
  pricePerGram: number
  unit: string
  currency: 'INR' | 'USD'
  changePercent: number
}

export interface Invoice {
  invoiceId: string
  customer: string
  items: string
  type: InvoiceType
  amount: number
  status: 'Paid' | 'Pending' | 'Draft'
}

export type InvoiceType = 'GOLD_18K' | 'GOLD_22K' | 'GOLD_24K' | 'SILVER' | 'PLATINUM' | 'DIAMOND' | 'OTHER'

export interface CategorySale {
  name: string
  percent: number
  totalSales: number
}

export interface StockAlert {
  item: string
  note: string
  level: 'Critical' | 'Warning'
}

export interface DashboardPayload {
  overview: Overview
  marketRates: MarketRate[]
  invoices: Invoice[]
  salesByCategory: CategorySale[]
  stockAlerts: StockAlert[]
}

export interface CreateInvoicePayload {
  customer: string
  items: string
  type: InvoiceType
  amount: number
  status: 'Paid' | 'Pending' | 'Draft'
}

export interface InventoryItem {
  sku: string
  itemName: string
  type: InvoiceType
  weightGrams: number
  quantity: number
  unitPrice: number
  lowStockThreshold: number
  updatedAt: string
}

export interface CreateInventoryPayload {
  sku?: string
  itemName: string
  type: InvoiceType
  weightGrams: number
  quantity: number
  unitPrice: number
  lowStockThreshold: number
}
