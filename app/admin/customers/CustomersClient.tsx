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
    const filtered = filterByDateRange(customers, startDate, endDate)
      .filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase())
      )
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
          onClick={() => { setSelectedCustomerEmail(null); setCustomerDetail(null) }}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg text-brand-primary">
                  {customerDetail?.member?.name || 'Customer'}
                </h3>
                <p className="text-sm text-brand-primary/60">{selectedCustomerEmail}</p>
              </div>
              <button
                onClick={() => { setSelectedCustomerEmail(null); setCustomerDetail(null) }}
                className="text-brand-primary/40 hover:text-brand-primary text-xl"
              >
                &times;
              </button>
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

                    {customerDetail.member && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-brand-primary/60 uppercase tracking-wide">Member Info</h4>
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
                          {customerDetail.member.signup_type && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Signup Type</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${customerDetail.member.signup_type === 'membership' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {customerDetail.member.signup_type === 'membership' ? 'Membership' : 'Products'}
                              </span>
                            </div>
                          )}
                          {(customerDetail.member.address_city || customerDetail.member.address_state) && (
                            <div className="flex justify-between text-sm">
                              <span className="text-brand-primary/60">Address</span>
                              <span className="text-brand-primary text-right">
                                {[customerDetail.member.address_line1, customerDetail.member.address_city, customerDetail.member.address_state, customerDetail.member.address_zip].filter(Boolean).join(', ')}
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
                            <div key={o.id} className="bg-brand-cream/30 rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <span className="font-mono text-sm text-brand-primary">{o.order_number}</span>
                                <span className="ml-2 text-xs text-brand-primary/40">{formatDate(o.created_at)}</span>
                                {o.coupon_code && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{o.coupon_code}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-brand-primary">{o.subtotal_usd ? formatCurrency(o.subtotal_usd) : 'TBD'}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>{o.status}</span>
                              </div>
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
                            <div key={o.id} className="bg-brand-cream/30 rounded-lg p-3 flex items-center justify-between">
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
        </div>
      )}
    </div>
  )
}
