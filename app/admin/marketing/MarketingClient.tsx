'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDate } from '@/lib/admin-utils'
import type { AnalyticsData } from '@/lib/admin-types'

type MarketingTab = 'qr' | 'waitlist' | 'quiz'

export default function MarketingClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)
  const [tab, setTab] = useState<MarketingTab>('qr')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?days=${periodDays}`)
      .then(r => r.json())
      .then(result => { if (result.data) setData(result.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [periodDays])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Marketing</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Marketing</h1>
        <p className="text-brand-primary/60">Failed to load data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl text-brand-primary">Marketing</h1>
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

      <nav className="flex gap-1 border-b border-brand-primary/10" aria-label="Marketing tabs">
        {([
          { id: 'qr', label: `QR Analytics${data.qrScans?.totalScans ? ` (${data.qrScans.totalScans})` : ''}` },
          { id: 'waitlist', label: `Waitlist${data.waitlist?.total ? ` (${data.waitlist.total})` : ''}` },
          { id: 'quiz', label: `Quiz Leads${data.quizLeads?.filter(l => l.lead_email).length ? ` (${data.quizLeads.filter(l => l.lead_email).length})` : ''}` },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-cultr-forest text-cultr-forest'
                : 'border-transparent text-cultr-textMuted hover:text-cultr-forest hover:border-brand-primary/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Waitlist Sources */}
      {tab === 'waitlist' && Object.keys(data.waitlist.bySource).length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-4">Waitlist by Source</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.waitlist.bySource).map(([source, count]) => (
              <span
                key={source}
                className="px-4 py-2 bg-brand-cream rounded-full text-sm font-medium text-brand-primary"
              >
                {source}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Scan Analytics */}
      {tab === 'qr' && data.qrScans && data.qrScans.totalScans > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-4">QR Code Scans</h2>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-primary">{data.qrScans.totalScans}</div>
              <div className="text-xs text-brand-primary/60 mt-1">Total Scans</div>
            </div>
            <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-primary">{data.qrScans.uniqueVisitors}</div>
              <div className="text-xs text-brand-primary/60 mt-1">Unique Visitors</div>
            </div>
            <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-primary">
                {data.qrScans.totalScans > 0 ? Math.round((data.qrScans.uniqueVisitors / data.qrScans.totalScans) * 100) : 0}%
              </div>
              <div className="text-xs text-brand-primary/60 mt-1">Unique Rate</div>
            </div>
            <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-primary">
                {Object.keys(data.qrScans.byDevice).length > 0
                  ? Object.entries(data.qrScans.byDevice).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
                  : '—'}
              </div>
              <div className="text-xs text-brand-primary/60 mt-1">Top Device</div>
            </div>
          </div>

          {/* Scans over time */}
          {data.qrScans.scansByDay.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">Scans Over Time</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.qrScans.scansByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickFormatter={(val: string) => {
                        const d = new Date(val)
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      labelFormatter={(label: string) => {
                        const d = new Date(label)
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      }}
                    />
                    <Bar dataKey="count" fill="#2A4542" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Breakdowns row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* By Destination */}
            {Object.keys(data.qrScans.byDestination).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">By Destination</h3>
                <div className="space-y-1">
                  {Object.entries(data.qrScans.byDestination).map(([dest, count]) => (
                    <div key={dest} className="flex justify-between text-sm">
                      <span className="text-brand-primary capitalize">{dest}</span>
                      <span className="text-brand-primary/60 font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* By OS */}
            {Object.keys(data.qrScans.byOs).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">By OS</h3>
                <div className="space-y-1">
                  {Object.entries(data.qrScans.byOs).map(([os, count]) => (
                    <div key={os} className="flex justify-between text-sm">
                      <span className="text-brand-primary">{os}</span>
                      <span className="text-brand-primary/60 font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* By Browser */}
            {Object.keys(data.qrScans.byBrowser).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">By Browser</h3>
                <div className="space-y-1">
                  {Object.entries(data.qrScans.byBrowser).map(([browser, count]) => (
                    <div key={browser} className="flex justify-between text-sm">
                      <span className="text-brand-primary">{browser}</span>
                      <span className="text-brand-primary/60 font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Cities */}
          {data.qrScans.byCity.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">Top Locations</h3>
              <div className="flex flex-wrap gap-2">
                {data.qrScans.byCity.map((loc) => (
                  <span
                    key={`${loc.city}-${loc.region}`}
                    className="px-3 py-1.5 bg-brand-cream rounded-full text-xs font-medium text-brand-primary"
                  >
                    {loc.city}{loc.region ? `, ${loc.region}` : ''} ({loc.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Scans Table */}
          {data.qrScans.recentScans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">Recent Scans</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-primary/10">
                      <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Destination</th>
                      <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Source</th>
                      <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Device</th>
                      <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">OS / Browser</th>
                      <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Location</th>
                      <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.qrScans.recentScans.slice(0, 10).map((scan, index) => (
                      <tr key={scan.scan_id} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                        <td className="py-2 px-3 text-brand-primary text-sm capitalize">{scan.destination}</td>
                        <td className="py-2 px-3 text-brand-primary/60 text-sm">{scan.source.replace(/_/g, ' ')}</td>
                        <td className="py-2 px-3 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            scan.device_type === 'mobile' ? 'bg-blue-100 text-blue-800' :
                            scan.device_type === 'tablet' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {scan.device_type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-brand-primary/60 text-xs">{scan.os} / {scan.browser}</td>
                        <td className="py-2 px-3 text-brand-primary/60 text-xs">
                          {scan.city ? `${scan.city}${scan.region ? `, ${scan.region}` : ''}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-brand-primary/60 text-xs">{formatDate(scan.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz Leads */}
      {tab === 'quiz' && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-1">Quiz Leads</h2>
          <p className="text-sm text-brand-primary/50 mb-4">Contact info captured after quiz completion, before checkout.</p>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Completed Quiz', value: data.quizLeads?.length ?? 0 },
              { label: 'Contact Captured', value: data.quizLeads?.filter(l => l.lead_email).length ?? 0 },
              { label: 'Clicked Join', value: data.quizLeads?.filter(l => l.clicked_join).length ?? 0 },
              {
                label: 'Capture Rate',
                value: data.quizLeads?.length
                  ? `${Math.round((data.quizLeads.filter(l => l.lead_email).length / data.quizLeads.length) * 100)}%`
                  : '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-brand-cream/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-brand-primary">{value}</div>
                <div className="text-xs text-brand-primary/60 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {(data.quizLeads ?? []).filter(l => l.lead_email).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-primary/10">
                    <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Name</th>
                    <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Email</th>
                    <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Phone</th>
                    <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Recommended</th>
                    <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Joined</th>
                    <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quizLeads.filter(l => l.lead_email).map((lead, i) => (
                    <tr key={lead.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                      <td className="py-2 px-3 text-brand-primary text-sm">
                        {[lead.lead_first_name, lead.lead_last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="py-2 px-3 text-brand-primary text-sm">{lead.lead_email}</td>
                      <td className="py-2 px-3 text-brand-primary/60 text-sm">{lead.lead_phone || '—'}</td>
                      <td className="py-2 px-3 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-mint text-brand-primary capitalize">
                          {lead.recommended_tier}{lead.recommended_therapy ? ` — ${lead.recommended_therapy}` : ''}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {lead.clicked_join
                          ? <span className="text-green-700 font-medium">Yes</span>
                          : <span className="text-brand-primary/40">No</span>}
                      </td>
                      <td className="py-2 px-3 text-brand-primary/60 text-xs">{formatDate(lead.lead_captured_at ?? lead.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-brand-primary/50 text-sm text-center py-8">No leads with contact info yet.</p>
          )}
        </div>
      )}

      {/* Recent Waitlist Signups */}
      {tab === 'waitlist' && data.waitlist.recent.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-4">Recent Waitlist Signups</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-primary/10">
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Source</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.waitlist.recent.map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                    <td className="py-3 px-4 text-brand-primary">{entry.name}</td>
                    <td className="py-3 px-4 text-brand-primary">{entry.email}</td>
                    <td className="py-3 px-4 text-brand-primary/60">{entry.source || 'direct'}</td>
                    <td className="py-3 px-4 text-brand-primary/60 text-sm">
                      {formatDate(entry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
