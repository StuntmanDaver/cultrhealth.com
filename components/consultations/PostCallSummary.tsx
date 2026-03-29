'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, FileText, CalendarPlus } from 'lucide-react'

interface PostCallSummaryProps {
  consultationId: number
  providerName: string
  durationMins: number | null
  hasNotes: boolean
}

export function PostCallSummary({ consultationId, providerName, durationMins, hasNotes }: PostCallSummaryProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="font-display text-2xl text-brand-primary mb-2">
        Consultation Complete
      </h2>
      <p className="text-sm text-brand-primary/60 mb-6">
        Your consultation with {providerName} has ended.
      </p>

      <div className="bg-cream-dark rounded-xl p-4 mb-6 text-left">
        {durationMins != null && (
          <div className="flex items-center gap-2 text-sm text-brand-primary mb-2">
            <Clock className="w-4 h-4 text-brand-primary/40" />
            Duration: {durationMins} minutes
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-brand-primary">
          <FileText className="w-4 h-4 text-brand-primary/40" />
          {hasNotes
            ? 'Provider notes are available.'
            : 'Provider notes will appear here once submitted.'}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {hasNotes && (
          <Link
            href={`/consultations/${consultationId}`}
            className="w-full py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors text-center"
          >
            View Notes
          </Link>
        )}
        <Link
          href="/consultations"
          className="w-full py-2.5 bg-brand-primary/5 text-brand-primary rounded-full text-sm font-medium hover:bg-brand-primary/10 transition-colors text-center flex items-center justify-center gap-2"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Follow-up
        </Link>
      </div>
    </div>
  )
}
