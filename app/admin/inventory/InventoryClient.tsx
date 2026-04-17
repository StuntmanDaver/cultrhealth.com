'use client'

import { useState, useEffect, useCallback } from 'react'
import { PackageSearch, Save, Loader2, AlertTriangle, CheckCircle, Package } from 'lucide-react'

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'restocking_soon'

interface InventoryRow {
  therapyId: string
  therapyName: string
  stockStatus: StockStatus
  stockQuantity: number | null
  updatedAt: string
  updatedBy: string | null
}

const STATUS_OPTIONS: { value: StockStatus; label: string; color: string }[] = [
  { value: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-700' },
  { value: 'low_stock', label: 'Low Stock', color: 'bg-amber-100 text-amber-700' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700' },
  { value: 'restocking_soon', label: 'Restocking Soon', color: 'bg-blue-100 text-blue-700' },
]

export default function InventoryClient() {
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [edits, setEdits] = useState<Record<string, { stockStatus: StockStatus; stockQuantity: number | null }>>({})

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inventory')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setInventory(data.inventory || [])
    } catch {
      setError('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const getEditedValue = (row: InventoryRow) => {
    return edits[row.therapyId] || { stockStatus: row.stockStatus, stockQuantity: row.stockQuantity }
  }

  const handleStatusChange = (therapyId: string, row: InventoryRow, newStatus: StockStatus) => {
    const current = getEditedValue(row)
    setEdits((prev) => ({
      ...prev,
      [therapyId]: { ...current, stockStatus: newStatus },
    }))
    setSaved(null)
  }

  const handleQuantityChange = (therapyId: string, row: InventoryRow, value: string) => {
    const current = getEditedValue(row)
    const qty = value === '' ? null : parseInt(value, 10)
    setEdits((prev) => ({
      ...prev,
      [therapyId]: { ...current, stockQuantity: isNaN(qty as number) ? null : qty },
    }))
    setSaved(null)
  }

  const handleSave = async (therapyId: string) => {
    const row = inventory.find((r) => r.therapyId === therapyId)
    if (!row) return
    const edited = getEditedValue(row)

    setSaving(therapyId)
    setError('')
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapyId,
          therapyName: row.therapyName,
          stockStatus: edited.stockStatus,
          stockQuantity: edited.stockQuantity,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      // Update local state
      setInventory((prev) =>
        prev.map((r) =>
          r.therapyId === therapyId
            ? { ...r, stockStatus: edited.stockStatus, stockQuantity: edited.stockQuantity, updatedAt: new Date().toISOString() }
            : r
        )
      )
      // Clear edit for this row
      setEdits((prev) => {
        const next = { ...prev }
        delete next[therapyId]
        return next
      })
      setSaved(therapyId)
      setTimeout(() => setSaved((prev) => (prev === therapyId ? null : prev)), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  const hasEdit = (row: InventoryRow) => {
    const edit = edits[row.therapyId]
    if (!edit) return false
    return edit.stockStatus !== row.stockStatus || edit.stockQuantity !== row.stockQuantity
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Inventory</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-white rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <PackageSearch className="w-6 h-6 text-brand-primary" />
          <h1 className="font-display text-2xl font-bold text-brand-primary">Inventory</h1>
        </div>
        <p className="text-sm text-brand-secondary/60">
          Manage stock status for join.cultrhealth.com products. Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="text-left px-5 py-3 font-semibold text-brand-primary">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-primary">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-primary">Quantity</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-primary">Last Updated</th>
                <th className="text-right px-5 py-3 font-semibold text-brand-primary"></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => {
                const edited = getEditedValue(row)
                const statusMeta = STATUS_OPTIONS.find((s) => s.value === edited.stockStatus)!
                const dirty = hasEdit(row)
                const isSaving = saving === row.therapyId
                const justSaved = saved === row.therapyId

                return (
                  <tr key={row.therapyId} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors">
                    {/* Product name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-brand-secondary/40 shrink-0" />
                        <span className="font-medium text-brand-primary">{row.therapyName}</span>
                      </div>
                    </td>

                    {/* Status dropdown */}
                    <td className="px-5 py-4">
                      <select
                        value={edited.stockStatus}
                        onChange={(e) => handleStatusChange(row.therapyId, row, e.target.value as StockStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${statusMeta.color}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity input */}
                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min={0}
                        value={edited.stockQuantity ?? ''}
                        onChange={(e) => handleQuantityChange(row.therapyId, row, e.target.value)}
                        placeholder="Unlimited"
                        className="w-28 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-brand-primary placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary"
                      />
                    </td>

                    {/* Last updated */}
                    <td className="px-5 py-4 text-xs text-brand-secondary/50">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                      {row.updatedBy && <span className="block text-[10px] text-brand-secondary/30">{row.updatedBy}</span>}
                    </td>

                    {/* Save button */}
                    <td className="px-5 py-4 text-right">
                      {justSaved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" /> Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSave(row.therapyId)}
                          disabled={!dirty || isSaving}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            dirty
                              ? 'bg-brand-primary text-white hover:bg-brand-primaryHover active:scale-95'
                              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="w-3.5 h-3.5" /> Save</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-brand-secondary/40 text-sm">
                    No products found. Run migration 034 to seed inventory data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
