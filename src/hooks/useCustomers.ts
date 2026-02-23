import { useState, useEffect, useMemo } from 'react'
import type { Invoice } from '../types/dashboard'

export interface CustomerProfile {
    id: string
    fullName: string
    mobileNumber: string
    email: string
    address: string
    city: string
    state: string
    pincode: string
    gstNumber: string
    notes: string
    creditLimit: number
    isManual: boolean
    createdAt: string
    totalPurchases: number
    outstandingBalance: number
    totalPaid: number
    lastPurchaseDate: string | null
    invoices: Invoice[]
}

const LOCAL_STORAGE_KEY = 'jewellery_custom_customers'

export function useCustomers(backendInvoices: Invoice[]) {
    const [manualCustomers, setManualCustomers] = useState<CustomerProfile[]>([])

    // Load manual customers from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (stored) {
                setManualCustomers(JSON.parse(stored))
            }
        } catch (e) {
            console.error('Failed to load manual customers from local storage', e)
        }
    }, [])

    // Save manual customers to local storage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(manualCustomers))
        } catch (e) {
            console.error('Failed to save manual customers to local storage', e)
        }
    }, [manualCustomers])

    // Merge backend invoice customers with manual customers
    const mergedCustomers = useMemo(() => {
        const customerMap = new Map<string, CustomerProfile>()

        // 1. Process Backend Invoices first (Source of Truth for billing)
        backendInvoices.forEach((inv) => {
            // Create a normalized key (lowercase, trimmed name + mobile if available)
            const normName = inv.customer?.trim() || 'Unknown Customer'
            const normMobile = inv.mobilenumber?.trim() || ''

            // We use name as primary key mapping since backend groups strictly by string name.
            // E.g 'John Doe'
            const mapKey = normName.toLowerCase()

            if (!customerMap.has(mapKey)) {
                customerMap.set(mapKey, {
                    id: `inv-cust-${mapKey}`,
                    fullName: normName,
                    mobileNumber: normMobile,
                    email: '',
                    address: inv.address || '',
                    city: '',
                    state: '',
                    pincode: '',
                    gstNumber: '',
                    notes: '',
                    creditLimit: 0,
                    isManual: false,
                    createdAt: inv.createdAt || new Date().toISOString(),
                    totalPurchases: 0,
                    outstandingBalance: 0,
                    totalPaid: 0,
                    lastPurchaseDate: null,
                    invoices: []
                })
            }

            const profile = customerMap.get(mapKey)!

            // Update aggregated stats
            profile.invoices.push(inv)
            profile.totalPurchases += inv.amount

            if (inv.status === 'Paid') {
                profile.totalPaid += inv.amount
            } else if (inv.status === 'Pending') {
                profile.outstandingBalance += inv.amount
            }

            // Track most recent purchase
            const invDate = new Date(inv.createdAt).getTime()
            if (!profile.lastPurchaseDate || invDate > new Date(profile.lastPurchaseDate).getTime()) {
                profile.lastPurchaseDate = inv.createdAt
            }
        })

        // 2. Process Manual Customers
        // If a manual customer shares the exact same name as an invoice customer,
        // we enrich the invoice customer instead of creating a duplicate.
        manualCustomers.forEach((manual) => {
            const mapKey = manual.fullName.toLowerCase()

            if (customerMap.has(mapKey)) {
                // Enrich existing backend-derived profile with manual details (if they exist)
                const profile = customerMap.get(mapKey)!
                profile.id = manual.id // Keep the manual ID for consistency
                profile.mobileNumber = manual.mobileNumber || profile.mobileNumber
                profile.email = manual.email
                profile.address = manual.address || profile.address
                profile.city = manual.city
                profile.state = manual.state
                profile.pincode = manual.pincode
                profile.gstNumber = manual.gstNumber
                profile.notes = manual.notes
                profile.creditLimit = manual.creditLimit
            } else {
                // Complete standalone manual customer (no invoices attached yet)
                customerMap.set(mapKey, {
                    ...manual,
                    totalPurchases: 0,
                    outstandingBalance: 0,
                    totalPaid: 0,
                    lastPurchaseDate: null,
                    invoices: []
                })
            }
        })

        // Sort by name alphabetically
        return Array.from(customerMap.values()).sort((a, b) =>
            a.fullName.localeCompare(b.fullName)
        )
    }, [backendInvoices, manualCustomers])

    const addCustomer = (customer: Omit<CustomerProfile, 'id' | 'isManual' | 'createdAt' | 'totalPurchases' | 'outstandingBalance' | 'totalPaid' | 'lastPurchaseDate' | 'invoices'>) => {
        const newCustomer: CustomerProfile = {
            ...customer,
            id: `cust-${Date.now()}`,
            isManual: true,
            createdAt: new Date().toISOString(),
            totalPurchases: 0,
            outstandingBalance: 0,
            totalPaid: 0,
            lastPurchaseDate: null,
            invoices: []
        }

        // Check for exact name duplicates before adding
        const exists = manualCustomers.some(c => c.fullName.toLowerCase() === newCustomer.fullName.toLowerCase())
        if (exists) {
            throw new Error('A customer with this exact name already exists. Please use a different name or edit the existing one.')
        }

        setManualCustomers(prev => [...prev, newCustomer])
        return newCustomer
    }

    const updateCustomer = (updatedData: CustomerProfile) => {
        // We only update manual customers. 
        // If they tried to update an invoice-only customer, we must promote them to a manual customer first.
        const existsInManual = manualCustomers.some(c => c.id === updatedData.id)

        if (existsInManual) {
            setManualCustomers(prev => prev.map(c => c.id === updatedData.id ? { ...c, ...updatedData } : c))
        } else {
            // Promote to manual
            const newManualCustomer: CustomerProfile = {
                ...updatedData,
                isManual: true
            }
            setManualCustomers(prev => [...prev, newManualCustomer])
        }
    }

    const deleteCustomer = (id: string, cascadeCheck: boolean = true) => {
        const mappedContext = mergedCustomers.find(c => c.id === id)
        if (!mappedContext) throw new Error('Customer not found')

        if (cascadeCheck && mappedContext.invoices.length > 0) {
            throw new Error(`Cannot delete ${mappedContext.fullName}. They have ${mappedContext.invoices.length} existing invoices attached.`)
        }

        setManualCustomers(prev => prev.filter(c => c.id !== id))
    }

    return {
        customers: mergedCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer
    }
}
