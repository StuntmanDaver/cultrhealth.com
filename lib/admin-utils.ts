// Admin dashboard shared utilities — extracted from AdminDashboardClient.tsx

import type { ClubOrderItem } from '@/lib/admin-types'

export function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseOrderItems(items: string | unknown): ClubOrderItem[] {
  try {
    const parsed = typeof items === 'string' ? JSON.parse(items) : items
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0'
  const abs = Math.abs(amount)
  const formatted = `$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return amount < 0 ? `-${formatted}` : formatted
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-700 bg-green-100'
    case 'trialing': return 'text-blue-700 bg-blue-100'
    case 'paused': return 'text-yellow-700 bg-yellow-100'
    case 'cancelled': case 'canceled': return 'text-red-700 bg-red-100'
    case 'past_due': return 'text-orange-700 bg-orange-100'
    case 'pending': return 'text-yellow-700 bg-yellow-100'
    case 'approved': return 'text-blue-700 bg-blue-100'
    case 'rejected': return 'text-red-700 bg-red-100'
    case 'paid': return 'text-green-700 bg-green-100'
    default: return 'text-gray-700 bg-gray-100'
  }
}

export const ORDER_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending_approval: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { label: 'Approved', bg: 'bg-blue-100', text: 'text-blue-800' },
  invoice_sent: { label: 'Invoice Sent', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  paid: { label: 'Paid', bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
}

export const INTERNAL_COUPON_LABELS: Record<string, string> = {
  'OWNER': 'Owner',
  'CULTRSTAFF': 'Staff',
  'CULTRFAM': 'Family',
  'CULTR10': 'Promo',
  'SUMMER20': 'Promo',
  'MARY20': 'Promo',
  'LOYALTY15': 'Returning',
  'CULTR30': 'Owner Promo',
}

export function filterByDateRange<T extends { created_at: string }>(items: T[], startDate: string, endDate: string): T[] {
  if (!startDate && !endDate) return items
  return items.filter(item => {
    const d = item.created_at?.slice(0, 10)
    if (!d) return true
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })
}
