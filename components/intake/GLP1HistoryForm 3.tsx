'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Info } from 'lucide-react';

export function GLP1HistoryForm() {
  const { formData, updateFormData } = useIntakeForm();

  const updateGLP1Data = (field: string, value: string) => {
    updateFormData({
      glp1History: {
        ...formData.glp1History,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">Previous GLP-1 use affects your starting dose. Accurate history means better results.</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-purple-800">
          Since you selected a GLP-1 medication, we need some additional information about your history with these medications.
        </p>
      </div>

      {/* Previous GLP-1 Use */}
      <div>
        <label className="block text-sm font-medium text-stone-900 mb-3">
          Have you used GLP-1 medications before? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {['No, this is my first time', 'Yes, within the last 6 months', 'Yes, more than 6 months ago'].map((option) => (
            <label
              key={option}
              className={`
                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                ${formData.glp1History?.previousGlp1Use === option
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-stone-200 hover:border-stone-300'
                }
              `}
            >
              <input
                type="radio"
                name="previousGlp1Use"
                value={option}
                checked={formData.glp1History?.previousGlp1Use === option}
                onChange={() => updateGLP1Data('previousGlp1Use', option)}
                className="w-4 h-4 text-purple-600 border-stone-300 focus:ring-purple-500"
              />
              <span className="text-sm text-stone-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Conditional questions for previous users */}
      {formData.glp1History?.previousGlp1Use?.includes('Yes') && (
        <>
          {/* Previous Medication */}
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-3">
              Which GLP-1 medication(s) have you used? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Ozempic (semaglutide)', 'Wegovy (semaglutide)', 'Mounjaro (tirzepatide)', 'Zepbound (tirzepatide)', 'Saxenda (liraglutide)', 'Compounded semaglutide', 'Compounded tirzepatide', 'Other'].map((option) => (
                <label
                  key={option}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${formData.glp1History?.previousMedication === option
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-stone-200 hover:border-stone-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="previousMedication"
                    value={option}
                    checked={formData.glp1History?.previousMedication === option}
                    onChange={() => updateGLP1Data('previousMedication', option)}
                    className="w-4 h-4 text-purple-600 border-stone-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-stone-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Last Dosage */}
          <div>
            <label htmlFor="previousDosage" className="block text-sm font-medium text-stone-700 mb-1">
              What was your most recent dosage?
            </label>
            <input
              id="previousDosage"
              type="text"
              value={formData.glp1History?.previousDosage || ''}
              onChange={(e) => updateGLP1Data('previousDosage', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
              placeholder="e.g., 2.5mg weekly"
            />
          </div>

          {/* Last Injection Date */}
          <div>
            <label htmlFor="lastInjectionDate" className="block text-sm font-medium text-stone-700 mb-1">
              When was your last injection/dose?
            </label>
            <input
              id="lastInjectionDate"
              type="date"
              value={formData.glp1History?.lastInjectionDate || ''}
              onChange={(e) => updateGLP1Data('lastInjectionDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            />
          </div>

          {/* Side Effects */}
          <div>
            <label htmlFor="sideEffects" className="block text-sm font-medium text-stone-700 mb-1">
              Did you experience any side effects?
            </label>
            <textarea
              id="sideEffects"
              value={formData.glp1History?.sideEffects || ''}
              onChange={(e) => updateGLP1Data('sideEffects', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all resize-none"
              placeholder="Describe any side effects you experienced (nausea, constipation, etc.) or type 'None'"
            />
          </div>

          {/* Reason for Switching */}
          <div>
            <label htmlFor="reasonForSwitching" className="block text-sm font-medium text-stone-700 mb-1">
              Why are you switching or restarting?
            </label>
            <textarea
              id="reasonForSwitching"
              value={formData.glp1History?.reasonForSwitching || ''}
              onChange={(e) => updateGLP1Data('reasonForSwitching', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all resize-none"
              placeholder="e.g., Cost, availability, want to try different medication, etc."
            />
          </div>
        </>
      )}
    </div>
  );
}
