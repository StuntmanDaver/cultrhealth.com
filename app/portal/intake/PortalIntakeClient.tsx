'use client'

import { useState, useEffect } from 'react'
import { IntakeFormProvider } from '@/lib/contexts/intake-form-context'
import { IntakeFormClient } from '@/app/intake/IntakeFormClient'
import { Loader2, CheckCircle2 } from 'lucide-react'
import type { SimpleFormData } from '@/lib/contexts/intake-form-context'

export default function PortalIntakeClient() {
  const [prefillData, setPrefillData] = useState<Partial<SimpleFormData> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [prefillLoaded, setPrefillLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchPrefill = async () => {
      try {
        const res = await fetch('/api/portal/prefill')
        if (!res.ok) throw new Error('Prefill failed')
        const data = await res.json()
        if (cancelled) return
        if (data.success && data.prefill?.intake) {
          setPrefillData(data.prefill.intake)
          setPrefillLoaded(true)
        }
      } catch {
        // Prefill is enhancement, not gate -- continue without it
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchPrefill()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary/40 mx-auto mb-3" />
          <p className="text-sm text-brand-primary/50">Loading your information...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {prefillLoaded && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Fields pre-filled from your profile
          </div>
        </div>
      )}
      <IntakeFormProvider initialData={prefillData || undefined}>
        <IntakeFormClient />
      </IntakeFormProvider>
    </div>
  )
}
