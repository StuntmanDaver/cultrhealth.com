'use client'

import { RecommendationResult, TitrationStep } from '@/lib/dosing-engine/types'
import { formatNumber } from '@/lib/peptide-calculator'
import { AlertTriangle, Syringe, Info, Bot } from 'lucide-react'

export function RecommendationCard({ 
  result, 
  explanation, 
  isExplaining 
}: { 
  result: RecommendationResult
  explanation?: string | null
  isExplaining?: boolean 
}) {
  const { eligible, product, schedule, conversionOnlyMath, redFlags, disclaimers, requiresProviderEscalation } = result

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Disclaimers */}
      <div className="space-y-3">
        {disclaimers.map(d => (
          <div key={d.id} className={`p-4 rounded-xl flex gap-3 ${d.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
            {d.type === 'warning' ? <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div>
              <h4 className="font-semibold text-sm mb-1">{d.title}</h4>
              <p className="text-sm">{d.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Explanation */}
      {(explanation || isExplaining) && (
        <div className="bg-cultr-cream border border-cultr-sage rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-5 h-5 text-cultr-forest" />
            <h3 className="font-display font-bold text-lg text-cultr-forest">AI Summary</h3>
          </div>
          {isExplaining ? (
            <div className="flex items-center gap-3 text-cultr-textMuted text-sm">
              <div className="w-4 h-4 border-2 border-cultr-forest/20 border-t-cultr-forest rounded-full animate-spin" />
              Generating personalized explanation...
            </div>
          ) : (
            <div className="prose prose-sm prose-p:text-cultr-text text-cultr-text max-w-none">
              {explanation?.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i}>{paragraph}</p> : null
              ))}
            </div>
          )}
        </div>
      )}

      {/* Red Flags / Escalation */}
      {redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800">
          <div className="flex gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <h3 className="font-display font-bold text-lg">Provider Consultation Required</h3>
          </div>
          <ul className="list-disc list-inside pl-10 space-y-2">
            {redFlags.map((flag, idx) => (
              <li key={idx} className="text-sm font-medium">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Header */}
      <div className="bg-white border border-cultr-sage rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-cultr-forest text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          {product.category.replace('_', ' ').toUpperCase()}
        </div>
        
        <h2 className="font-display font-bold text-2xl text-cultr-forest mb-6">{product.name}</h2>

        {/* Schedule */}
        {eligible && schedule && (
          <div className="space-y-4">
            <h3 className="font-semibold text-cultr-text flex items-center gap-2">
              <Syringe className="w-4 h-4 text-cultr-forest" /> Recommended Titration Schedule
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-cultr-textMuted uppercase bg-cultr-cream/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Month</th>
                    <th className="px-4 py-3">Dose (mg)</th>
                    <th className="px-4 py-3 font-semibold text-cultr-forest">Units (U-100)</th>
                    <th className="px-4 py-3 rounded-tr-lg">Volume (mL)</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.steps.map((step: TitrationStep & { conversion: any }, idx: number) => (
                    <tr key={idx} className="border-b border-cultr-sage/30 last:border-0 hover:bg-cultr-cream/30">
                      <td className="px-4 py-3 font-medium">Month {step.month} ({step.durationWeeks} weeks)</td>
                      <td className="px-4 py-3">{formatNumber(step.doseMg, 2)} mg</td>
                      <td className="px-4 py-3 font-bold text-cultr-forest bg-cultr-forest/5">{formatNumber(step.conversion.drawUnitsU100, 1)} u</td>
                      <td className="px-4 py-3 text-cultr-textMuted">{formatNumber(step.conversion.drawMl, 2)} mL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {schedule.maintenanceDoseMg && schedule.maintenanceConversion && (
              <div className="mt-4 p-4 bg-cultr-forest/5 border border-cultr-forest/20 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-cultr-forest font-semibold uppercase tracking-wider mb-1">Maintenance Dose</div>
                  <div className="font-medium text-cultr-text">{formatNumber(schedule.maintenanceDoseMg, 2)} mg weekly</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-display font-bold text-cultr-forest">{formatNumber(schedule.maintenanceConversion.drawUnitsU100, 1)} units</div>
                  <div className="text-xs text-cultr-textMuted">{formatNumber(schedule.maintenanceConversion.drawMl, 2)} mL</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversion Only Math */}
        {!eligible && conversionOnlyMath && (
          <div className="space-y-4 mt-6 border-t border-cultr-sage pt-6">
            <h3 className="font-semibold text-cultr-text flex items-center gap-2">
              <Syringe className="w-4 h-4 text-cultr-forest" /> Mathematical Conversions
            </h3>
            <p className="text-sm text-cultr-textMuted mb-4">Because this product lacks a standardized FDA-approved human dosing schedule, we provide mathematical conversions for common theoretical doses.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {conversionOnlyMath.examples.map((conv: any, idx: number) => (
                <div key={idx} className="bg-cultr-cream/50 border border-cultr-sage rounded-xl p-4 text-center">
                  <div className="text-xs text-cultr-textMuted mb-1">If dose is {formatNumber(conv.doseMg, 2)} mg</div>
                  <div className="text-2xl font-display font-bold text-cultr-forest">{formatNumber(conv.drawUnitsU100, 1)}<span className="text-base font-normal ml-1">units</span></div>
                  <div className="text-xs text-cultr-textMuted mt-1">({formatNumber(conv.drawMl, 2)} mL)</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
