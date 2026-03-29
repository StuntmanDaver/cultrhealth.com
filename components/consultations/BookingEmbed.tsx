'use client'

import type { ConsultationType } from '@/lib/config/consultations'

interface BookingEmbedProps {
  calLink: string
  consultationType: ConsultationType
  memberEmail: string
  planTier: string
}

export function BookingEmbed({ calLink, consultationType, memberEmail, planTier }: BookingEmbedProps) {
  return (
    <div className="w-full" style={{ minHeight: 500 }}>
      <iframe
        src={`https://cal.com/${calLink}?email=${encodeURIComponent(memberEmail)}&layout=month_view`}
        className="w-full h-full border-0"
        style={{ minHeight: 500 }}
        title={`Book ${consultationType} consultation`}
        data-plan-tier={planTier}
      />
    </div>
  )
}
