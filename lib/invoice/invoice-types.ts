// Invoice types for order receipts/invoices

export interface InvoiceItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface InvoiceData {
  invoiceNumber: string
  orderNumber: string
  issueDate: Date
  customerEmail: string
  customerName?: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  paymentMethod: string
  paymentProvider: 'stripe' | 'klarna' | 'affirm' | 'authorize_net' | 'healthie'
  billingAddress?: {
    line1?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  notes?: string
}
