'use client'

import Link from 'next/link'
import {
  Calendar,
  ClipboardList,
  Users,
  UserCheck,
  Clock,
  Video,
  FlaskConical,
  ArrowRight,
} from 'lucide-react'
import { useProvider } from '@/lib/contexts/ProviderContext'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-cultr-textMuted font-medium">{label}</p>
          <p className="text-2xl font-bold text-cultr-forest mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl grad-mint flex items-center justify-center">
          <Icon className="w-5 h-5 text-cultr-forest" />
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-cultr-textMuted" />
      <h2 className="text-sm font-semibold uppercase tracking-wider text-cultr-textMuted">{label}</h2>
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 animate-pulse">
          <div className="h-3 w-16 bg-stone-100 rounded mb-3" />
          <div className="h-7 w-24 bg-stone-100 rounded" />
        </div>
      ))}
    </div>
  )
}

function AgendaSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-cream-dark rounded-xl border border-brand-primary/10 p-4 animate-pulse">
          <div className="h-4 w-32 bg-stone-100 rounded mb-2" />
          <div className="h-3 w-48 bg-stone-100 rounded" />
        </div>
      ))}
    </div>
  )
}

const TIER_BADGE: Record<string, string> = {
  core: 'bg-blue-50 text-blue-700',
  catalyst: 'bg-purple-50 text-purple-700',
  concierge: 'bg-amber-50 text-amber-700',
  club: 'bg-stone-100 text-stone-600',
}

export function ProviderDashboardClient({ providerEmail }: { providerEmail: string }) {
  const { metrics, todayConsultations, pendingIntakes, loading } = useProvider()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-primary">
            Provider Dashboard
          </h1>
          <p className="text-sm text-brand-primary/50 mt-1">{today}</p>
        </div>

        {/* Metrics */}
        {loading ? (
          <MetricsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Today's Consults" value={metrics?.todayConsultations ?? 0} icon={Calendar} />
            <MetricCard label="Pending Intakes" value={metrics?.pendingIntakes ?? 0} icon={ClipboardList} />
            <MetricCard label="Patients This Month" value={metrics?.patientsThisMonth ?? 0} icon={Users} />
            <MetricCard label="Active Patients" value={metrics?.activePatients ?? 0} icon={UserCheck} />
          </div>
        )}

        {/* Today's Agenda */}
        <section>
          <SectionLabel icon={Clock} label="Today's Agenda" />
          {loading ? (
            <AgendaSkeleton />
          ) : todayConsultations.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-primary/40">No consultations scheduled today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayConsultations.map((c) => (
                <Link key={c.id} href={`/provider/consultations/${c.id}`}>
                  <ConsultationCard consultation={c} showPatient showActions={false} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Intakes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel icon={ClipboardList} label="Recent Intakes" />
            <Link
              href="/provider/patients"
              className="text-xs text-cultr-forest hover:text-forest-light font-medium transition-colors"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 py-3">
                  <div className="h-4 w-40 bg-stone-100 rounded" />
                  <div className="h-4 w-16 bg-stone-100 rounded" />
                  <div className="h-4 w-20 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          ) : pendingIntakes.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-primary/40">No pending intakes to review.</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">
                      Patient
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden md:table-cell">
                      Tier
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden md:table-cell">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden sm:table-cell">
                      Submitted
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingIntakes.map((intake, i) => (
                    <tr key={intake.id} className={i % 2 === 0 ? 'bg-stone-50/50' : ''}>
                      <td className="px-4 py-3 text-sm text-brand-primary truncate max-w-[200px]">
                        {intake.customer_email}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIER_BADGE[intake.plan_tier] || 'bg-stone-100 text-stone-600'}`}>
                          {intake.plan_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                          {intake.intake_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-primary/50 hidden sm:table-cell">
                        {new Date(intake.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/provider/patients"
                          className="text-xs font-medium text-cultr-forest hover:text-forest-light transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <SectionLabel icon={ArrowRight} label="Quick Actions" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/provider/consultations"
              className="grad-dark text-white rounded-2xl p-5 hover:opacity-90 transition-opacity group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold">Consultations</p>
                  <p className="text-sm text-white/70">View schedule &amp; join calls</p>
                </div>
                <Video className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
            <Link
              href="/provider/patients"
              className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-cultr-forest/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-brand-primary">Patient Records</p>
                  <p className="text-sm text-brand-primary/50">Review intakes &amp; history</p>
                </div>
                <Users className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
              </div>
            </Link>
            <Link
              href="/provider/protocol-builder"
              className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-cultr-forest/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-brand-primary">Protocol Builder</p>
                  <p className="text-sm text-brand-primary/50">AI-powered treatment plans</p>
                </div>
                <FlaskConical className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
