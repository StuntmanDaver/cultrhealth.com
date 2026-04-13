'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Clock,
  FileText,
  CheckCircle2,
  Link2,
  ShieldCheck,
  Truck,
  Gift,
  CreditCard,
  Users,
  UserCheck,
  UserMinus,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface DashboardData {
  patients: {
    total: number
    active: number
    inactive: number
    activePercent: number
    inactivePercent: number
  }
  orderStatusCounts: Record<string, number>
  pipelineStatuses: string[]
  quickApproval: Array<{
    id: string | number
    patientName: string
    email: string
    createdAt: string
    status: string
  }>
  incompleteIntakes: Array<{
    id: string
    email: string
    planTier: string | null
    createdAt: string
  }>
  lastSynced: string
}

/** Icon + color config for each pipeline status */
const STATUS_CONFIG: Record<string, { icon: typeof Clock; bg: string; iconColor: string }> = {
  Incomplete: { icon: Clock, bg: 'bg-red-100', iconColor: 'text-red-500' },
  'Approval Needed': { icon: FileText, bg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  Submitted: { icon: CheckCircle2, bg: 'bg-emerald-100', iconColor: 'text-emerald-500' },
  'RX Submitted': { icon: Link2, bg: 'bg-purple-100', iconColor: 'text-purple-500' },
  'RX Approved': { icon: ShieldCheck, bg: 'bg-teal-100', iconColor: 'text-teal-500' },
  Shipped: { icon: Truck, bg: 'bg-blue-100', iconColor: 'text-blue-500' },
  Delivered: { icon: Gift, bg: 'bg-green-100', iconColor: 'text-green-600' },
  'Payment Pending': { icon: CreditCard, bg: 'bg-slate-100', iconColor: 'text-slate-500' },
}

const PATIENT_CARDS = [
  { key: 'total' as const, label: 'All Time Patients Referred', icon: Users, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { key: 'active' as const, label: 'Active Patients', icon: UserCheck, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { key: 'inactive' as const, label: 'Inactive Patients', icon: UserMinus, iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
]

export default function AsherDashboardSection() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/asher-dashboard')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch dashboard')
      setData(json.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading && !data) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading Asher Med dashboard...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
        <button onClick={fetchDashboard} className="ml-auto text-red-600 underline text-xs">
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const percentLabel = (pct: number) =>
    pct > 0 ? `${pct}%` : '0%'

  return (
    <div className="space-y-6 mb-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">
            Live data from Asher Med Partner Portal
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.lastSynced && (
            <span className="text-xs text-gray-400">
              Synced {new Date(data.lastSynced).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Patient metric cards — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PATIENT_CARDS.map((card) => {
          const count = data.patients[card.key]
          const pct =
            card.key === 'active'
              ? data.patients.activePercent
              : card.key === 'inactive'
              ? data.patients.inactivePercent
              : 100
          const Icon = card.icon

          return (
            <div key={card.key} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-sm text-gray-500">{card.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">{count}</span>
                <span className={`text-sm ${card.key === 'active' ? 'text-green-600' : card.key === 'inactive' ? 'text-orange-500' : 'text-indigo-600'}`}>
                  {percentLabel(pct)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Patient Status Overview — 8-status pipeline grid */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Patient Status Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click on any status to filter patients below</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {(data.pipelineStatuses || Object.keys(STATUS_CONFIG)).map((status) => {
            const config = STATUS_CONFIG[status] || {
              icon: FileText,
              bg: 'bg-gray-100',
              iconColor: 'text-gray-500',
            }
            const Icon = config.icon
            const count = data.orderStatusCounts[status] || 0

            return (
              <div
                key={status}
                className="flex flex-col items-center text-center group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <span className="text-xl font-semibold text-gray-900">{count}</span>
                <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{status}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row: Quick Approval + Incomplete Intakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Approval */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Quick Approval</h3>
              <p className="text-xs text-gray-400">Patients waiting for approval</p>
            </div>
          </div>

          {data.quickApproval.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              Don&apos;t have any quick approval orders
            </p>
          ) : (
            <div className="space-y-3">
              {data.quickApproval.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.patientName || order.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incomplete Intakes */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Incomplete Intakes</h3>
              <p className="text-xs text-gray-400">Patients who started but didn&apos;t complete intake</p>
            </div>
          </div>

          {data.incompleteIntakes.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              No incomplete intakes found
            </p>
          ) : (
            <div className="space-y-3">
              {data.incompleteIntakes.map((intake) => (
                <div
                  key={intake.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{intake.email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(intake.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {intake.planTier && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                      {intake.planTier}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
