'use client'

import { useState, useEffect } from 'react'
import { RenewalFormClient } from '@/app/renewal/RenewalFormClient'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface RenewalPrefill {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  shippingAddress?: {
    address1: string
    address2?: string
    city: string
    state: string
    zipCode: string
  }
  lastMedication: string | null
}

export default function PortalRenewalClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [renewalData, setRenewalData] = useState<RenewalPrefill | null>(null)
  const [renewalEligible, setRenewalEligible] = useState(true)
  const [prefillLoaded, setPrefillLoaded] = useState(false)
  const [patientId, setPatientId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchPrefill = async () => {
      try {
        const res = await fetch('/api/portal/prefill')
        if (!res.ok) throw new Error('Prefill failed')
        const data = await res.json()
        if (cancelled) return
        if (data.success && data.prefill) {
          setRenewalData(data.prefill.renewal)
          setRenewalEligible(data.prefill.renewalEligible)
          setPatientId(data.prefill.patientId || null)
          setPrefillLoaded(true)
        }
      } catch {
        // Prefill failure -> fall back to standard verify flow
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

  // Prefill failed or no patient data -- fall back to standard flow
  if (!prefillLoaded || !renewalData) {
    return <RenewalFormClient />
  }

  // Not eligible for renewal
  if (!renewalEligible) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
            Not Eligible for Renewal
          </h2>
          <p className="text-stone-600">
            Your account is not currently eligible for a prescription renewal.
            Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  const initialPatient = {
    id: patientId || 0,
    firstName: renewalData.firstName,
    lastName: renewalData.lastName,
    email: renewalData.email,
    phone: renewalData.phone,
    shippingAddress: renewalData.shippingAddress,
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-800 mb-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Your information has been pre-filled
        </div>
      </div>
      <RenewalFormClient
        portalMode
        initialPatient={initialPatient}
        initialMedication={renewalData.lastMedication || undefined}
      />
    </div>
  )
}
