'use client'

import { useState } from 'react'
import { UserIntakeResponse, RecommendationResult } from '@/lib/dosing-engine/types'
import { ENABLE_AI_DOSING_LLM } from '@/lib/dosing-engine/config/featureFlags'
import { AiDosingQuestionFlow } from './AiDosingQuestionFlow'
import { RecommendationCard } from './RecommendationCard'
import { Sparkles, RefreshCcw } from 'lucide-react'
import Button from '@/components/ui/Button'

export function AiDosingEnginePanel({ apiEndpoint }: { apiEndpoint: string }) {
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleIntakeComplete = async (data: UserIntakeResponse) => {
    setIsLoading(true)
    setError(null)
    setExplanation(null)
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      if (errorData?.details) {
        const errorMessages = errorData.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        throw new Error(`Validation failed - ${errorMessages}`)
      }
      throw new Error(errorData?.error || 'Failed to generate recommendation. Please try again.')
      }

      const recommendationData = await response.json()
      setResult(recommendationData)

      // Fire off explanation request if enabled
      if (ENABLE_AI_DOSING_LLM) {
        setIsExplaining(true)
        const explainEndpoint = apiEndpoint.replace('/recommendation', '/explain')
        fetch(explainEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendation: recommendationData, intake: data }),
        })
          .then(res => res.json())
          .then(explainData => {
            if (explainData.explanation) setExplanation(explainData.explanation)
          })
          .catch(err => console.error('Explain fetch failed', err))
          .finally(() => setIsExplaining(false))
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const resetFlow = () => {
    setResult(null)
    setError(null)
    setExplanation(null)
  }

  return (
    <section className="py-12 px-6 bg-cultr-cream/30">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Panel Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-cultr-sage pb-6">
          <div className="w-10 h-10 rounded-xl bg-cultr-forest text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-cultr-forest">AI Recommended Dosing Engine</h2>
            <p className="text-sm text-cultr-textMuted">Guided, rule-based dosing recommendations and conversions.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
              <div className="w-12 h-12 border-4 border-cultr-forest/20 border-t-cultr-forest rounded-full animate-spin mb-4" />
              <p className="text-cultr-forest font-semibold animate-pulse">Running deterministic rules engine...</p>
            </div>
          )}

          {!result && (
            <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
              <AiDosingQuestionFlow onComplete={handleIntakeComplete} />
            </div>
          )}

          {result && !isLoading && (
            <div>
              <RecommendationCard result={result} explanation={explanation} isExplaining={isExplaining} />
              
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={resetFlow} className="gap-2">
                  <RefreshCcw className="w-4 h-4" /> Start Over
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
