'use client'

import { useState } from 'react'
import { UserIntakeResponse, Sex, Goal, PriorGlp1History } from '@/lib/dosing-engine/types'
import { DOSING_PRODUCTS } from '@/lib/dosing-engine/config/products'
import Button from '@/components/ui/Button'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export function AiDosingQuestionFlow({
  onComplete,
}: {
  onComplete: (data: UserIntakeResponse) => void
}) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<UserIntakeResponse>>({})

  const updateData = (key: keyof UserIntakeResponse, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handleFinish = () => {
    onComplete(data as UserIntakeResponse)
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-cultr-sage shadow-sm">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="font-display font-bold text-xl text-cultr-forest">Intake Questions</h3>
        <span className="text-sm text-cultr-textMuted">Step {step + 1} of 7</span>
      </div>

      {step === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-semibold text-cultr-text">Biological Sex</label>
          <div className="flex gap-4">
            <Button
              variant={data.sex === 'Male' ? 'primary' : 'secondary'}
              onClick={() => { updateData('sex', 'Male'); handleNext(); }}
              className="flex-1"
            >
              Male
            </Button>
            <Button
              variant={data.sex === 'Female' ? 'primary' : 'secondary'}
              onClick={() => { updateData('sex', 'Female'); handleNext(); }}
              className="flex-1"
            >
              Female
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-semibold text-cultr-text">Age, Weight & Height</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs mb-1 text-cultr-textMuted">Age (years)</label>
              <input
                type="number"
                value={data.age || ''}
                onChange={(e) => updateData('age', parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-cultr-sage focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-cultr-textMuted">Weight (lbs)</label>
              <input
                type="number"
                value={data.weightLb || ''}
                onChange={(e) => updateData('weightLb', parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-cultr-sage focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-cultr-textMuted">Height</label>
              <div className="flex gap-2">
                <div className="relative w-1/2">
                  <input
                    type="number"
                    placeholder="ft"
                    value={data.heightInches ? Math.floor(data.heightInches / 12) || '' : ''}
                    onChange={(e) => {
                      const feet = parseInt(e.target.value) || 0;
                      const inches = data.heightInches ? data.heightInches % 12 : 0;
                      if (!feet && !inches) updateData('heightInches', undefined);
                      else updateData('heightInches', feet * 12 + inches);
                    }}
                    className="w-full pl-3 pr-6 py-2 rounded-lg border border-cultr-sage focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none"
                  />
                  <span className="absolute right-2 top-2.5 text-cultr-textMuted text-xs pointer-events-none">ft</span>
                </div>
                <div className="relative w-1/2">
                  <input
                    type="number"
                    placeholder="in"
                    value={data.heightInches ? data.heightInches % 12 || '' : ''}
                    onChange={(e) => {
                      const feet = data.heightInches ? Math.floor(data.heightInches / 12) : 0;
                      const inches = parseInt(e.target.value) || 0;
                      if (!feet && !inches) updateData('heightInches', undefined);
                      else updateData('heightInches', feet * 12 + inches);
                    }}
                    className="w-full pl-3 pr-6 py-2 rounded-lg border border-cultr-sage focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none"
                  />
                  <span className="absolute right-2 top-2.5 text-cultr-textMuted text-xs pointer-events-none">in</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 px-0 text-cultr-textMuted">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!data.age || !data.weightLb || !data.heightInches}
              className="gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-semibold text-cultr-text">Prior GLP-1 History</label>
          <div className="flex flex-col gap-3">
            {['never_used', 'semaglutide', 'tirzepatide', 'retatrutide', 'unknown'].map((option) => (
              <Button
                key={option}
                variant={data.priorGlp1Details === option ? 'primary' : 'secondary'}
                onClick={() => {
                  updateData('priorGlp1Details', option as PriorGlp1History);
                  updateData('priorGlp1History', option !== 'never_used');
                  handleNext();
                }}
                className="w-full justify-start text-left font-normal"
              >
                {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
          <div className="flex justify-start pt-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 px-0 text-cultr-textMuted">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-semibold text-cultr-text">Tolerance / Side Effects (Optional)</label>
          <p className="text-xs text-cultr-textMuted mb-2">Have you experienced severe nausea, allergic reactions, or other significant side effects with these medications?</p>
          <textarea
            value={data.priorToleranceOrSideEffects || ''}
            onChange={(e) => updateData('priorToleranceOrSideEffects', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-cultr-sage focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none min-h-[100px] resize-none"
            placeholder="No previous issues, or describe any severe side effects..."
          />
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 px-0 text-cultr-textMuted">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button variant="primary" onClick={handleNext} className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-semibold text-cultr-text">Primary Goal</label>
          <div className="flex flex-col gap-3">
            {[
              { id: 'weight_loss', label: 'Weight Loss' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'transition', label: 'Transition from another GLP-1' },
              { id: 'informational', label: 'Informational Only' }
            ].map((option) => (
              <Button
                key={option.id}
                variant={data.goal === option.id ? 'primary' : 'secondary'}
                onClick={() => {
                  updateData('goal', option.id as Goal);
                  handleNext();
                }}
                className="w-full justify-start text-left font-normal"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex justify-start pt-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 px-0 text-cultr-textMuted">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-semibold text-cultr-text">Product of Interest</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
            {Object.values(DOSING_PRODUCTS).map((product) => (
              <Button
                key={product.id}
                variant={data.requestedProduct === product.id ? 'primary' : 'secondary'}
                onClick={() => {
                  updateData('requestedProduct', product.id);
                  handleNext();
                }}
                className="justify-start text-left font-semibold h-auto py-3 px-4"
              >
                {product.name}
              </Button>
            ))}
          </div>
          <div className="flex justify-start pt-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 px-0 text-cultr-textMuted">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-6">
          <div className="w-16 h-16 bg-cultr-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-cultr-forest">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h3 className="font-display font-bold text-2xl text-cultr-forest">Ready to Calculate</h3>
          <p className="text-cultr-textMuted text-sm max-w-sm mx-auto">
            We have gathered your intake information. Our deterministic engine will now evaluate the rules for {DOSING_PRODUCTS[data.requestedProduct as string]?.name}.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 text-cultr-textMuted">
              <ArrowLeft className="w-4 h-4" /> Review Answers
            </Button>
            <Button variant="primary" onClick={handleFinish} className="px-8 shadow-md">
              Generate Recommendation
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
