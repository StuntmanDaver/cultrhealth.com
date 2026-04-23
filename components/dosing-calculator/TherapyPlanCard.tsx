'use client'

import { CalendarDays, FlaskConical, Package, Timer } from 'lucide-react'
import {
  frequencyLabel,
  type DosageFrequency,
  type TherapyTotals,
} from '@/lib/peptide-calculator'
import { cn } from '@/lib/utils'

const FREQUENCY_OPTIONS: DosageFrequency[] = [
  'daily',
  'every-other-day',
  'twice-weekly',
  'weekly',
  'biweekly',
]

type Props = {
  frequency: DosageFrequency | null
  therapyLengthWeeks: number | null
  onFrequencyChange: (freq: DosageFrequency) => void
  onLengthChange: (weeks: number | null) => void
  totals: TherapyTotals | null
  hasBasis: boolean // true when core inputs (vial + dose) are valid
}

export function TherapyPlanCard({
  frequency,
  therapyLengthWeeks,
  onFrequencyChange,
  onLengthChange,
  totals,
  hasBasis,
}: Props) {
  const estRefillDate = (() => {
    if (!totals || totals.refillInDays <= 0) return null
    const d = new Date()
    d.setDate(d.getDate() + totals.refillInDays)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  })()

  return (
    <div className="grad-light border border-cultr-sage rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-cultr-forest" aria-hidden="true" />
        <div>
          <h3 className="font-display font-bold text-cultr-text">Therapy cycle planner</h3>
          <p className="text-xs text-cultr-textMuted">Plan total peptide, vials, and refill cadence for a full cycle.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tcp-frequency"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cultr-textMuted"
          >
            Frequency
          </label>
          <select
            id="tcp-frequency"
            value={frequency ?? ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') return
              onFrequencyChange(val as DosageFrequency)
            }}
            className="w-full rounded-lg border border-cultr-sage bg-white px-4 py-3 text-cultr-text outline-none transition-all focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50"
          >
            <option value="" disabled>
              Select frequency
            </option>
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {frequencyLabel(f)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tcp-length"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cultr-textMuted"
          >
            Therapy length (weeks)
          </label>
          <input
            id="tcp-length"
            type="number"
            inputMode="numeric"
            min={1}
            max={52}
            value={therapyLengthWeeks ?? ''}
            placeholder="12"
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                onLengthChange(null)
                return
              }
              const n = parseInt(val, 10)
              if (Number.isFinite(n)) onLengthChange(Math.max(1, Math.min(52, n)))
            }}
            className="w-full rounded-lg border border-cultr-sage bg-white px-4 py-3 text-cultr-text outline-none transition-all focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50"
          />
        </div>
      </div>

      <div className={cn('grid gap-3 sm:grid-cols-2', !totals && 'opacity-50')}>
        <PlanTile
          icon={<FlaskConical className="h-4 w-4 text-cultr-forest" aria-hidden="true" />}
          label="Total peptide needed"
          value={totals ? `${totals.totalMg.toFixed(1)} mg` : '—'}
        />
        <PlanTile
          icon={<Package className="h-4 w-4 text-cultr-forest" aria-hidden="true" />}
          label="Total vials needed"
          value={totals ? String(totals.totalVials) : '—'}
        />
        <PlanTile
          icon={<Timer className="h-4 w-4 text-cultr-forest" aria-hidden="true" />}
          label="Days per vial"
          value={totals ? String(totals.daysPerVial) : '—'}
        />
        <PlanTile
          icon={<CalendarDays className="h-4 w-4 text-cultr-forest" aria-hidden="true" />}
          label="Est. refill date"
          value={estRefillDate ?? '—'}
        />
      </div>

      {!hasBasis && (
        <p className="rounded-lg bg-cultr-mint/60 border border-cultr-sage px-4 py-3 text-xs text-cultr-text">
          Enter vial size and dose above to see totals.
        </p>
      )}
    </div>
  )
}

function PlanTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-cultr-sage/60 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-cultr-textMuted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-display text-xl font-bold text-cultr-forest">{value}</p>
    </div>
  )
}
