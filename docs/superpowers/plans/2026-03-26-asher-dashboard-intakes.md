# Asher Med Dashboard — Admin Intakes Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate the Asher Med partner portal dashboard inside the admin `/admin/intakes` page, giving providers a second source of truth for patient status, order pipeline, and approval queues — all without leaving our admin panel.

**Architecture:** New server-side API route fetches patients + orders from Asher Med API, aggregates counts by status, and returns dashboard metrics. A new `AsherDashboardSection` client component renders the overview (metric cards, status grid, quick-action panels) above the existing intake submissions list.

**Tech Stack:** Next.js API route, Asher Med REST API (existing client in `lib/asher-med-api.ts`), React client component, Tailwind CSS, Lucide icons, existing `MetricCard` component pattern.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/api/admin/asher-dashboard/route.ts` | Server-side aggregation — calls Asher Med `getPatients` + `getOrders`, computes counts, returns dashboard JSON |
| Create | `app/admin/intakes/AsherDashboardSection.tsx` | Client component rendering the full dashboard: 3 metric cards, 8-status grid, Quick Approval panel, Incomplete Intakes panel |
| Modify | `app/admin/intakes/IntakeViewerClient.tsx` | Import and render `AsherDashboardSection` above existing intake list |
| Modify | `lib/asher-med-api.ts` | Expand `AsherOrderStatus` union to include the granular statuses the API actually returns (Incomplete, Approval Needed, RX Submitted, etc.) |

---

### Task 1: Expand AsherOrderStatus type

**Files:**
- Modify: `lib/asher-med-api.ts:13-19`

The current `AsherOrderStatus` union is incomplete — the Asher Med partner dashboard shows 8 order pipeline statuses that the API returns. Expand the type to accept any string (the API may return values we haven't seen yet) while keeping known statuses documented.

- [ ] **Step 1: Update the AsherOrderStatus type**

In `lib/asher-med-api.ts`, replace the current type at line 13-19:

```typescript
// Current:
export type AsherOrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'WaitingRoom';
```

With:

```typescript
/** Known order statuses from Asher Med partner portal.
 *  The API may return additional values — code should handle unknown statuses gracefully. */
export type AsherOrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'WaitingRoom'
  | 'Incomplete'
  | 'Approval Needed'
  | 'Submitted'
  | 'RX Submitted'
  | 'RX Approved'
  | 'Shipped'
  | 'Delivered'
  | 'Payment Pending'
  | (string & {});
```

The `(string & {})` allows any string while keeping autocomplete for known values.

- [ ] **Step 2: Commit**

```bash
git add lib/asher-med-api.ts
git commit -m "feat(asher): expand AsherOrderStatus with granular pipeline statuses"
```

---

### Task 2: Create the Asher Dashboard API route

**Files:**
- Create: `app/api/admin/asher-dashboard/route.ts`

This route fetches patients and orders from the Asher Med API, aggregates them into dashboard metrics, and returns the result. It reuses the existing admin auth pattern from `app/api/admin/intakes/route.ts`.

- [ ] **Step 1: Create the API route**

Create `app/api/admin/asher-dashboard/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import {
  getPatients,
  getOrders,
  isAsherMedConfigured,
} from '@/lib/asher-med-api'
import type { AsherPatient, AsherOrder } from '@/lib/asher-med-api'
import { sql } from '@vercel/postgres'

/** The 8 pipeline statuses shown on the Asher Med partner dashboard */
const PIPELINE_STATUSES = [
  'Incomplete',
  'Approval Needed',
  'Submitted',
  'RX Submitted',
  'RX Approved',
  'Shipped',
  'Delivered',
  'Payment Pending',
] as const

type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

