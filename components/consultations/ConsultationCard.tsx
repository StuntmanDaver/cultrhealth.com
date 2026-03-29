'use client'

import Link from 'next/link'
import { Calendar, Clock, Video, FileText } from 'lucide-react'
import { CONSULTATION_STATUSES } from '@/lib/config/consultations'

export interface ConsultationCardData {
  id: number
  status: string
  consultation_type: string
  provider_email: string | null
  scheduled_at: string | null
  duration_mins: number | null
  customer_email?: string
}

interface ConsultationCardProps {
  consultation: ConsultationCardData
  showPatient?: boolean
  showActions?: boolean
}

export function ConsultationCard({ consultation, showPatient, showActions = true }: ConsultationCardProps) {
  const statusConfig = CONSULTATION_STATUSES[consultation.status as keyof typeof CONSULTATION_STATUSES]
    || { label: consultation.status, bg: 'bg-brand-primary/5', text: 'text-brand-primary/60' }

  const scheduledDate = consultation.scheduled_at ? new Date(consultation.scheduled_at) : null
  const isUpcoming = scheduledDate && scheduledDate > new Date() && consultation.status === 'scheduled'
  const isJoinable = isUpcoming && scheduledDate.getTime() - Date.now() < 10 * 60 * 1000

  return (
    <div className="bg-cream-dark rounded-xl border border-brand-primary/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-brand-primary capitalize">
              {consultation.consultation_type.replace('_', ' ')}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>

          {scheduledDate && (
            <div className="flex items-center gap-4 text-sm text-brand-primary/60 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}

          {consultation.provider_email && (
            <p className="text-xs text-brand-primary/40 mt-1">
              Provider: {consultation.provider_email}
            </p>
          )}

          {showPatient && consultation.customer_email && (
            <p className="text-xs text-brand-primary/40 mt-1">
              Patient: {consultation.customer_email}
            </p>
          )}

          {consultation.duration_mins != null && consultation.status === 'completed' && (
            <p className="text-xs text-brand-primary/40 mt-1">
              Duration: {consultation.duration_mins} min
            </p>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2 shrink-0">
            {isJoinable && (
              <Link
                href={`/consultations/${consultation.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-full text-xs font-medium hover:bg-forest-light transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Join
              </Link>
            )}
            {isUpcoming && !isJoinable && (
              <Link
                href={`/consultations/${consultation.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary/5 text-brand-primary rounded-full text-xs font-medium hover:bg-brand-primary/10 transition-colors"
              >
                View
              </Link>
            )}
            {consultation.status === 'completed' && (
              <>
                <Link
                  href={`/consultations/${consultation.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary/5 text-brand-primary rounded-full text-xs font-medium hover:bg-brand-primary/10 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
