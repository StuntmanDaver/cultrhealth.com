'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ClipboardList,
  Package,
  Video,
  TestTube2,
  User,
} from 'lucide-react'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'

interface PatientData {
  membership: {
    id: number
    email: string
    plan_tier: string
    subscription_status: string
    asher_patient_id: number | null
    member_since: string
  }
  intakes: Array<{
    id: number
    intake_status: string
    intake_data: Record<string, unknown> | null
    created_at: string
    completed_at: string | null
  }>
  orders: Array<{
    id: number
    asher_order_id: number | null
    order_type: string
    order_status: string | null
    medication_packages: unknown
    partner_note: string | null
    created_at: string
  }>
  consultations: Array<{
    id: number
    status: string
    consultation_type: string
    provider_email: string | null
    scheduled_at: string | null
    duration_mins: number | null
    customer_email: string
    note_reason: string | null
    note_outcome: string | null
    note_next_steps: string | null
  }>
  labResults: {
    report_data: unknown
    report_status: string
    created_at: string
  } | null
}

const TIER_BADGE: Record<string, string> = {
  core: 'bg-blue-50 text-blue-700',
  catalyst: 'bg-purple-50 text-purple-700',
  concierge: 'bg-amber-50 text-amber-700',
  club: 'bg-stone-100 text-stone-600',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  past_due: 'bg-yellow-50 text-yellow-700',
  paused: 'bg-stone-100 text-stone-600',
}

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  shipped: 'bg-blue-50 text-blue-700',
  completed: 'bg-brand-primary/5 text-brand-primary',
  cancelled: 'bg-red-50 text-red-700',
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-cultr-textMuted" />
      <h2 className="text-sm font-semibold uppercase tracking-wider text-cultr-textMuted">{label}</h2>
    </div>
  )
}

