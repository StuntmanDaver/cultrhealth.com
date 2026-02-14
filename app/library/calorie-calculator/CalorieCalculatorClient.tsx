'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { marked } from 'marked'
import {
  ArrowLeft,
  AlertTriangle,
  Beef,
  Wheat,
  Droplets as FatIcon,
  Target,
  Activity,
  Calculator,
  User,
  Ruler,
  Scale,
  Info,
  Sparkles,
  Loader2,
  ChefHat,
  RefreshCw,
  X,
  Download,
  Copy,
  Check,
  FileText,
} from 'lucide-react'
import {
  calculate,
  lbsToKg,
  ftInToCm,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  BMR_FORMULAS,
  MACRO_SPLITS,
  type Sex,
  type UnitSystem,
  type ActivityLevel,
  type Goal,
  type BmrFormula,
  type MacroSplit,
} from '@/lib/calorie-calculator'

// --- Reusable sub-components ---

function SegmentToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-cultr-mint rounded-full p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-cultr-forest text-white shadow-sm'
              : 'text-cultr-text hover:text-cultr-forestLight'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function OptionCard<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; description: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
            value === opt.value
              ? 'bg-cultr-forest text-white border-cultr-forest'
              : 'bg-white border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
          }`}
        >
          <span className="font-medium text-sm">{opt.label}</span>
          <span className={`block text-xs mt-0.5 ${value === opt.value ? 'text-white/70' : 'text-cultr-textMuted'}`}>
            {opt.description}
          </span>
        </button>
      ))}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  min,
  max,
  step,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-cultr-textMuted mb-1">{label}</label>}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-full px-4 py-3 rounded-lg border border-cultr-sage bg-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all pr-12"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-cultr-textMuted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

// --- Macro donut chart ---

function MacroDonut({
  protein,
  carbs,
  fat,
}: {
  protein: number
  carbs: number
  fat: number
}) {
  const total = protein + carbs + fat
  if (total === 0) return null

  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const pPct = protein / total
  const cPct = carbs / total
  const fPct = fat / total

  const pLen = circumference * pPct
  const cLen = circumference * cPct
  const fLen = circumference * fPct

  const pOffset = 0
  const cOffset = -pLen
  const fOffset = -(pLen + cLen)

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Protein - sage green */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A4542"
          strokeWidth={strokeWidth}
          strokeDasharray={`${pLen} ${circumference - pLen}`}
          strokeDashoffset={pOffset}
          className="transition-all duration-500"
        />
        {/* Carbs - sage */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#B7E4C7"
          strokeWidth={strokeWidth}
          strokeDasharray={`${cLen} ${circumference - cLen}`}
          strokeDashoffset={cOffset}
          className="transition-all duration-500"
        />
        {/* Fat - forest light */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3A5956"
          strokeWidth={strokeWidth}
          strokeDasharray={`${fLen} ${circumference - fLen}`}
          strokeDashoffset={fOffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-display font-bold text-cultr-text">{total}</span>
        <span className="text-xs text-cultr-textMuted">kcal</span>
      </div>
    </div>
  )
}

// --- Meal Plan Modal ---

function MealPlanModal({
  isOpen,
  onClose,
  mealPlan,
  isGenerating,
  onRegenerate,
  macros,
}: {
  isOpen: boolean
  onClose: () => void
  mealPlan: string
  isGenerating: boolean
  onRegenerate: () => void
  macros: { calories: number; protein: number; carbs: number; fat: number } | null
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Parse markdown to HTML
  const htmlContent = useMemo(() => {
    if (!mealPlan) return ''
    return marked.parse(mealPlan, { async: false }) as string
  }, [mealPlan])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Copy to clipboard (for Google Docs)
  const handleCopy = async () => {
    try {
      // Copy both plain text and HTML for rich paste
      const plainText = mealPlan
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Export to PDF using print
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CULTR Health - Your Personalized Meal Plan</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.7;
              color: #1a1a1a;
              padding: 40px 60px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2A4542;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2A4542;
              letter-spacing: 2px;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
            }
            .date {
              color: #888;
              font-size: 12px;
              margin-top: 8px;
            }
            .macros-summary {
              background: linear-gradient(135deg, #f8faf9 0%, #e8f5e9 100%);
              border-radius: 12px;
              padding: 20px 24px;
              margin-bottom: 32px;
              display: flex;
              justify-content: space-around;
              border: 1px solid #B7E4C7;
            }
            .macro-item {
              text-align: center;
            }
            .macro-value {
              font-size: 24px;
              font-weight: bold;
              color: #2A4542;
            }
            .macro-label {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 {
              color: #2A4542;
              font-size: 20px;
              margin-top: 28px;
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 1px solid #ddd;
            }
            h3 {
              color: #2A4542;
              font-size: 16px;
              margin-top: 20px;
              margin-bottom: 8px;
            }
            p {
              margin-bottom: 12px;
              color: #333;
            }
            ul, ol {
              margin: 12px 0 12px 24px;
            }
            li {
              margin-bottom: 6px;
            }
            strong {
              color: #2A4542;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #888;
              font-size: 11px;
            }
            @media print {
              body { padding: 20px 40px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CULTR HEALTH</div>
            <div class="subtitle">Your Personalized Meal Plan</div>
            <div class="date">Generated on ${today}</div>
          </div>
          ${macros ? `
            <div class="macros-summary">
              <div class="macro-item">
                <div class="macro-value">${macros.calories.toLocaleString()}</div>
                <div class="macro-label">Calories</div>
              </div>
              <div class="macro-item">
                <div class="macro-value">${macros.protein}g</div>
                <div class="macro-label">Protein</div>
              </div>
              <div class="macro-item">
                <div class="macro-value">${macros.carbs}g</div>
                <div class="macro-label">Carbs</div>
              </div>
              <div class="macro-item">
                <div class="macro-value">${macros.fat}g</div>
                <div class="macro-label">Fat</div>
              </div>
            </div>
          ` : ''}
          <div class="content">
            ${htmlContent}
          </div>
          <div class="footer">
            <p>This meal plan is AI-generated based on your nutritional targets.</p>
            <p>Always consult your CULTR Health provider for personalized nutrition advice.</p>
            <p style="margin-top: 12px;">© ${new Date().getFullYear()} CULTR Health — cultrhealth.com</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cultr-forest to-cultr-forestLight px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg sm:text-xl truncate">Your Personalized Meal Plan</h2>
              <p className="text-white/70 text-sm">AI-generated based on your macro targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Macro Summary Bar */}
        {macros && (
          <div className="bg-cultr-mint/50 border-b border-cultr-sage px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-2 sm:flex sm:items-center sm:justify-around gap-3 sm:gap-0 shrink-0">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-cultr-forest">{macros.calories.toLocaleString()}</div>
              <div className="text-xs text-cultr-textMuted uppercase tracking-wide">Calories</div>
            </div>
            <div className="w-px h-10 bg-cultr-sage hidden sm:block" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-cultr-forest">{macros.protein}g</div>
              <div className="text-xs text-cultr-textMuted uppercase tracking-wide">Protein</div>
            </div>
            <div className="w-px h-10 bg-cultr-sage hidden sm:block" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-cultr-forest">{macros.carbs}g</div>
              <div className="text-xs text-cultr-textMuted uppercase tracking-wide">Carbs</div>
            </div>
            <div className="w-px h-10 bg-cultr-sage hidden sm:block" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-cultr-forest">{macros.fat}g</div>
              <div className="text-xs text-cultr-textMuted uppercase tracking-wide">Fat</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6" ref={contentRef}>
          {isGenerating && !mealPlan ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-cultr-forest animate-spin mb-4" />
              <p className="text-cultr-text font-medium text-lg">Crafting your personalized meal plan...</p>
              <p className="text-cultr-textMuted text-sm mt-1">This usually takes a few seconds</p>
            </div>
          ) : (
            <div
              className="prose prose-sm sm:prose-base prose-stone max-w-none
                prose-h2:text-xl prose-h2:font-display prose-h2:font-bold prose-h2:text-cultr-forest prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-cultr-sage/50
                prose-h3:text-lg prose-h3:font-display prose-h3:font-semibold prose-h3:text-cultr-forestLight prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-cultr-text prose-p:leading-relaxed
                prose-ul:my-3 prose-li:text-cultr-text prose-li:my-1
                prose-strong:text-cultr-forest prose-strong:font-semibold
                [&_h2:first-child]:mt-0
              "
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
          {isGenerating && mealPlan && (
            <div className="flex items-center gap-2 mt-6 text-cultr-textMuted border-t border-cultr-sage/30 pt-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Still generating...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-cultr-sage bg-cultr-offwhite px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cultr-sage rounded-xl text-cultr-text text-sm font-medium hover:border-cultr-forest/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <div className="flex-1" />

          <button
            onClick={handleCopy}
            disabled={!mealPlan || isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cultr-sage rounded-xl text-cultr-text text-sm font-medium hover:border-cultr-forest/50 transition-colors disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy for Google Docs</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!mealPlan || isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-cultr-forest text-white rounded-xl text-sm font-medium hover:bg-cultr-forestLight transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main component ---

export function CalorieCalculatorClient({ email }: { email: string }) {
  // Body inputs
  const [sex, setSex] = useState<Sex>('male')
  const [units, setUnits] = useState<UnitSystem>('imperial')
  const [age, setAge] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [bodyFatPct, setBodyFatPct] = useState('')

  // Calc inputs
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<Goal>('maintain')
  const [formula, setFormula] = useState<BmrFormula>('mifflin')
  const [macroSplit, setMacroSplit] = useState<MacroSplit>('balanced')

  // Derived values
  const ageNum = parseInt(age) || 0
  const wKg = units === 'imperial' ? lbsToKg(parseFloat(weightLbs) || 0) : (parseFloat(weightKg) || 0)
  const hCm = units === 'imperial' ? ftInToCm(parseInt(heightFt) || 0, parseInt(heightIn) || 0) : (parseFloat(heightCm) || 0)
  const bfPct = parseFloat(bodyFatPct) || undefined

  const hasInput = ageNum > 0 && wKg > 0 && hCm > 0

  const result = useMemo(() => {
    if (!hasInput) return null
    return calculate({
      sex,
      age: ageNum,
      weightKg: wKg,
      heightCm: hCm,
      activityLevel,
      goal,
      formula,
      bodyFatPct: bfPct,
      macroSplit,
    })
  }, [sex, ageNum, wKg, hCm, activityLevel, goal, formula, bfPct, macroSplit, hasInput])

  // Meal plan generation - using direct fetch for better control
  const [mealPlan, setMealPlan] = useState('')
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false)
  const [mealPlanError, setMealPlanError] = useState<Error | null>(null)
  const [showMealPlanModal, setShowMealPlanModal] = useState(false)

  const handleGenerateMealPlan = async () => {
    if (!result) return
    
    setIsGeneratingMealPlan(true)
    setMealPlanError(null)
    setMealPlan('')
    setShowMealPlanModal(true) // Open modal immediately
    
    try {
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calories: result.targetCalories,
          protein: result.protein.grams,
          carbs: result.carbs.grams,
          fat: result.fat.grams,
          goal,
          bmr: result.bmr,
          tdee: result.tdee,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      // Read the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }
      
      const decoder = new TextDecoder()
      let fullText = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMealPlan(fullText)
      }
    } catch (err) {
      console.error('Meal plan generation error:', err)
      setMealPlanError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsGeneratingMealPlan(false)
    }
  }

  const handleRegenerateMealPlan = () => {
    setMealPlan('')
    handleGenerateMealPlan()
  }

  // Get current macros for modal
  const currentMacros = result ? {
    calories: result.targetCalories,
    protein: result.protein.grams,
    carbs: result.carbs.grams,
    fat: result.fat.grams,
  } : null

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 bg-cultr-forest text-white">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Calorie & Macro Calculator</h1>
              <p className="text-white/70">Advanced nutritional planning with multiple BMR formulas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Inputs — 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* Sex + Units */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-cultr-forest" />
                    <h3 className="font-display font-bold text-cultr-text text-sm">Sex</h3>
                  </div>
                  <SegmentToggle<Sex>
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                    value={sex}
                    onChange={setSex}
                  />
                </div>
                <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="w-4 h-4 text-cultr-forest" />
                    <h3 className="font-display font-bold text-cultr-text text-sm">Units</h3>
                  </div>
                  <SegmentToggle<UnitSystem>
                    options={[
                      { value: 'imperial', label: 'Imperial' },
                      { value: 'metric', label: 'Metric' },
                    ]}
                    value={units}
                    onChange={setUnits}
                  />
                </div>
              </div>

              {/* Body Measurements */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Body Measurements</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <InputField
                    label="Age"
                    value={age}
                    onChange={setAge}
                    placeholder="25"
                    suffix="yrs"
                    min={15}
                    max={100}
                  />
                  {units === 'imperial' ? (
                    <InputField
                      label="Weight"
                      value={weightLbs}
                      onChange={setWeightLbs}
                      placeholder="180"
                      suffix="lbs"
                      min={60}
                      max={660}
                    />
                  ) : (
                    <InputField
                      label="Weight"
                      value={weightKg}
                      onChange={setWeightKg}
                      placeholder="82"
                      suffix="kg"
                      min={30}
                      max={300}
                    />
                  )}
                  {units === 'imperial' ? (
                    <>
                      <InputField
                        label="Height (feet)"
                        value={heightFt}
                        onChange={setHeightFt}
                        placeholder="5"
                        suffix="ft"
                        min={3}
                        max={8}
                      />
                      <InputField
                        label="Height (inches)"
                        value={heightIn}
                        onChange={setHeightIn}
                        placeholder="10"
                        suffix="in"
                        min={0}
                        max={11}
                      />
                    </>
                  ) : (
                    <InputField
                      label="Height"
                      value={heightCm}
                      onChange={setHeightCm}
                      placeholder="178"
                      suffix="cm"
                      min={120}
                      max={230}
                    />
                  )}
                  <InputField
                    label="Body Fat % (optional)"
                    value={bodyFatPct}
                    onChange={setBodyFatPct}
                    placeholder="15"
                    suffix="%"
                    min={3}
                    max={55}
                    step={0.5}
                  />
                </div>
                <p className="mt-3 text-xs text-cultr-textMuted">
                  Enter your body stats for accurate BMR calculation
                </p>
              </div>

              {/* Activity Level */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Activity Level</h3>
                </div>
                <OptionCard<ActivityLevel>
                  options={Object.entries(ACTIVITY_MULTIPLIERS).map(([key, val]) => ({
                    value: key as ActivityLevel,
                    label: val.label,
                    description: val.description,
                  }))}
                  value={activityLevel}
                  onChange={setActivityLevel}
                />
              </div>

              {/* Goal */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Goal</h3>
                </div>
                <OptionCard<Goal>
                  options={Object.entries(GOAL_ADJUSTMENTS).map(([key, val]) => ({
                    value: key as Goal,
                    label: val.label,
                    description: val.description,
                  }))}
                  value={goal}
                  onChange={setGoal}
                />
              </div>

              {/* BMR Formula */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">BMR Formula</h3>
                </div>
                <OptionCard<BmrFormula>
                  options={Object.entries(BMR_FORMULAS).map(([key, val]) => ({
                    value: key as BmrFormula,
                    label: val.label,
                    description: val.description,
                  }))}
                  value={formula}
                  onChange={setFormula}
                />
              </div>

              {/* Macro Split */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Beef className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Macro Split</h3>
                </div>
                <OptionCard<MacroSplit>
                  options={Object.entries(MACRO_SPLITS).map(([key, val]) => ({
                    value: key as MacroSplit,
                    label: val.label,
                    description: val.description,
                  }))}
                  value={macroSplit}
                  onChange={setMacroSplit}
                />
              </div>
            </div>

            {/* Results — 2 columns, sticky (top-24 accounts for header height) */}
            <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit space-y-6">
              {/* Calorie Summary */}
              <div className="bg-cultr-forest text-white rounded-2xl p-8">
                <h3 className="font-display font-bold text-lg mb-6 text-white/80">Daily Target</h3>
                {result ? (
                  <div className="space-y-6">
                    {/* Target Calories */}
                    <div className="text-center">
                      <div className="text-5xl font-display font-bold">
                        {result.targetCalories.toLocaleString()}
                      </div>
                      <div className="text-white/70 text-lg mt-1">kcal / day</div>
                    </div>

                    {/* BMR & TDEE */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-xl font-display font-bold">{result.bmr.toLocaleString()}</div>
                        <div className="text-xs text-white/60 mt-1">BMR</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-xl font-display font-bold">{result.tdee.toLocaleString()}</div>
                        <div className="text-xs text-white/60 mt-1">TDEE</div>
                      </div>
                    </div>

                    <div className="text-xs text-white/50 text-center">
                      Formula: {BMR_FORMULAS[result.formulaUsed].label}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-display font-bold text-white/40">—</div>
                    <p className="text-white/50 mt-4">Enter your details to calculate</p>
                  </div>
                )}
              </div>

              {/* Macro Breakdown */}
              {result && (
                <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6 space-y-5">
                  <h4 className="font-display font-bold text-cultr-text">Macro Breakdown</h4>

                  <MacroDonut
                    protein={result.protein.calories}
                    carbs={result.carbs.calories}
                    fat={result.fat.calories}
                  />

                  {/* Macro bars */}
                  <div className="space-y-4">
                    {/* Protein */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Beef className="w-4 h-4 text-cultr-forest" />
                          <span className="text-sm font-medium text-cultr-text">Protein</span>
                        </div>
                        <span className="text-sm font-bold text-cultr-text">{result.protein.grams}g</span>
                      </div>
                      <div className="w-full bg-cultr-sage/40 rounded-full h-2">
                        <div
                          className="bg-cultr-forest h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.protein.pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-cultr-textMuted">{result.protein.calories} kcal</span>
                        <span className="text-xs text-cultr-textMuted">{result.protein.pct}%</span>
                      </div>
                    </div>

                    {/* Carbs */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Wheat className="w-4 h-4 text-cultr-sage" />
                          <span className="text-sm font-medium text-cultr-text">Carbs</span>
                        </div>
                        <span className="text-sm font-bold text-cultr-text">{result.carbs.grams}g</span>
                      </div>
                      <div className="w-full bg-cultr-sage/40 rounded-full h-2">
                        <div
                          className="bg-cultr-sage h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.carbs.pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-cultr-textMuted">{result.carbs.calories} kcal</span>
                        <span className="text-xs text-cultr-textMuted">{result.carbs.pct}%</span>
                      </div>
                    </div>

                    {/* Fat */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <FatIcon className="w-4 h-4 text-cultr-forestLight" />
                          <span className="text-sm font-medium text-cultr-text">Fat</span>
                        </div>
                        <span className="text-sm font-bold text-cultr-text">{result.fat.grams}g</span>
                      </div>
                      <div className="w-full bg-cultr-sage/40 rounded-full h-2">
                        <div
                          className="bg-cultr-forestLight h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.fat.pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-cultr-textMuted">{result.fat.calories} kcal</span>
                        <span className="text-xs text-cultr-textMuted">{result.fat.pct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result && result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      {result.warnings.map((warning, idx) => (
                        <p key={idx} className="text-amber-800 text-sm">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Formula Breakdown */}
              {result && (
                <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-cultr-forestLight" />
                    <h4 className="font-display font-bold text-cultr-text text-sm">How it works</h4>
                  </div>
                  <div className="space-y-2 text-xs text-cultr-textMuted leading-relaxed">
                    <p><strong className="text-cultr-text">BMR</strong> = {result.bmr.toLocaleString()} kcal (basal metabolic rate at rest)</p>
                    <p><strong className="text-cultr-text">TDEE</strong> = {result.bmr.toLocaleString()} x {ACTIVITY_MULTIPLIERS[activityLevel].factor} = {result.tdee.toLocaleString()} kcal</p>
                    <p><strong className="text-cultr-text">Target</strong> = {result.tdee.toLocaleString()} {GOAL_ADJUSTMENTS[goal].calorieDelta >= 0 ? '+' : ''} {GOAL_ADJUSTMENTS[goal].calorieDelta} = {result.targetCalories.toLocaleString()} kcal</p>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-cultr-mint border border-cultr-sage rounded-2xl p-5">
                <p className="text-xs text-cultr-textMuted leading-relaxed">
                  <strong className="text-cultr-text">Disclaimer:</strong> This calculator provides estimates
                  based on established formulas. Individual needs vary based on genetics, body composition,
                  medical conditions, and medications. Always consult your CULTR Health provider before making
                  significant dietary changes.
                </p>
              </div>

              {/* Generate Meal Plan Button */}
              {result && (
                <button
                  onClick={mealPlan ? () => setShowMealPlanModal(true) : handleGenerateMealPlan}
                  disabled={isGeneratingMealPlan}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cultr-forest to-cultr-forestLight text-white rounded-2xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-cultr-forest/20 disabled:opacity-70"
                >
                  {isGeneratingMealPlan ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Meal Plan...
                    </>
                  ) : mealPlan ? (
                    <>
                      <ChefHat className="w-5 h-5" />
                      View Your Meal Plan
                      <FileText className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate AI Meal Plan
                      <ChefHat className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}

              {/* Meal Plan Error */}
              {mealPlanError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 text-sm font-medium">Failed to generate meal plan</p>
                      <p className="text-red-600 text-xs mt-1">{mealPlanError.message}</p>
                      <button
                        onClick={handleGenerateMealPlan}
                        className="mt-2 text-sm text-red-700 underline hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Meal Plan Modal */}
      <MealPlanModal
        isOpen={showMealPlanModal}
        onClose={() => setShowMealPlanModal(false)}
        mealPlan={mealPlan}
        isGenerating={isGeneratingMealPlan}
        onRegenerate={handleRegenerateMealPlan}
        macros={currentMacros}
      />
    </div>
  )
}
