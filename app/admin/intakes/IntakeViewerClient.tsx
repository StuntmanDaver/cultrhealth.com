'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface IntakeRecord {
  id: string
  customer_email: string
  plan_tier: string | null
  intake_status: string
  intake_data: Record<string, unknown> | null
  created_at: string
  completed_at: string | null
  asher_order_id: number | null
  asher_patient_id: number | null
  asher_status: string | null
  partner_note: string | null
  medication_packages: unknown[] | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-800' },
  expired: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-600' },
  failed: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-800' },
}

export default function IntakeViewerClient() {
  const [intakes, setIntakes] = useState<IntakeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchIntakes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/intakes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch intakes')
      setIntakes(data.intakes || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load intakes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntakes()
  }, [fetchIntakes])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Intake Submissions</h1>
              <p className="text-sm text-gray-500">
                {intakes.length} submission{intakes.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
          <button
            onClick={fetchIntakes}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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

        {/* Intakes List */}
        {intakes.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden">
            {intakes.map((intake) => {
              const statusStyle = STATUS_STYLES[intake.intake_status] || STATUS_STYLES.pending
              const isExpanded = expandedId === intake.id
              const intakeData = intake.intake_data || {}

              return (
                <div key={intake.id} className="border-b last:border-b-0">
                  {/* Row */}
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : intake.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        {intake.plan_tier && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                            {intake.plan_tier}
                          </span>
                        )}
                        {intake.asher_order_id && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            Asher #{intake.asher_order_id}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{intake.customer_email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">
                        {new Date(intake.created_at).toLocaleDateString()}
                      </p>
                      {intake.completed_at && (
                        <p className="text-xs text-green-600">
                          Completed {new Date(intake.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-0 bg-gray-50/50">
                      {/* Patient Info from intake_data */}
                      {(intakeData.firstName || intakeData.lastName || intakeData.phone) && (
                        <DetailSection title="Patient Info">
                          <DetailRow label="Name" value={`${intakeData.firstName || ''} ${intakeData.lastName || ''}`.trim()} />
                          <DetailRow label="Phone" value={intakeData.phone as string} />
                          <DetailRow label="DOB" value={intakeData.dateOfBirth as string} />
                          <DetailRow label="Gender" value={intakeData.gender as string} />
                        </DetailSection>
                      )}

                      {/* Physical Measurements */}
                      {(intakeData.heightFeet || intakeData.weightLbs) && (
                        <DetailSection title="Measurements">
                          <DetailRow
                            label="Height"
                            value={intakeData.heightFeet ? `${intakeData.heightFeet}'${intakeData.heightInches || 0}"` : undefined}
                          />
                          <DetailRow label="Weight" value={intakeData.weightLbs ? `${intakeData.weightLbs} lbs` : undefined} />
                        </DetailSection>
                      )}

                      {/* Medications */}
                      {intake.medication_packages && (intake.medication_packages as unknown[]).length > 0 && (
                        <DetailSection title="Selected Medications">
                          <div className="space-y-1">
                            {(intake.medication_packages as { name: string; duration: number; medicationType: string }[]).map((med, i) => (
                              <p key={i} className="text-sm text-gray-700">
                                {med.name} — {med.duration} day, {med.medicationType}
                              </p>
                            ))}
                          </div>
                        </DetailSection>
                      )}

                      {/* Current Medications from intake_data */}
                      {intakeData.currentMedications && Array.isArray(intakeData.currentMedications) && (intakeData.currentMedications as unknown[]).length > 0 && (
                        <DetailSection title="Current Medications">
                          <div className="space-y-1">
                            {(intakeData.currentMedications as Record<string, unknown>[]).map((med, i) => (
                              <p key={i} className="text-sm text-gray-700">
                                {typeof med === 'string'
                                  ? med
                                  : [med.name || med.medication, med.dosage, med.frequency].filter(Boolean).join(' - ')}
                              </p>
                            ))}
                          </div>
                        </DetailSection>
                      )}

                      {/* Treatment Preferences */}
                      {intakeData.treatmentPreferences && (
                        <DetailSection title="Treatment Preferences">
                          {(() => {
                            const prefs = intakeData.treatmentPreferences as Record<string, unknown>
                            return (
                              <>
                                <DetailRow label="Contact Method" value={prefs.preferredContactMethod as string} />
                                <DetailRow label="Best Time" value={prefs.bestTimeToContact as string} />
                                <DetailRow label="Pharmacy" value={prefs.pharmacyPreference as string} />
                                <DetailRow label="Custom Solution" value={prefs.customSolution !== undefined ? (prefs.customSolution ? 'Yes' : 'No') : undefined} />
                                <DetailRow label="Patient Notes" value={prefs.additionalNotes as string} />
                              </>
                            )
                          })()}
                        </DetailSection>
                      )}

                      {/* Goals & Motivation */}
                      {intakeData.goalsMotivation && (
                        <DetailSection title="Goals & Motivation">
                          {(() => {
                            const g = intakeData.goalsMotivation as Record<string, unknown>
                            return (
                              <>
                                <DetailRow label="Primary Goal" value={g.primaryGoal as string} />
                                <DetailRow label="Why Now" value={g.whyNow as string} />
                                <DetailRow label="Top Symptoms" value={Array.isArray(g.topSymptoms) ? (g.topSymptoms as string[]).join(', ') : g.topSymptoms as string} />
                                <DetailRow label="Priority Problem" value={g.priorityProblem as string} />
                                <DetailRow label="Urgency" value={g.urgency ? `${g.urgency}/10` : undefined} />
                                <DetailRow label="Previous Attempts" value={g.previousAttempts as string} />
                                <DetailRow label="Discovery Source" value={g.discoverySource as string} />
                                <DetailRow label="Trust Reason" value={g.trustReason as string} />
                                <DetailRow label="Barriers" value={Array.isArray(g.barriers) ? (g.barriers as string[]).join(', ') : g.barriers as string} />
                              </>
                            )
                          })()}
                        </DetailSection>
                      )}

                      {/* Partner Note */}
                      {intake.partner_note && (
                        <DetailSection title="Partner Note (sent to Asher Med)">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{intake.partner_note}</pre>
                        </DetailSection>
                      )}

                      {/* Asher Med Status */}
                      {intake.asher_order_id && (
                        <DetailSection title="Asher Med">
                          <DetailRow label="Order ID" value={String(intake.asher_order_id)} />
                          <DetailRow label="Patient ID" value={intake.asher_patient_id ? String(intake.asher_patient_id) : undefined} />
                          <DetailRow label="Status" value={intake.asher_status || undefined} />
                        </DetailSection>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border p-4 mb-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <p className="text-sm text-gray-700">
      <span className="font-medium text-gray-500">{label}:</span> {value}
    </p>
  )
}
