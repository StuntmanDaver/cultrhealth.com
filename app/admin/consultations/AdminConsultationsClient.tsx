'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'
import { CONSULTATION_STATUSES } from '@/lib/config/consultations'

export function AdminConsultationsClient() {
  const [consultations, setConsultations] = useState<Array<Record<string, unknown>>>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        params.set('limit', '50')

        const res = await fetch(`/api/admin/consultations?${params}`)
        const data = await res.json()
        if (data.success) {
          setConsultations(data.consultations)
          setTotal(data.total)
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [statusFilter])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-brand-primary">Consultations</h1>
          <p className="text-sm text-brand-primary/50">{total} total</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!statusFilter ? 'bg-brand-primary text-white' : 'bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10'}`}
        >
          All
        </button>
        {Object.entries(CONSULTATION_STATUSES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === key ? 'bg-brand-primary text-white' : `${config.bg} ${config.text} hover:opacity-80`}`}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-brand-primary/40 text-center py-8">Loading...</p>
        ) : consultations.length === 0 ? (
          <p className="text-brand-primary/40 text-center py-8">No consultations found.</p>
        ) : (
          consultations.map((c) => (
            <Link key={c.id as number} href={`/provider/consultations/${c.id}`}>
              <ConsultationCard consultation={c as never} showPatient showActions={false} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
