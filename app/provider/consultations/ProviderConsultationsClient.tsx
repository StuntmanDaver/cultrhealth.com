'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConsultationCard, type ConsultationCardData } from '@/components/consultations/ConsultationCard'

type ViewMode = 'day' | 'week'

interface ProviderConsultationsClientProps {
  providerEmail: string
}

function groupByDate(consultations: ConsultationCardData[]) {
  const groups: Record<string, ConsultationCardData[]> = {}
  for (const c of consultations) {
    const dateKey = c.scheduled_at
      ? new Date(c.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : 'Unscheduled'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(c)
  }
  return groups
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export function ProviderConsultationsClient({ providerEmail }: ProviderConsultationsClientProps) {
  const [view, setView] = useState<ViewMode>('day')
  const [upcoming, setUpcoming] = useState<ConsultationCardData[]>([])
  const [past, setPast] = useState<ConsultationCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const days = view === 'week' ? 7 : 1
        const [upRes, allRes] = await Promise.all([
          fetch(`/api/provider/consultations?days=${days}`),
          fetch('/api/provider/consultations'),
        ])
        const upData = await upRes.json()
        const allData = await allRes.json()
        if (upData.success) setUpcoming(upData.consultations)
        if (allData.success) setPast(allData.consultations.filter((c: ConsultationCardData) => c.status === 'completed'))
      } catch {
        // Silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [view])

  const dateGroups = view === 'week' ? groupByDate(upcoming) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-primary/40">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <section className="py-8 px-6 border-b border-brand-primary/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-brand-primary mb-1">Provider Schedule</h1>
              <p className="text-sm text-brand-primary/50">{providerEmail}</p>
            </div>
            {/* Day / Week toggle */}
            <div className="flex bg-stone-100 rounded-xl p-0.5">
              <button
                onClick={() => setView('day')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === 'day' ? 'bg-white text-cultr-forest shadow-sm' : 'text-cultr-textMuted hover:text-cultr-forest'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === 'week' ? 'bg-white text-cultr-forest shadow-sm' : 'text-cultr-textMuted hover:text-cultr-forest'
                }`}
              >
                This Week
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upcoming / Schedule */}
          <div>
            <h2 className="font-display text-xl text-brand-primary mb-3">
              {view === 'day' ? 'Today' : 'This Week'} ({upcoming.length})
            </h2>

            {upcoming.length === 0 ? (
              <p className="text-sm text-brand-primary/40">
                No consultations scheduled {view === 'day' ? 'today' : 'this week'}.
              </p>
            ) : view === 'week' && dateGroups ? (
              <div className="space-y-6">
                {Object.entries(dateGroups).map(([dateLabel, items]) => {
                  const todayGroup = items.some((c) => isToday(c.scheduled_at))
                  return (
                    <div key={dateLabel}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                        todayGroup ? 'text-cultr-forest' : 'text-cultr-textMuted'
                      }`}>
                        {dateLabel} {todayGroup && '— Today'}
                      </p>
                      <div className="space-y-3">
                        {items.map((c) => (
                          <Link key={c.id} href={`/provider/consultations/${c.id}`}>
                            <div className={todayGroup ? 'border-l-4 border-cultr-forest pl-3 rounded-r-xl' : ''}>
                              <ConsultationCard consultation={c} showPatient showActions={false} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((c) => (
                  <Link key={c.id} href={`/provider/consultations/${c.id}`}>
                    <ConsultationCard consultation={c} showPatient showActions={false} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          <div>
            <h2 className="font-display text-xl text-brand-primary mb-3">Completed ({past.length})</h2>
            <div className="space-y-3">
              {past.length === 0 ? (
                <p className="text-sm text-brand-primary/40">No completed consultations yet.</p>
              ) : (
                past.map((c) => (
                  <Link key={c.id} href={`/provider/consultations/${c.id}`}>
                    <ConsultationCard consultation={c} showPatient showActions={false} />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
