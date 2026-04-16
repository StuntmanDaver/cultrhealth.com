'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsData, CustomerAdminRow, CustomerProfile } from '@/lib/admin-types'
import { downloadCSV, formatDate, formatCurrency, getStatusColor, filterByDateRange } from '@/lib/admin-utils'

type SortField = 'name' | 'email' | 'address_city' | 'address_state' | 'signup_type' | 'source' | 'order_count' | 'total_spent' | 'created_at' | 'age' | 'gender' | 'converted' | 'avg_order_value' | 'browser' | 'device_type'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-brand-primary/20">↕</span>
  return <span className="ml-1 text-brand-primary">{dir === 'asc' ? '↑' : '↓'}</span>
}

function sortCustomers(customers: CustomerAdminRow[], field: SortField, dir: SortDir): CustomerAdminRow[] {
  return [...customers].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    // Nulls last
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    // Booleans: true > false
    if (typeof av === 'boolean' && typeof bv === 'boolean') {
      if (av === bv) return 0
      return dir === 'asc' ? (av ? 1 : -1) : (av ? -1 : 1)
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av
    }
    const as = String(av).toLowerCase()
    const bs = String(bv).toLowerCase()
    if (as < bs) return dir === 'asc' ? -1 : 1
    if (as > bs) return dir === 'asc' ? 1 : -1
    return 0
  })
}

