'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { useEffect, useState } from 'react';

export function PhysicalMeasurementsForm() {
  const { formData, updateFormData } = useIntakeForm();
  const [bmi, setBmi] = useState<number | null>(null);

  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (formData.heightFeet && formData.heightInches !== undefined && formData.weightLbs) {
      const totalInches = formData.heightFeet * 12 + formData.heightInches;
      const calculatedBmi = (formData.weightLbs / (totalInches * totalInches)) * 703;
      setBmi(Math.round(calculatedBmi * 10) / 10);
    } else {
      setBmi(null);
    }
  }, [formData.heightFeet, formData.heightInches, formData.weightLbs]);

  const getBmiCategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-forest-light' };
    if (bmi < 25) return { label: 'Normal', color: 'text-forest' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-forest-light' };
    if (bmi < 35) return { label: 'Obese Class I', color: 'text-forest-muted' };
    if (bmi < 40) return { label: 'Obese Class II', color: 'text-forest-muted' };
    return { label: 'Obese Class III', color: 'text-forest-muted' };
  };

  return (
    <div className="space-y-6">
      {/* Height */}
      <div>
        <label className="block text-sm font-medium text-forest mb-1">
          Height <span className="text-forest-muted">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <input
                type="number"
                min="3"
                max="8"
                value={formData.heightFeet || ''}
                onChange={(e) => updateFormData({ heightFeet: parseInt(e.target.value, 10) || undefined })}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
                placeholder="5"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-muted text-sm">
                ft
              </span>
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="11"
                value={formData.heightInches ?? ''}
                onChange={(e) => updateFormData({ heightInches: parseInt(e.target.value, 10) })}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
                placeholder="10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-muted text-sm">
                in
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-forest mb-1">
          Current Weight <span className="text-forest-muted">*</span>
        </label>
        <div className="relative">
          <input
            id="weight"
            type="number"
            min="50"
            max="800"
            value={formData.weightLbs || ''}
            onChange={(e) => updateFormData({ weightLbs: parseFloat(e.target.value) || undefined })}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
            placeholder="180"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-muted text-sm">
            lbs
          </span>
        </div>
      </div>

      {/* BMI Display */}
      {bmi !== null && (
        <div className="bg-mint/30 rounded-xl p-4 border border-forest-light/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-forest-muted">Your BMI</p>
              <p className="text-2xl font-bold text-forest">{bmi}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-forest-muted">Category</p>
              <p className={`font-semibold ${getBmiCategory(bmi).color}`}>
                {getBmiCategory(bmi).label}
              </p>
            </div>
          </div>
          <div className="mt-3 h-3 bg-cream-dark rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                bmi < 25 ? 'bg-forest' : bmi < 30 ? 'bg-sage' : 'bg-forest-light'
              }`}
              style={{ width: `${Math.min((bmi / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Goal Weight (Optional) */}
      <div>
        <label htmlFor="goalWeight" className="block text-sm font-medium text-forest mb-1">
          Goal Weight (optional)
        </label>
        <div className="relative">
          <input
            id="goalWeight"
            type="number"
            min="50"
            max="500"
            value={formData.goalWeightLbs || ''}
            onChange={(e) => updateFormData({ goalWeightLbs: parseFloat(e.target.value) || undefined })}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
            placeholder="160"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-muted text-sm">
            lbs
          </span>
        </div>
        <p className="text-xs text-forest-muted mt-1">
          This helps your provider understand your weight management goals.
        </p>
      </div>
    </div>
  );
}
