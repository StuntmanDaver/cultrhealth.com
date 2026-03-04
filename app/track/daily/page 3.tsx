'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sun, 
  Moon, 
  Heart, 
  Brain, 
  Zap, 
  Activity,
  Pill,
  Syringe,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Loader2
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface DailyLogData {
  log_date: string
  energy_level?: number
  mood_rating?: number
  sleep_quality?: number
  sleep_hours?: number
  stress_level?: number
  weight_kg?: number
  resting_hr?: number
  hrv_ms?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  protocol_adherence_pct?: number
  supplements_taken?: string[]
  peptides_administered?: string[]
  notes?: string
  symptoms_reported?: string[]
}

// =============================================================================
// RATING SLIDER COMPONENT
// =============================================================================

function RatingSlider({ 
  label, 
  value, 
  onChange, 
  icon: Icon,
  lowLabel = 'Low',
  highLabel = 'High',
  color = 'blue'
}: { 
  label: string
  value: number | undefined
  onChange: (value: number) => void
  icon: typeof Sun
  lowLabel?: string
  highLabel?: string
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 text-${color}-500`} />
        <span className="font-medium text-gray-900">{label}</span>
        {value !== undefined && (
          <span className={`ml-auto px-2 py-0.5 rounded-full text-sm font-semibold ${colorClasses[color]} text-white`}>
            {value}
          </span>
        )}
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value || 5}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

// =============================================================================
// NUMBER INPUT COMPONENT
// =============================================================================

function NumberInput({
  label,
  value,
  onChange,
  unit,
  icon: Icon,
  min,
  max,
  step = 1,
  placeholder
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  unit: string
  icon: typeof Heart
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-sm text-gray-500 w-12">{unit}</span>
      </div>
    </div>
  )
}

// =============================================================================
// SUPPLEMENT TRACKER
// =============================================================================

const COMMON_SUPPLEMENTS = [
  'Vitamin D3', 'Magnesium', 'Omega-3', 'B-Complex', 'Vitamin C',
  'NAC', 'CoQ10', 'Zinc', 'Curcumin', 'Berberine', 'NMN', 'Creatine'
]

const COMMON_PEPTIDES = [
  'BPC-157', 'TB-500', 'Semax', 'Selank', 'DSIP', 'Epitalon',
  'Thymosin Alpha-1', 'GHK-Cu', 'MOTS-c', 'SS-31'
]

function ItemTracker({
  label,
  items,
  selectedItems,
  onToggle,
  icon: Icon
}: {
  label: string
  items: string[]
  selectedItems: string[]
  onToggle: (item: string) => void
  icon: typeof Pill
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="font-medium text-gray-900">{label}</span>
        <span className="ml-auto text-sm text-gray-500">
          {selectedItems.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selectedItems.includes(item)
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelected && <CheckCircle className="w-3.5 h-3.5 inline mr-1" />}
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// SYMPTOM TRACKER
// =============================================================================

const COMMON_SYMPTOMS = [
  'Fatigue', 'Brain fog', 'Headache', 'Joint pain', 'Muscle soreness',
  'Poor sleep', 'Anxiety', 'Low mood', 'Digestive issues', 'Skin issues'
]

function SymptomTracker({
  symptoms,
  onToggle
}: {
  symptoms: string[]
  onToggle: (symptom: string) => void
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-gray-500" />
        <span className="font-medium text-gray-900">Symptoms Today</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {COMMON_SYMPTOMS.map((symptom) => {
          const isSelected = symptoms.includes(symptom)
          return (
            <button
              key={symptom}
              onClick={() => onToggle(symptom)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {symptom}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function DailyTrackingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Date management
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  
  // Form state
  const [formData, setFormData] = useState<DailyLogData>({
    log_date: selectedDate,
    supplements_taken: [],
    peptides_administered: [],
    symptoms_reported: [],
  })

  // Update log_date when selectedDate changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, log_date: selectedDate }))
  }, [selectedDate])

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + (direction === 'prev' ? -1 : 1))
    
    // Don't allow future dates
    if (date > new Date()) return
    
    setSelectedDate(date.toISOString().split('T')[0])
  }

  // Toggle helpers
  const toggleSupplement = (item: string) => {
    setFormData(prev => ({
      ...prev,
      supplements_taken: prev.supplements_taken?.includes(item)
        ? prev.supplements_taken.filter(s => s !== item)
        : [...(prev.supplements_taken || []), item]
    }))
  }

  const togglePeptide = (item: string) => {
    setFormData(prev => ({
      ...prev,
      peptides_administered: prev.peptides_administered?.includes(item)
        ? prev.peptides_administered.filter(s => s !== item)
        : [...(prev.peptides_administered || []), item]
    }))
  }

  const toggleSymptom = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms_reported: prev.symptoms_reported?.includes(symptom)
        ? prev.symptoms_reported.filter(s => s !== symptom)
        : [...(prev.symptoms_reported || []), symptom]
    }))
  }

  // Submit handler
  const handleSubmit = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch('/api/track/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save')
      }
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving daily log:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today'
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Date selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                disabled={isToday}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                saveSuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveSuccess ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Subjective Ratings Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RatingSlider
              label="Energy Level"
              value={formData.energy_level}
              onChange={(v) => setFormData(prev => ({ ...prev, energy_level: v }))}
              icon={Zap}
              lowLabel="Exhausted"
              highLabel="Energized"
              color="amber"
            />
            <RatingSlider
              label="Mood"
              value={formData.mood_rating}
              onChange={(v) => setFormData(prev => ({ ...prev, mood_rating: v }))}
              icon={Brain}
              lowLabel="Low"
              highLabel="Great"
              color="purple"
            />
            <RatingSlider
              label="Sleep Quality"
              value={formData.sleep_quality}
              onChange={(v) => setFormData(prev => ({ ...prev, sleep_quality: v }))}
              icon={Moon}
              lowLabel="Poor"
              highLabel="Excellent"
              color="blue"
            />
            <RatingSlider
              label="Stress Level"
              value={formData.stress_level}
              onChange={(v) => setFormData(prev => ({ ...prev, stress_level: v }))}
              icon={Activity}
              lowLabel="Calm"
              highLabel="Stressed"
              color="red"
            />
          </div>
        </section>

        {/* Objective Metrics Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Objective Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumberInput
              label="Sleep"
              value={formData.sleep_hours}
              onChange={(v) => setFormData(prev => ({ ...prev, sleep_hours: v }))}
              unit="hrs"
              icon={Moon}
              min={0}
              max={24}
              step={0.5}
              placeholder="7.5"
            />
            <NumberInput
              label="Weight"
              value={formData.weight_kg}
              onChange={(v) => setFormData(prev => ({ ...prev, weight_kg: v }))}
              unit="kg"
              icon={Activity}
              min={30}
              max={300}
              step={0.1}
              placeholder="75"
            />
            <NumberInput
              label="Resting HR"
              value={formData.resting_hr}
              onChange={(v) => setFormData(prev => ({ ...prev, resting_hr: v }))}
              unit="bpm"
              icon={Heart}
              min={30}
              max={200}
              placeholder="60"
            />
            <NumberInput
              label="HRV"
              value={formData.hrv_ms}
              onChange={(v) => setFormData(prev => ({ ...prev, hrv_ms: v }))}
              unit="ms"
              icon={Activity}
              min={0}
              max={300}
              placeholder="45"
            />
          </div>
        </section>

        {/* Protocol Adherence */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Protocol Adherence</h2>
          <RatingSlider
            label="Protocol Adherence"
            value={formData.protocol_adherence_pct ? formData.protocol_adherence_pct / 10 : undefined}
            onChange={(v) => setFormData(prev => ({ ...prev, protocol_adherence_pct: v * 10 }))}
            icon={CheckCircle}
            lowLabel="0%"
            highLabel="100%"
            color="green"
          />
        </section>

        {/* Supplements Taken */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What did you take today?</h2>
          <div className="space-y-4">
            <ItemTracker
              label="Supplements"
              items={COMMON_SUPPLEMENTS}
              selectedItems={formData.supplements_taken || []}
              onToggle={toggleSupplement}
              icon={Pill}
            />
            <ItemTracker
              label="Peptides"
              items={COMMON_PEPTIDES}
              selectedItems={formData.peptides_administered || []}
              onToggle={togglePeptide}
              icon={Syringe}
            />
          </div>
        </section>

        {/* Symptoms */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Any symptoms?</h2>
          <SymptomTracker
            symptoms={formData.symptoms_reported || []}
            onToggle={toggleSymptom}
          />
        </section>

        {/* Notes */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="How did your day go? Any observations about your protocol?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </section>

        {/* Submit Button (Mobile) */}
        <div className="pb-6">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-colors ${
              saveSuccess 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saveSuccess ? 'Saved Successfully!' : 'Save Daily Log'}
          </button>
        </div>
      </main>
    </div>
  )
}
