import type { CreateInventoryPayload, CreateInvoicePayload, DashboardPayload, InventoryItem, Invoice } from '../types/dashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

export async function fetchDashboard(token: string): Promise<DashboardPayload> {
  const response = await fetch(`${API_URL}/api/dashboard/overview`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Dashboard API returned ${response.status}`)
  }

  return (await response.json()) as DashboardPayload
}

export async function createInvoice(token: string, payload: CreateInvoicePayload): Promise<Invoice> {
  const response = await fetch(`${API_URL}/api/dashboard/invoices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Create invoice failed: ${response.status}`)
  }

  return (await response.json()) as Invoice
}

export async function fetchInventory(token: string, query?: string): Promise<InventoryItem[]> {
  const search = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  const response = await fetch(`${API_URL}/api/dashboard/inventory${search}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Inventory API returned ${response.status}`)
  }

  return (await response.json()) as InventoryItem[]
}

export async function createInventory(token: string, payload: CreateInventoryPayload): Promise<InventoryItem> {
  const response = await fetch(`${API_URL}/api/dashboard/inventory`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Create inventory failed: ${response.status}`)
  }

  return (await response.json()) as InventoryItem
}
