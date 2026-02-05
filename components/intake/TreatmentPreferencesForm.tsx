'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';

export function TreatmentPreferencesForm() {
  const { formData, updateFormData } = useIntakeForm();

  const updatePreferences = (field: string, value: string) => {
    updateFormData({
      treatmentPreferences: {
        ...formData.treatmentPreferences,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Preferred Contact Method */}
      <div>
        <label className="block text-sm font-medium text-stone-900 mb-3">
          How would you prefer to be contacted? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {[
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone Call' },
            { value: 'text', label: 'Text Message (SMS)' },
          ].map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                ${formData.treatmentPreferences?.preferredContactMethod === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-stone-200 hover:border-stone-300'
                }
              `}
            >
              <input
                type="radio"
                name="contactMethod"
                value={option.value}
                checked={formData.treatmentPreferences?.preferredContactMethod === option.value}
                onChange={() => updatePreferences('preferredContactMethod', option.value)}
                className="w-4 h-4 text-emerald-600 border-stone-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-stone-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Best Time to Contact */}
      <div>
        <label className="block text-sm font-medium text-stone-900 mb-3">
          Best time to contact you?
        </label>
        <div className="space-y-2">
          {[
            { value: 'morning', label: 'Morning (8am - 12pm)' },
            { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
            { value: 'evening', label: 'Evening (5pm - 8pm)' },
            { value: 'anytime', label: 'Anytime' },
          ].map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                ${formData.treatmentPreferences?.bestTimeToContact === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-stone-200 hover:border-stone-300'
                }
              `}
            >
              <input
                type="radio"
                name="bestTime"
                value={option.value}
                checked={formData.treatmentPreferences?.bestTimeToContact === option.value}
                onChange={() => updatePreferences('bestTimeToContact', option.value)}
                className="w-4 h-4 text-emerald-600 border-stone-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-stone-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pharmacy Preference */}
      <div>
        <label htmlFor="pharmacyPreference" className="block text-sm font-medium text-stone-700 mb-1">
          Do you have a preferred pharmacy? (Optional)
        </label>
        <input
          id="pharmacyPreference"
          type="text"
          value={formData.treatmentPreferences?.pharmacyPreference || ''}
          onChange={(e) => updatePreferences('pharmacyPreference', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
          placeholder="e.g., CVS on Main Street, Walgreens #1234"
        />
        <p className="text-xs text-stone-500 mt-1">
          Note: Compounded medications ship directly from our partner pharmacy.
        </p>
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-stone-700 mb-1">
          Anything else you'd like us to know?
        </label>
        <textarea
          id="additionalNotes"
          value={formData.treatmentPreferences?.additionalNotes || ''}
          onChange={(e) => updatePreferences('additionalNotes', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all resize-none"
          placeholder="Share any additional information that might be helpful for your provider..."
        />
      </div>
    </div>
  );
}
