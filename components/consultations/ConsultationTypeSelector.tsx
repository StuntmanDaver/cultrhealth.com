'use client'

import { CONSULTATION_TYPES, type ConsultationType } from '@/lib/config/consultations'

interface ConsultationTypeSelectorProps {
  selected: ConsultationType
  onChange: (type: ConsultationType) => void
}

export function ConsultationTypeSelector({ selected, onChange }: ConsultationTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(CONSULTATION_TYPES) as [ConsultationType, typeof CONSULTATION_TYPES[ConsultationType]][]).map(
        ([key, config]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selected === key
                ? 'bg-brand-primary text-white'
                : 'bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10'
            }`}
          >
            {config.label} ({config.duration} min)
          </button>
        )
      )}
    </div>
  )
}