export interface AsherDashboardData {
  patients: {
    total: number
    active: number
    inactive: number
    activePercent: number
    inactivePercent: number
  }
  orderStatusCounts: Record<string, number>
  pipelineStatuses: typeof PIPELINE_STATUSES
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

/** Normalise whatever status string the API returns into a known pipeline bucket */
function normaliseToPipelineStatus(status: string): PipelineStatus | null {
  const lower = status.toLowerCase().replace(/[_-]/g, ' ').trim()

  const map: Record<string, PipelineStatus> = {
    incomplete: 'Incomplete',
    pending: 'Approval Needed',
    'approval needed': 'Approval Needed',
    'waitingroom': 'Approval Needed',
    submitted: 'Submitted',
    approved: 'Submitted',
    'rx submitted': 'RX Submitted',
    'rx approved': 'RX Approved',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Delivered',
    'payment pending': 'Payment Pending',
  }

  return map[lower] ?? null
}

export async function GET() {
  try {
    // Verify admin access (same pattern as /api/admin/intakes)
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails =
      process.env.ADMIN_ALLOWED_EMAILS ||
      process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS ||
      ''
    const allowedEmails = adminEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin =
      allowedEmails.includes(session.email.toLowerCase()) ||
      isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if Asher Med is configured
    if (!isAsherMedConfigured()) {
      return NextResponse.json({
        data: {
          patients: { total: 0, active: 0, inactive: 0, activePercent: 0, inactivePercent: 0 },
          orderStatusCounts: Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0])),
          pipelineStatuses: PIPELINE_STATUSES,
          quickApproval: [],
          incompleteIntakes: [],
          lastSynced: new Date().toISOString(),
        } satisfies AsherDashboardData,
      })
    }

    // Fetch patients and orders in parallel from Asher Med
    const [patientsRes, ordersRes] = await Promise.all([
      getPatients({ limit: 1000 }),
      getOrders({ limit: 1000 }),
    ])

    const patients: AsherPatient[] = patientsRes.data || []
    const orders: AsherOrder[] = ordersRes.data || []

    // --- Patient metrics ---
    const active = patients.filter((p) => p.status === 'ACTIVE').length
    const inactive = patients.filter((p) => p.status === 'INACTIVE').length
    const total = patients.length

    // --- Order pipeline counts ---
    const orderStatusCounts: Record<string, number> = Object.fromEntries(
      PIPELINE_STATUSES.map((s) => [s, 0])
    )

    for (const order of orders) {
      const bucket = normaliseToPipelineStatus(order.status)
      if (bucket) {
        orderStatusCounts[bucket]++
      } else {
        // Unknown status — still count it under its raw name
        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1
      }
    }

    // --- Quick Approval (orders needing partner approval) ---
    const approvalOrders = orders
      .filter((o) => {
        const lower = o.status.toLowerCase().replace(/[_-]/g, ' ').trim()
        return lower === 'pending' || lower === 'approval needed' || lower === 'waitingroom'
      })
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        patientName: o.patient
          ? `${o.patient.firstName || ''} ${o.patient.lastName || ''}`.trim()
          : 'Unknown',
        email: o.patient?.email || '',
        createdAt: o.createdAt,
        status: o.status,
      }))

    // --- Incomplete intakes from our DB ---
    let incompleteIntakes: AsherDashboardData['incompleteIntakes'] = []
    if (process.env.POSTGRES_URL) {
      const result = await sql`
        SELECT id, customer_email, plan_tier, created_at
        FROM pending_intakes
        WHERE intake_status = 'pending'
        ORDER BY created_at DESC
        LIMIT 10
      `
      incompleteIntakes = result.rows.map((r) => ({
        id: r.id,
        email: r.customer_email,
        planTier: r.plan_tier,
        createdAt: r.created_at,
      }))
    }

    const data: AsherDashboardData = {
      patients: {
        total,
        active,
        inactive,
        activePercent: total > 0 ? Math.round((active / total) * 100) : 0,
        inactivePercent: total > 0 ? Math.round((inactive / total) * 100) : 0,
      },
      orderStatusCounts,
      pipelineStatuses: PIPELINE_STATUSES,
      quickApproval: approvalOrders,
      incompleteIntakes,
      lastSynced: new Date().toISOString(),
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[admin/asher-dashboard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Asher Med dashboard data' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/asher-dashboard/route.ts
git commit -m "feat(admin): add Asher Med dashboard API route with patient/order aggregation"
```

---

### Task 3: Create the AsherDashboardSection component

**Files:**
- Create: `app/admin/intakes/AsherDashboardSection.tsx`

This client component renders the dashboard matching the Asher Med partner portal screenshot: 3 metric cards (All Time Patients, Active, Inactive), an 8-status pipeline grid, Quick Approval panel, and Incomplete Intakes panel.

- [ ] **Step 1: Create the component**

Create `app/admin/intakes/AsherDashboardSection.tsx`:

```tsx
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
  ExternalLink,
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
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/intakes/AsherDashboardSection.tsx
git commit -m "feat(admin): add Asher Med dashboard section with patient metrics and status pipeline"
```

---

### Task 4: Integrate dashboard into the Intakes page

**Files:**
- Modify: `app/admin/intakes/IntakeViewerClient.tsx`

Stack the `AsherDashboardSection` above the existing intake submissions list. Add a visual divider between the two sections.

- [ ] **Step 1: Add the import and render the dashboard**

At the top of `IntakeViewerClient.tsx`, add the import:

```typescript
import AsherDashboardSection from './AsherDashboardSection'
```

Then in the JSX, insert `<AsherDashboardSection />` between the header and the error/loading/list section. The return should become:

```tsx
return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Submissions</h1>
          <p className="text-sm text-gray-500">
            Asher Med partner overview &amp; intake submissions
          </p>
        </div>
        <button
          onClick={fetchIntakes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Intakes
        </button>
      </div>

      {/* Asher Med Dashboard */}
      <AsherDashboardSection />

      {/* Divider */}
      <div className="border-t border-gray-200 my-6" />

      {/* Section header for intake list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Submissions ({intakes.length})
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && intakes.length === 0 && (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      )}

      {/* Empty */}
      {!loading && intakes.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-gray-500">No intake submissions yet.</p>
        </div>
      )}

      {/* Intakes List — unchanged from here */}
      {intakes.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* ... existing intake list rows ... */}
        </div>
      )}
    </div>
  </div>
)
```

Key changes:
- Remove the `<ArrowLeft>` back link (page is accessed via sidebar, not drilldown)
- Remove `ArrowLeft` from the lucide import
- Widen container from `max-w-5xl` to `max-w-6xl` to accommodate the dashboard cards
- Update subtitle to "Asher Med partner overview & intake submissions"
- Button text from "Refresh" to "Refresh Intakes" to distinguish from dashboard refresh
- Add `<AsherDashboardSection />` between header and intake list
- Add divider and "Submissions (N)" sub-header

- [ ] **Step 2: Commit**

```bash
git add app/admin/intakes/IntakeViewerClient.tsx
git commit -m "feat(admin): integrate Asher Med dashboard into intakes page"
```

---

### Task 5: Verify and test

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors in new/modified files.

- [ ] **Step 2: Run existing tests**

```bash
npm test
```

Expected: All existing tests pass — no regressions.

- [ ] **Step 3: Manual verification**

Open `http://localhost:3000/admin/intakes` and verify:

1. Dashboard section loads above intake list
2. 3 patient metric cards render (may show 0 if staging has no Asher Med data)
3. 8-status pipeline grid renders with correct icons and colors
4. Quick Approval panel renders (empty state OK)
5. Incomplete Intakes panel renders (shows pending intakes from DB)
6. Refresh buttons work independently (dashboard vs intakes)
7. Error state shows gracefully if Asher Med API is not configured

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete Asher Med dashboard integration on intakes page"
```
