'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Syringe, Droplets, FlaskConical, Calculator } from 'lucide-react'
import { calcPeptide, formatNumber, type DoseUnit } from '@/lib/peptide-calculator'

const VIAL_OPTIONS = [5, 10, 15, 50, 100] as const
const WATER_OPTIONS = [1, 2, 3, 5] as const
const SYRINGE_OPTIONS = [0.3, 0.5, 1.0] as const
const DOSE_PRESETS_MCG = [100, 250, 500, 1000] as const

type PillButtonProps = {
  options: readonly number[]
  value: number | 'custom'
  onChange: (value: number | 'custom') => void
  unit?: string
}

// Syringe visualization component with accurate tick marks
function SyringeVisual({ 
  syringeMl, 
  fillMl,
  fillUnits 
}: { 
  syringeMl: number
  fillMl: number
  fillUnits: number
}) {
  const maxUnits = syringeMl * 100
  const fillPercent = Math.min((fillMl / syringeMl) * 100, 100)
  const isOverflow = fillMl > syringeMl
  
  // Generate all tick marks based on syringe size
  const getTickConfig = () => {
    if (syringeMl === 0.3) {
      // 0.3 mL (30 units): minor every 1u, medium every 5u, major every 10u
      return { minor: 1, medium: 5, major: 10, labelEvery: 10 }
    } else if (syringeMl === 0.5) {
      // 0.5 mL (50 units): minor every 1u, medium every 5u, major every 10u
      return { minor: 1, medium: 5, major: 10, labelEvery: 10 }
    } else {
      // 1.0 mL (100 units): minor every 2u, medium every 10u, major every 20u
      return { minor: 2, medium: 10, major: 20, labelEvery: 20 }
    }
  }
  
  const config = getTickConfig()
  
  // Generate array of all tick values
  const allTicks: number[] = []
  for (let i = 0; i <= maxUnits; i += config.minor) {
    allTicks.push(i)
  }
  
  const barrelTop = 25
  const barrelHeight = 220
  const barrelWidth = 44
  const svgWidth = 130
  const svgHeight = 300
  const barrelX = 50

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* Syringe barrel outline */}
        <rect
          x={barrelX}
          y={barrelTop}
          width={barrelWidth}
          height={barrelHeight}
          rx={4}
          fill="#f8faf9"
          stroke="white"
          strokeWidth={2}
        />
        
        {/* Fill level */}
        <rect
          x={barrelX + 2}
          y={barrelTop + barrelHeight - (barrelHeight - 4) * (fillPercent / 100)}
          width={barrelWidth - 4}
          height={(barrelHeight - 4) * (fillPercent / 100)}
          rx={2}
          fill={isOverflow ? '#FCA5A5' : '#B7E4C7'}
          className="transition-all duration-300"
        />
        
        {/* Tick marks and labels */}
        {allTicks.map((tick) => {
          const yPos = barrelTop + barrelHeight - (barrelHeight * (tick / maxUnits))
          const isMajor = tick % config.major === 0
          const isMedium = !isMajor && tick % config.medium === 0
          const showLabel = tick % config.labelEvery === 0
          
          // Determine tick length
          let tickLength = 5  // minor
          if (isMedium) tickLength = 10
          if (isMajor) tickLength = 14
          
          return (
            <g key={tick}>
              {/* Left side tick */}
              <line
                x1={barrelX - tickLength}
                y1={yPos}
                x2={barrelX}
                y2={yPos}
                stroke={isMajor ? 'white' : 'rgba(255,255,255,0.7)'}
                strokeWidth={isMajor ? 2.5 : isMedium ? 1.5 : 1}
              />
              {/* Label */}
              {showLabel && (
                <text
                  x={barrelX - tickLength - 5}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[12px] font-bold"
                  fill="white"
                >
                  {tick}
                </text>
              )}
            </g>
          )
        })}
        
        {/* Current fill indicator arrow and label on right side */}
        {fillPercent > 0 && fillPercent <= 100 && (
          <g>
            <polygon
              points={`${barrelX + barrelWidth + 4},${barrelTop + barrelHeight - (barrelHeight) * (fillPercent / 100)} ${barrelX + barrelWidth + 14},${barrelTop + barrelHeight - (barrelHeight) * (fillPercent / 100) - 6} ${barrelX + barrelWidth + 14},${barrelTop + barrelHeight - (barrelHeight) * (fillPercent / 100) + 6}`}
              fill="#B7E4C7"
            />
            <text
              x={barrelX + barrelWidth + 18}
              y={barrelTop + barrelHeight - (barrelHeight) * (fillPercent / 100) + 5}
              className="text-[13px] font-bold"
              fill="white"
            >
              {fillUnits.toFixed(1)}u
            </text>
          </g>
        )}
        
        {/* Needle hub */}
        <rect
          x={barrelX + barrelWidth/2 - 8}
          y={barrelTop + barrelHeight}
          width={16}
          height={12}
          fill="#d1d5db"
        />
        
        {/* Needle */}
        <rect
          x={barrelX + barrelWidth/2 - 1.5}
          y={barrelTop + barrelHeight + 12}
          width={3}
          height={30}
          fill="#e5e7eb"
        />
        <polygon
          points={`${barrelX + barrelWidth/2},${barrelTop + barrelHeight + 50} ${barrelX + barrelWidth/2 - 1.5},${barrelTop + barrelHeight + 42} ${barrelX + barrelWidth/2 + 1.5},${barrelTop + barrelHeight + 42}`}
          fill="#e5e7eb"
        />
        
        {/* Plunger */}
        <rect
          x={barrelX + 4}
          y={8}
          width={barrelWidth - 8}
          height={barrelTop - 6}
          rx={2}
          fill="#e5e7eb"
          stroke="white"
          strokeWidth={1}
        />
        {/* Plunger handle */}
        <rect
          x={barrelX + barrelWidth/2 - 6}
          y={0}
          width={12}
          height={12}
          rx={2}
          fill="#d1d5db"
        />
      </svg>
      
      {/* Syringe label */}
      <div className="text-center -mt-2">
        <p className="text-sm font-semibold text-white">{syringeMl} mL Syringe</p>
        <p className="text-xs text-white/70">{maxUnits} units capacity</p>
      </div>
      
      {/* Fill amount badge */}
      {fillUnits > 0 && (
        <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold ${
          isOverflow 
            ? 'bg-red-400/90 text-white border border-red-300' 
            : 'bg-white/90 text-cultr-forest border border-white'
        }`}>
          {isOverflow ? 'Exceeds capacity!' : `Draw to ${fillUnits.toFixed(1)} units`}
        </div>
      )}
    </div>
  )
}

function PillButtonGroup({
  options,
  value,
  onChange,
  unit = '',
}: PillButtonProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            value === option
              ? 'bg-cultr-forest text-white'
              : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
          }`}
        >
          {option}{unit}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange('custom')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          value === 'custom'
            ? 'bg-cultr-forest text-white'
            : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
        }`}
      >
        Other
      </button>
    </div>
  )
}

export function DosingCalculatorClient({ email }: { email: string }) {
  // Input states
  const [vialSelection, setVialSelection] = useState<number | 'custom'>(5)
  const [customVial, setCustomVial] = useState('')
  const [waterSelection, setWaterSelection] = useState<number | 'custom'>(2)
  const [customWater, setCustomWater] = useState('')
  const [doseSelection, setDoseSelection] = useState<number | 'custom'>(250)
  const [customDose, setCustomDose] = useState('')
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg')
  const [syringeSelection, setSyringeSelection] = useState<number | 'custom'>(1.0)
  const [customSyringe, setCustomSyringe] = useState('')

  // Derive actual values from selections
  const vialMg = vialSelection === 'custom' ? parseFloat(customVial) || 0 : vialSelection
  const waterMl = waterSelection === 'custom' ? parseFloat(customWater) || 0 : waterSelection
  const dose = doseSelection === 'custom' ? parseFloat(customDose) || 0 : doseSelection
  const syringeMl = syringeSelection === 'custom' ? parseFloat(customSyringe) || 0 : syringeSelection

  // Calculate results
  const result = useMemo(() => {
    return calcPeptide({
      vialMg,
      waterMl,
      dose,
      doseUnit,
      syringeMl: syringeMl > 0 ? syringeMl : undefined,
    })
  }, [vialMg, waterMl, dose, doseUnit, syringeMl])

  const hasValidResult = !isNaN(result.drawUnitsU100) && result.warnings.filter(w => !w.includes('Syringe')).length === 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-12 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-display font-bold">Cultr Calculator</h1>
              <p className="text-white/70">Peptide reconstitution & dosing calculator</p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Content */}
      <section className="py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs Panel */}
            <div className="space-y-8">
              {/* Vial Amount */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FlaskConical className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Vial Amount</h3>
                </div>
                <PillButtonGroup
                  options={VIAL_OPTIONS}
                  value={vialSelection}
                  onChange={setVialSelection}
                  unit=" mg"
                />
                {vialSelection === 'custom' && (
                  <div className="mt-3">
                    <input
                      type="number"
                      placeholder="Enter mg"
                      value={customVial}
                      onChange={(e) => setCustomVial(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-cultr-sage bg-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all"
                    />
                  </div>
                )}
                <p className="mt-3 text-xs text-cultr-textMuted">
                  Total peptide content in your vial
                </p>
              </div>

              {/* Diluent (Water) */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Droplets className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Bacteriostatic Water</h3>
                </div>
                <PillButtonGroup
                  options={WATER_OPTIONS}
                  value={waterSelection}
                  onChange={setWaterSelection}
                  unit=" mL"
                />
                {waterSelection === 'custom' && (
                  <div className="mt-3">
                    <input
                      type="number"
                      placeholder="Enter mL"
                      value={customWater}
                      onChange={(e) => setCustomWater(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-3 rounded-lg border border-cultr-sage bg-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all"
                    />
                  </div>
                )}
                <p className="mt-3 text-xs text-cultr-textMuted">
                  Amount of diluent added to reconstitute
                </p>
              </div>

              {/* Desired Dose */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Syringe className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Desired Dose</h3>
                </div>
                
                {/* Unit Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDoseUnit('mcg')
                      setDoseSelection(250)
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      doseUnit === 'mcg'
                        ? 'bg-cultr-forest text-white'
                        : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
                    }`}
                  >
                    mcg
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDoseUnit('mg')
                      setDoseSelection('custom')
                      setCustomDose('0.25')
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      doseUnit === 'mg'
                        ? 'bg-cultr-forest text-white'
                        : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
                    }`}
                  >
                    mg
                  </button>
                </div>

                {doseUnit === 'mcg' ? (
                  <>
                    <PillButtonGroup
                      options={DOSE_PRESETS_MCG}
                      value={doseSelection}
                      onChange={setDoseSelection}
                      unit=" mcg"
                    />
                    {doseSelection === 'custom' && (
                      <div className="mt-3">
                        <input
                          type="number"
                          placeholder="Enter mcg"
                          value={customDose}
                          onChange={(e) => setCustomDose(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-cultr-sage bg-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <input
                      type="number"
                      placeholder="Enter mg"
                      value={customDose}
                      onChange={(e) => setCustomDose(e.target.value)}
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg border border-cultr-sage bg-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Dose conversion display */}
                {hasValidResult && (
                  <p className="mt-3 text-sm text-cultr-forest font-medium">
                    = {formatNumber(result.doseMcg, 0)} mcg = {formatNumber(result.doseMg, 3)} mg
                  </p>
                )}
              </div>

              {/* Syringe Size */}
              <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Syringe className="w-5 h-5 text-cultr-forest" />
                  <h3 className="font-display font-bold text-cultr-text">Syringe Size (Optional)</h3>
                </div>
                <PillButtonGroup
                  options={SYRINGE_OPTIONS}
                  value={syringeSelection}
                  onChange={setSyringeSelection}
                  unit=" mL"
                />
                {syringeSelection === 'custom' && (
                  <div className="mt-3">
                    <input
                      type="number"
                      placeholder="Enter mL"
                      value={customSyringe}
                      onChange={(e) => setCustomSyringe(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-3 rounded-lg border border-cultr-sage bg-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all"
                    />
                  </div>
                )}
                <p className="mt-3 text-xs text-cultr-textMuted">
                  For capacity warnings (U-100 insulin syringe)
                </p>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:sticky lg:top-6 h-fit space-y-6">
              {/* Main Result with Syringe Visual */}
              <div className="bg-cultr-forest text-white rounded-2xl p-8">
                <h3 className="font-display font-bold text-lg mb-6 text-white/80">Draw Amount</h3>
                
                {hasValidResult ? (
                  <div className="flex items-center gap-6">
                    {/* Syringe Visual */}
                    {syringeMl > 0 && (
                      <div className="flex-shrink-0 bg-white/10 rounded-xl p-4">
                        <SyringeVisual 
                          syringeMl={syringeMl} 
                          fillMl={result.drawMl}
                          fillUnits={result.drawUnitsU100}
                        />
                      </div>
                    )}
                    
                    {/* Numbers */}
                    <div className={`flex-1 space-y-6 ${syringeMl > 0 ? '' : 'text-center'}`}>
                      {/* Primary: Units */}
                      <div className={syringeMl > 0 ? '' : 'text-center'}>
                        <div className="text-5xl font-display font-bold mb-1">
                          {formatNumber(result.drawUnitsU100, 1)}
                        </div>
                        <div className="text-white/70 text-lg">units</div>
                      </div>

                      {/* Secondary: mL */}
                      <div className={`pt-4 border-t border-white/20 ${syringeMl > 0 ? '' : 'text-center'}`}>
                        <div className="text-2xl font-display font-bold">
                          {formatNumber(result.drawMl, 3)} mL
                        </div>
                        <div className="text-white/60 text-sm">volume to draw</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-display font-bold text-white/40">—</div>
                    <p className="text-white/50 mt-4">Enter valid values to calculate</p>
                  </div>
                )}
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
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

              {/* Additional Stats */}
              {hasValidResult && (
                <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6 space-y-4">
                  <h4 className="font-display font-bold text-cultr-text">Reconstitution Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-cultr-sage/50">
                      <div className="text-2xl font-display font-bold text-cultr-forest">
                        {formatNumber(result.concentrationMgPerMl, 2)}
                      </div>
                      <div className="text-xs text-cultr-textMuted">mg/mL concentration</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-cultr-sage/50">
                      <div className="text-2xl font-display font-bold text-cultr-forest">
                        {formatNumber(result.dosesPerVial, 0)}
                      </div>
                      <div className="text-xs text-cultr-textMuted">doses per vial</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-cultr-sage/50">
                    <p className="text-xs text-cultr-textMuted">
                      <strong>Formula:</strong> {vialMg} mg ÷ {waterMl} mL = {formatNumber(result.concentrationMgPerMl, 2)} mg/mL
                      <br />
                      {formatNumber(result.doseMg, 3)} mg ÷ {formatNumber(result.concentrationMgPerMl, 2)} mg/mL = {formatNumber(result.drawMl, 3)} mL = {formatNumber(result.drawUnitsU100, 1)} units
                    </p>
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-cultr-mint border border-cultr-sage rounded-2xl p-5">
                <p className="text-xs text-cultr-textMuted leading-relaxed">
                  <strong className="text-cultr-text">Note:</strong> This calculator uses the U-100 insulin syringe scale 
                  where 100 units = 1 mL. Always verify calculations with your healthcare provider before administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
