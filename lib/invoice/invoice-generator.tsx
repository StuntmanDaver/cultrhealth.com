// Invoice Generator - Creates PDF documents from order data

import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument } from './invoice-template'
import type { InvoiceData, InvoiceItem } from './invoice-types'
import type { PaymentProvider } from '@/lib/payments/payment-types'

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX (e.g., INV-20260129-A3B7C)
 */
export function generateInvoiceNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `INV-${dateStr}-${randomPart}`
}

/**
 * Order item format from database/checkout
 */
export interface OrderItem {
  sku: string
  name: string
  quantity: number
  unit_price: number
  category?: string
}

/**
 * Input for creating invoice data from an order
 */
export interface CreateInvoiceInput {
  orderNumber: string
  customerEmail: string
  customerName?: string
  items: OrderItem[]
  totalAmount: number
  currency?: string
  paymentProvider: PaymentProvider
  paymentMethod?: string
  billingAddress?: {
    line1?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  notes?: string
  issueDate?: Date
}

/**
 * Create invoice data from order information
 */
export function createInvoiceData(input: CreateInvoiceInput): InvoiceData {
  const items: InvoiceItem[] = input.items.map((item) => ({
    sku: item.sku,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    totalPrice: item.unit_price * item.quantity,
  }))

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const tax = 0 // Tax calculation would be added here if needed
  const total = input.totalAmount

  return {
    invoiceNumber: generateInvoiceNumber(),
    orderNumber: input.orderNumber,
    issueDate: input.issueDate || new Date(),
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    items,
    subtotal,
    tax,
    total,
    currency: input.currency || 'USD',
    paymentMethod: input.paymentMethod || 'Credit Card',
    paymentProvider: input.paymentProvider,
    billingAddress: input.billingAddress,
    notes: input.notes,
  }
}

/**
 * Generate PDF buffer from invoice data
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(<InvoiceDocument data={data} />)
  return Buffer.from(pdfBuffer)
}

/**
 * Generate invoice PDF from order input (convenience function)
 */
export async function generateInvoiceFromOrder(
  input: CreateInvoiceInput
): Promise<{ data: InvoiceData; pdfBuffer: Buffer }> {
  const data = createInvoiceData(input)
  const pdfBuffer = await generateInvoicePdf(data)

  console.log('Invoice generated:', {
    invoiceNumber: data.invoiceNumber,
    orderNumber: data.orderNumber,
    itemCount: data.items.length,
    total: data.total,
  })

  return { data, pdfBuffer }
}