export default function CustomersClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Search & date range filters
  const [customerSearch, setCustomerSearch] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  // Customer detail modal
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null)
  const [customerDetail, setCustomerDetail] = useState<CustomerProfile | null>(null)
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false)
  const [customerDetailTab, setCustomerDetailTab] = useState<'overview' | 'orders' | 'activity'>('overview')

  // Customer detail — inline edit mode
  type EditForm = {
    name: string
    phone: string
    address_street: string
    address_city: string
    address_state: string
    address_zip: string
    age: string
    gender: string
    signup_type: string
    source: string
  }
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Customer detail — delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Reset edit + delete state whenever the selected customer changes or the modal closes
  useEffect(() => {
    setEditMode(false)
    setEditForm(null)
    setSaveError(null)
    setDeleteConfirmOpen(false)
    setDeleting(false)
    setDeleteError(null)
  }, [selectedCustomerEmail])

  const closeCustomerModal = useCallback(() => {
    setSelectedCustomerEmail(null)
    setCustomerDetail(null)
    setEditMode(false)
    setEditForm(null)
    setSaveError(null)
    setDeleteConfirmOpen(false)
    setDeleting(false)
    setDeleteError(null)
  }, [])

  const startEdit = useCallback(() => {
    const m = customerDetail?.member
    if (!m) return
    setEditForm({
      name: m.name ?? '',
      phone: m.phone ?? '',
      address_street: m.address_street ?? '',
      address_city: m.address_city ?? '',
      address_state: m.address_state ?? '',
      address_zip: m.address_zip ?? '',
      age: m.age !== null && m.age !== undefined ? String(m.age) : '',
      gender: m.gender ?? '',
      signup_type: m.signup_type ?? '',
      source: m.source ?? '',
    })
    setSaveError(null)
    setEditMode(true)
  }, [customerDetail])

  const cancelEdit = useCallback(() => {
    setEditMode(false)
    setEditForm(null)
    setSaveError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!selectedCustomerEmail || !editForm) return
    setSaving(true)
    setSaveError(null)
    try {
      // Build payload: empty strings map to undefined (no change); age parsed
      const emptyToNull = (v: string) => (v.trim() === '' ? null : v.trim())
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        phone: emptyToNull(editForm.phone),
        address_street: emptyToNull(editForm.address_street),
        address_city: emptyToNull(editForm.address_city),
        address_state: emptyToNull(editForm.address_state),
        address_zip: emptyToNull(editForm.address_zip),
        age: editForm.age.trim() === '' ? null : Number(editForm.age),
        gender: emptyToNull(editForm.gender),
        signup_type: emptyToNull(editForm.signup_type),
        source: emptyToNull(editForm.source),
      }

      const res = await fetch(`/api/admin/customers/${encodeURIComponent(selectedCustomerEmail)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(json?.error || 'Failed to save changes')
        return
      }
      if (json?.data) {
        setCustomerDetail(json.data as CustomerProfile)
      }
      setEditMode(false)
      setEditForm(null)
      // Trigger a refetch of the customers list so the table reflects updates
      setPeriodDays(p => p)
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }, [selectedCustomerEmail, editForm])

  // Sync date range when periodDays changes
  useEffect(() => {
    const start = new Date()
    start.setDate(start.getDate() - periodDays)
    setStartDate(start.toISOString().split('T')[0])
  }, [periodDays])

  useEffect(() => {
    setEndDate(new Date().toISOString().split('T')[0])
  }, [periodDays])

  // Fetch analytics data
  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?days=${periodDays}`)
      .then(r => r.json())
      .then(result => { if (result.data) setData(result.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [periodDays])

  // Fetch customer detail
  const fetchCustomerDetail = useCallback(async (email: string) => {
    setCustomerDetailLoading(true)
    setCustomerDetail(null)
    setCustomerDetailTab('overview')
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`)
      const result = await res.json()
      if (res.ok && result.data) {
        setCustomerDetail(result.data)
      }
    } catch {
      // silent
    } finally {
      setCustomerDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCustomerEmail) {
      fetchCustomerDetail(selectedCustomerEmail)
    }
  }, [selectedCustomerEmail, fetchCustomerDetail])

  // Export CSV
  const exportCustomers = useCallback(() => {
    if (!data) return
    const filtered = getFilteredCustomers(data.allCustomers)
    downloadCSV('cultr-customers',
      ['Name', 'Email', 'Phone', 'Age', 'Gender', 'City', 'State', 'Type', 'Source', 'Converted', 'Orders', 'Total Spent', 'AOV', 'Browser', 'Device', 'Joined'],
      filtered.map(c => [c.name, c.email, c.phone, c.age, c.gender, c.address_city, c.address_state, c.signup_type, c.source, c.converted ? 'Yes' : 'No', c.order_count, c.total_spent, c.avg_order_value, c.browser, c.device_type, c.created_at])
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, startDate, endDate, customerSearch])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function getFilteredCustomers(customers: CustomerAdminRow[]): CustomerAdminRow[] {
    const q = customerSearch.toLowerCase().trim()
    // When searching by name/email, skip the date range filter so older customers are found
    const pool = q ? customers : filterByDateRange(customers, startDate, endDate)
    const filtered = q
      ? pool.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        )
      : pool
    return sortCustomers(filtered, sortField, sortDir)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Customers</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Customers</h1>
        <p className="text-brand-primary/60">Failed to load data.</p>
      </div>
    )
  }

  const filteredCustomers = getFilteredCustomers(data.allCustomers)

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-primary">Customers</h1>
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value))}
          className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
      </div>

      {/* Customer Master List */}
      <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl text-brand-primary">
            Customer Master List
            <span className="ml-2 text-sm font-normal text-brand-primary/50">({filteredCustomers.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportCustomers} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-brand-primary/50">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-brand-primary/50">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
            />
          </div>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-primary/10">
                  {([
                    { label: 'Name', field: 'name', align: 'left' },
                    { label: 'Email', field: 'email', align: 'left' },
                    { label: 'Phone', field: null, align: 'left' },
                    { label: 'Age', field: 'age', align: 'right' },
                    { label: 'Gender', field: 'gender', align: 'left' },
                    { label: 'City', field: 'address_city', align: 'left' },
                    { label: 'State', field: 'address_state', align: 'left' },
                    { label: 'Type', field: 'signup_type', align: 'left' },
                    { label: 'Source', field: 'source', align: 'left' },
                    { label: 'Converted', field: 'converted', align: 'left' },
                    { label: 'Orders', field: 'order_count', align: 'right' },
                    { label: 'Total Spent', field: 'total_spent', align: 'right' },
                    { label: 'AOV', field: 'avg_order_value', align: 'right' },
                    { label: 'Browser', field: 'browser', align: 'left' },
                    { label: 'Device', field: 'device_type', align: 'left' },
                    { label: 'Joined', field: 'created_at', align: 'left' },
                  ] as { label: string; field: SortField | null; align: string }[]).map(col => (
                    <th
                      key={col.label}
                      className={`py-3 px-4 text-brand-primary/60 font-medium text-sm text-${col.align} ${col.field ? 'cursor-pointer select-none hover:text-brand-primary transition-colors' : ''}`}
                      onClick={col.field ? () => toggleSort(col.field as SortField) : undefined}
                    >
                      {col.label}
                      {col.field && <SortIcon active={sortField === col.field} dir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`${i % 2 === 0 ? 'bg-brand-cream/30' : ''} cursor-pointer hover:bg-brand-primary/5 transition-colors`}
                    onClick={() => setSelectedCustomerEmail(c.email)}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-brand-primary">{c.name}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{c.email}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{c.phone || '\u2014'}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary/60">{c.age ?? '\u2014'}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">
                      {c.gender ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {c.gender === 'male' ? 'M' : 'F'}
                        </span>
                      ) : '\u2014'}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{c.address_city || '\u2014'}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{c.address_state || '\u2014'}</td>
                    <td className="py-3 px-4">
                      {c.signup_type && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.signup_type === 'membership' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                          {c.signup_type === 'membership' ? 'Membership' : 'Products'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{c.source || '\u2014'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.converted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.converted ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.order_count}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{formatCurrency(Number(c.total_spent))}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.avg_order_value != null ? formatCurrency(c.avg_order_value) : '\u2014'}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{c.browser || '\u2014'}</td>
                    <td className="py-3 px-4">
                      {c.device_type ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.device_type === 'mobile' ? 'bg-blue-100 text-blue-800' : c.device_type === 'tablet' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                          {c.device_type}
                        </span>
                      ) : '\u2014'}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-brand-primary/40 py-12 text-sm">No customers found matching your filters</p>
        )}
      </div>

      {/* ========== CUSTOMER DETAIL MODAL ========== */}
      {selectedCustomerEmail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeCustomerModal}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg text-brand-primary">
                  {customerDetail?.member?.name || 'Customer'}
                </h3>
                <p className="text-sm text-brand-primary/60">{selectedCustomerEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                {customerDetail && !editMode && (
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="px-3 py-1.5 text-sm rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={closeCustomerModal}
                  className="text-brand-primary/40 hover:text-brand-primary text-xl"
                >
                  &times;
                </button>
              </div>
            </div>

            {customerDetailLoading ? (
              <div className="py-12 text-center text-brand-primary/40">Loading customer details...</div>
            ) : customerDetail ? (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-brand-primary/10">
                  {(['overview', 'orders', 'activity'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setCustomerDetailTab(tab)}
                      className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${customerDetailTab === tab ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-primary/40 hover:text-brand-primary/70'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {customerDetailTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-brand-primary">{formatCurrency(customerDetail.lifetimeValue)}</p>
                        <p className="text-xs text-brand-primary/60 mt-1">Lifetime Value</p>
                      </div>
                      <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-brand-primary">{customerDetail.totalOrders}</p>
                        <p className="text-xs text-brand-primary/60 mt-1">Total Orders</p>
                      </div>
                    </div>

                    {/* Member Info section: read-only OR inline edit form */}
                    {customerDetail.member && !editMode && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide">Member Info</h4>
                          <button
                            onClick={startEdit}
                            className="px-3 py-1.5 text-sm rounded-lg bg-brand-primary text-white hover:bg-brand-primaryHover"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="bg-brand-cream/30 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-brand-primary/60">Member Since</span>
                            <span className="text-brand-primary">{formatDate(customerDetail.member.created_at)}</span>
                          </div>
                          {customerDetail.member.phone && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Phone</span>
                              <span className="text-brand-primary">{customerDetail.member.phone}</span>
                            </div>
                          )}
                          {(customerDetail.member.age !== null && customerDetail.member.age !== undefined) && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Age</span>
                              <span className="text-brand-primary">{customerDetail.member.age}</span>
                            </div>
                          )}
                          {customerDetail.member.gender && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Gender</span>
                              <span className="text-brand-primary capitalize">{customerDetail.member.gender}</span>
                            </div>
                          )}
                          {customerDetail.member.signup_type && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Signup Type</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${customerDetail.member.signup_type === 'membership' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {customerDetail.member.signup_type === 'membership' ? 'Membership' : 'Products'}
                              </span>
                            </div>
                          )}
                          {(customerDetail.member.address_street || customerDetail.member.address_city || customerDetail.member.address_state) && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Address</span>
                              <span className="text-brand-primary text-right">
                                {[customerDetail.member.address_street, customerDetail.member.address_city, customerDetail.member.address_state, customerDetail.member.address_zip].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          {customerDetail.member.source && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Source</span>
                              <span className="text-brand-primary">{customerDetail.member.source}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {customerDetail.member && editMode && editForm && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide">Edit Member Info</h4>
                        <div className="bg-brand-cream/30 rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-xs text-brand-primary/60 mb-1">Name *</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                                className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                maxLength={200}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-brand-primary/60 mb-1">Phone</label>
                              <input
                                type="text"
                                value={editForm.phone}
                                onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)}
                                className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                maxLength={40}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-brand-primary/60 mb-1">Street Address</label>
                              <input
                                type="text"
                                value={editForm.address_street}
                                onChange={e => setEditForm(f => f ? { ...f, address_street: e.target.value } : f)}
                                className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                maxLength={200}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1">
                                <label className="block text-xs text-brand-primary/60 mb-1">City</label>
                                <input
                                  type="text"
                                  value={editForm.address_city}
                                  onChange={e => setEditForm(f => f ? { ...f, address_city: e.target.value } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                  maxLength={100}
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="block text-xs text-brand-primary/60 mb-1">State</label>
                                <input
                                  type="text"
                                  value={editForm.address_state}
                                  onChange={e => setEditForm(f => f ? { ...f, address_state: e.target.value.toUpperCase() } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full uppercase"
                                  maxLength={2}
                                  placeholder="FL"
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="block text-xs text-brand-primary/60 mb-1">ZIP</label>
                                <input
                                  type="text"
                                  value={editForm.address_zip}
                                  onChange={e => setEditForm(f => f ? { ...f, address_zip: e.target.value } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                  maxLength={20}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-brand-primary/60 mb-1">Age</label>
                                <input
                                  type="number"
                                  min={13}
                                  max={120}
                                  value={editForm.age}
                                  onChange={e => setEditForm(f => f ? { ...f, age: e.target.value } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-brand-primary/60 mb-1">Gender</label>
                                <select
                                  value={editForm.gender}
                                  onChange={e => setEditForm(f => f ? { ...f, gender: e.target.value } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                >
                                  <option value="">(unset)</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-brand-primary/60 mb-1">Signup Type</label>
                                <select
                                  value={editForm.signup_type}
                                  onChange={e => setEditForm(f => f ? { ...f, signup_type: e.target.value } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                >
                                  <option value="">(unset)</option>
                                  <option value="products">Products</option>
                                  <option value="membership">Membership</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-brand-primary/60 mb-1">Source</label>
                                <input
                                  type="text"
                                  value={editForm.source}
                                  onChange={e => setEditForm(f => f ? { ...f, source: e.target.value } : f)}
                                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                                  maxLength={100}
                                />
                              </div>
                            </div>
                          </div>

                          {saveError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving || !editForm.name.trim()}
                              className="px-4 py-2 text-sm rounded-lg bg-brand-primary text-white hover:bg-brand-primaryHover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-2 text-sm rounded-lg border border-brand-primary/20 text-brand-primary hover:bg-brand-cream/50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {customerDetail.membership && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide">Membership</h4>
                        <div className="bg-brand-cream/30 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-brand-primary/60">Plan</span>
                            <span className="text-brand-primary capitalize">{customerDetail.membership.plan_tier}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-brand-primary/60">Status</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customerDetail.membership.subscription_status)}`}>
                              {customerDetail.membership.subscription_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {customerDetailTab === 'orders' && (
                  <div className="space-y-4">
                    {customerDetail.clubOrders.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide mb-2">Club Orders ({customerDetail.clubOrders.length})</h4>
                        <div className="space-y-2">
                          {customerDetail.clubOrders.map(o => (
                            <div key={o.id} className="bg-brand-cream/30 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-sm text-brand-primary">{o.order_number}</span>
                                  <span className="ml-2 text-xs text-brand-primary/40">{formatDate(o.created_at)}</span>
                                  {o.coupon_code && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-mono">{o.coupon_code}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-brand-primary">{o.subtotal_usd ? formatCurrency(o.subtotal_usd) : 'TBD'}</span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>{o.status}</span>
                                </div>
                              </div>
                              {Array.isArray(o.items) && o.items.length > 0 && (
                                <ul className="mt-2 space-y-1 border-t border-brand-primary/10 pt-2">
                                  {o.items.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-xs text-brand-primary/70">
                                      <span>· {item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}{item.pricingNote ? <span className="ml-1 text-brand-primary/40">({item.pricingNote})</span> : null}</span>
                                      <span className="ml-4 shrink-0">{item.price != null ? formatCurrency(item.price) : 'TBD'}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerDetail.productOrders.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide mb-2">Product Orders ({customerDetail.productOrders.length})</h4>
                        <div className="space-y-2">
                          {customerDetail.productOrders.map(o => (
                            <div key={o.id} className="bg-brand-cream/30 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-sm text-brand-primary">{o.order_number}</span>
                                  <span className="ml-2 text-xs text-brand-primary/40">{formatDate(o.created_at)}</span>
                                  {o.payment_provider && <span className="ml-2 text-xs text-brand-primary/40">via {o.payment_provider}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-brand-primary">{formatCurrency(o.total_amount)}</span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>{o.status}</span>
                                </div>
                              </div>
                              {Array.isArray(o.items) && o.items.length > 0 && (
                                <ul className="mt-2 space-y-1 border-t border-brand-primary/10 pt-2">
                                  {o.items.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-xs text-brand-primary/70">
                                      <span>· {item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span>
                                      <span className="ml-4 shrink-0">{item.unit_price != null ? formatCurrency(item.unit_price) : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerDetail.clubOrders.length === 0 && customerDetail.productOrders.length === 0 && (
                      <p className="text-center text-brand-primary/40 py-8 text-sm">No orders found for this customer</p>
                    )}
                  </div>
                )}

                {/* Activity Tab */}
                {customerDetailTab === 'activity' && (
                  <div className="space-y-4">
                    {customerDetail.intakeStatus && (
                      <div>
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide mb-2">Intake Status</h4>
                        <div className="bg-brand-cream/30 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-brand-primary/60">Status</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customerDetail.intakeStatus.intake_status)}`}>
                              {customerDetail.intakeStatus.intake_status}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-brand-primary/60">Plan</span>
                            <span className="text-brand-primary capitalize">{customerDetail.intakeStatus.plan_tier}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-brand-primary/60">Started</span>
                            <span className="text-brand-primary">{formatDate(customerDetail.intakeStatus.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Coupon usage from club orders */}
                    {customerDetail.clubOrders.some(o => o.coupon_code) && (
                      <div>
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide mb-2">Coupon Usage</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(customerDetail.clubOrders.filter(o => o.coupon_code).map(o => o.coupon_code))).map(code => (
                            <span key={code} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!customerDetail.intakeStatus && !customerDetail.clubOrders.some(o => o.coupon_code) && (
                      <p className="text-center text-brand-primary/40 py-8 text-sm">No activity data available</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-brand-primary/40 py-8 text-sm">Could not load customer data</p>
            )}
          </div>

          {/* ========== DELETE CONFIRMATION OVERLAY ========== */}
          {deleteConfirmOpen && (
            <div className="absolute inset-0 bg-white/95 z-10 flex items-center justify-center p-6 rounded-xl">
              <div className="max-w-sm w-full space-y-4">
                <h3 className="font-display text-lg text-red-600">Delete Customer</h3>
                <p className="text-sm text-brand-primary/70">
                  <span className="font-medium text-brand-primary">{customerDetail?.member?.name || 'Customer'}</span>{' '}
                  <span className="text-brand-primary/50">({selectedCustomerEmail})</span>
                </p>

                {customerDetail && customerDetail.totalOrders > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                    <p className="text-sm text-amber-800 font-medium">This customer has {customerDetail.totalOrders} order(s) on record</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Deleting this customer will remove their account but their order history will be preserved.
                      {customerDetail.clubOrders.some(o => o.status === 'pending_approval' || o.status === 'approved' || o.status === 'needs_payment') && (
                        <span className="font-semibold text-red-600 block mt-1">
                          Warning: This customer has open/pending orders that may still need processing.
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    Are you sure you want to permanently delete this customer record? This action cannot be undone.
                  </p>
                </div>

                {deleteError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deleteError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!selectedCustomerEmail) return
                      setDeleting(true)
                      setDeleteError(null)
                      try {
                        const hasOrders = customerDetail && customerDetail.totalOrders > 0
                        const url = `/api/admin/customers/${encodeURIComponent(selectedCustomerEmail)}${hasOrders ? '?force=true' : ''}`
                        const res = await fetch(url, { method: 'DELETE' })
                        const json = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          setDeleteError(json?.error || 'Failed to delete customer')
                          setDeleting(false)
                          return
                        }
                        setDeleteConfirmOpen(false)
                        closeCustomerModal()
                        setPeriodDays(p => p)
                      } catch {
                        setDeleteError('Network error -- please try again')
                        setDeleting(false)
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Customer'}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirmOpen(false); setDeleteError(null) }}
                    disabled={deleting}
                    className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary disabled:opacity-50"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
