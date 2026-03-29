'use client'

import { useState } from 'react'

interface ProviderNotesFormProps {
  consultationId: number
  existingNotes?: {
    reason?: string | null
    outcome?: string | null
    next_steps?: string | null
    internal_notes?: string | null
  }
  onSaved?: () => void
}

export function ProviderNotesForm({ consultationId, existingNotes, onSaved }: ProviderNotesFormProps) {
  const [reason, setReason] = useState(existingNotes?.reason || '')
  const [outcome, setOutcome] = useState(existingNotes?.outcome || '')
  const [nextSteps, setNextSteps] = useState(existingNotes?.next_steps || '')
  const [internalNotes, setInternalNotes] = useState(existingNotes?.internal_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/consultations/${consultationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, outcome, nextSteps, internalNotes }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setSaved(true)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">Reason for Visit</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Patient's reason for this consultation..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">Outcome</label>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="What was discussed, decided, or prescribed..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">Next Steps</label>
        <textarea
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Follow-up actions for the patient..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">
          Internal Notes <span className="text-brand-primary/40">(not visible to patient)</span>
        </label>
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Private notes for the care team..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Notes saved successfully.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </button>
    </form>
  )
}