// Render intake JSONB data in structured sections
function IntakeDataViewer({ data }: { data: Record<string, unknown> }) {
  const sections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> = []

  // Personal info
  const personalFields: Array<{ label: string; value: string }> = []
  if (data.firstName) personalFields.push({ label: 'First Name', value: String(data.firstName) })
  if (data.lastName) personalFields.push({ label: 'Last Name', value: String(data.lastName) })
  if (data.dateOfBirth) personalFields.push({ label: 'Date of Birth', value: String(data.dateOfBirth) })
  if (data.gender) personalFields.push({ label: 'Gender', value: String(data.gender) })
  if (data.phone) personalFields.push({ label: 'Phone', value: String(data.phone) })
  if (personalFields.length > 0) sections.push({ title: 'Personal Information', fields: personalFields })

  // Shipping address
  const addressFields: Array<{ label: string; value: string }> = []
  if (data.address1) addressFields.push({ label: 'Address', value: String(data.address1) })
  if (data.address2) addressFields.push({ label: 'Address 2', value: String(data.address2) })
  if (data.city) addressFields.push({ label: 'City', value: String(data.city) })
  if (data.state) addressFields.push({ label: 'State', value: String(data.state) })
  if (data.zipCode) addressFields.push({ label: 'ZIP', value: String(data.zipCode) })
  if (addressFields.length > 0) sections.push({ title: 'Shipping Address', fields: addressFields })

  // Physical measurements
  const physicalFields: Array<{ label: string; value: string }> = []
  if (data.heightFeet || data.heightInches) physicalFields.push({ label: 'Height', value: `${data.heightFeet || 0}'${data.heightInches || 0}"` })
  if (data.weight) physicalFields.push({ label: 'Weight', value: `${data.weight} lbs` })
  if (data.bmi) physicalFields.push({ label: 'BMI', value: String(data.bmi) })
  if (data.bodyFatPercentage) physicalFields.push({ label: 'Body Fat %', value: `${data.bodyFatPercentage}%` })
  if (physicalFields.length > 0) sections.push({ title: 'Physical Measurements', fields: physicalFields })

  // Medications selected
  if (data.medications && Array.isArray(data.medications)) {
    const medFields = (data.medications as Array<{ name?: string; type?: string; duration?: string }>).map((med, i) => ({
      label: `Medication ${i + 1}`,
      value: [med.name, med.type, med.duration].filter(Boolean).join(' — '),
    }))
    if (medFields.length > 0) sections.push({ title: 'Selected Medications', fields: medFields })
  }

  // Goals & wellness
  const wellnessFields: Array<{ label: string; value: string }> = []
  if (data.primaryGoal) wellnessFields.push({ label: 'Primary Goal', value: String(data.primaryGoal) })
  if (data.urgency) wellnessFields.push({ label: 'Urgency', value: `${data.urgency}/10` })
  if (data.whyNow) wellnessFields.push({ label: 'Why Now', value: String(data.whyNow) })
  if (data.topSymptoms && Array.isArray(data.topSymptoms)) wellnessFields.push({ label: 'Top Symptoms', value: (data.topSymptoms as string[]).join(', ') })
  if (data.barriers) wellnessFields.push({ label: 'Barriers', value: String(data.barriers) })
  if (data.previousAttempts) wellnessFields.push({ label: 'Previous Attempts', value: String(data.previousAttempts) })
  if (data.discoverySource) wellnessFields.push({ label: 'Discovery Source', value: String(data.discoverySource) })
  if (wellnessFields.length > 0) sections.push({ title: 'Goals & Wellness', fields: wellnessFields })

  if (sections.length === 0) {
    return <p className="text-sm text-brand-primary/40">No intake data available.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section) => (
        <div key={section.title} className="bg-white border border-stone-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-cultr-textMuted mb-3">
            {section.title}
          </h3>
          <dl className="space-y-2">
            {section.fields.map((field) => (
              <div key={field.label} className="flex justify-between gap-2">
                <dt className="text-xs text-brand-primary/50 shrink-0">{field.label}</dt>
                <dd className="text-sm text-brand-primary text-right">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

export function ProviderPatientDetailClient({ patientId }: { patientId: number }) {
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await fetch(`/api/provider/patients/${patientId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setPatient(data.patient)
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchPatient()
  }, [patientId])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="space-y-6 max-w-4xl animate-pulse">
          <div className="h-6 w-48 bg-stone-100 rounded" />
          <div className="h-4 w-32 bg-stone-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-stone-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl">
          <Link href="/provider/patients" className="flex items-center gap-1 text-sm text-cultr-forest hover:text-forest-light mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </Link>
          <p className="text-brand-primary/40">Patient not found.</p>
        </div>
      </div>
    )
  }

  const { membership, intakes, orders, consultations, labResults } = patient
  const latestIntake = intakes[0]

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <Link href="/provider/patients" className="flex items-center gap-1 text-sm text-cultr-forest hover:text-forest-light mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-primary/60" />
            </div>
            <div>
              {latestIntake?.intake_data && (
                <h1 className="font-display text-xl font-bold text-brand-primary">
                  {String((latestIntake.intake_data as Record<string, unknown>).firstName || '')} {String((latestIntake.intake_data as Record<string, unknown>).lastName || '')}
                </h1>
              )}
              <p className="text-sm text-brand-primary/50">{membership.email}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TIER_BADGE[membership.plan_tier] || 'bg-stone-100 text-stone-600'}`}>
                {membership.plan_tier}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[membership.subscription_status] || 'bg-stone-100 text-stone-600'}`}>
                {membership.subscription_status}
              </span>
            </div>
          </div>
          <p className="text-xs text-brand-primary/40 mt-2">
            Member since {new Date(membership.member_since).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Intake Data */}
        <section>
          <SectionLabel icon={ClipboardList} label="Intake Data" />
          {latestIntake?.intake_data ? (
            <IntakeDataViewer data={latestIntake.intake_data as Record<string, unknown>} />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-primary/40">No intake form submitted.</p>
            </div>
          )}
        </section>

        {/* Order History */}
        <section>
          <SectionLabel icon={Package} label={`Order History (${orders.length})`} />
          {orders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-primary/40">No orders.</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">Order ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden lg:table-cell">Medications</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const meds = order.medication_packages
                    let medDisplay = '—'
                    if (Array.isArray(meds)) {
                      medDisplay = meds.map((m: { name?: string }) => m.name || 'Unknown').join(', ')
                    } else if (meds && typeof meds === 'object') {
                      medDisplay = JSON.stringify(meds).slice(0, 60)
                    }

                    return (
                      <tr key={order.id} className={i % 2 === 0 ? 'bg-stone-50/50' : ''}>
                        <td className="px-4 py-3 text-sm text-brand-primary">
                          {order.asher_order_id || `#${order.id}`}
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-primary/60 capitalize">
                          {order.order_type}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {order.order_status ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_BADGE[order.order_status] || 'bg-stone-100 text-stone-600'}`}>
                              {order.order_status}
                            </span>
                          ) : (
                            <span className="text-xs text-brand-primary/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-primary/60 truncate max-w-[200px] hidden lg:table-cell">
                          {medDisplay}
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-primary/50 hidden sm:table-cell">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Consultation History */}
        <section>
          <SectionLabel icon={Video} label={`Consultations (${consultations.length})`} />
          {consultations.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-primary/40">No consultations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => (
                <div key={c.id}>
                  <Link href={`/provider/consultations/${c.id}`}>
                    <ConsultationCard
                      consultation={c}
                      showPatient={false}
                      showActions={false}
                    />
                  </Link>
                  {(c.note_reason || c.note_outcome || c.note_next_steps) && (
                    <div className="ml-4 mt-1 pl-4 border-l-2 border-brand-primary/10 space-y-1 mb-2">
                      {c.note_reason && (
                        <p className="text-xs text-brand-primary/60"><span className="font-medium">Reason:</span> {c.note_reason}</p>
                      )}
                      {c.note_outcome && (
                        <p className="text-xs text-brand-primary/60"><span className="font-medium">Outcome:</span> {c.note_outcome}</p>
                      )}
                      {c.note_next_steps && (
                        <p className="text-xs text-brand-primary/60"><span className="font-medium">Next Steps:</span> {c.note_next_steps}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Lab Results */}
        <section>
          <SectionLabel icon={TestTube2} label="Lab Results" />
          {labResults ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  {labResults.report_status}
                </span>
                <span className="text-xs text-brand-primary/40">
                  {new Date(labResults.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-brand-primary/60">
                Lab report available. Full biomarker analysis can be viewed in the patient&apos;s member dashboard.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-primary/40">No lab results available.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
