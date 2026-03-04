'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Info } from 'lucide-react';

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
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">Tell us how you want to be reached. We respect your preferences.</p>
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label className="block text-sm font-medium text-forest mb-3">
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
                  ? 'border-forest bg-mint'
                  : 'border-forest-light/20 hover:border-forest-light/30'
                }
              `}
            >
              <input
                type="radio"
                name="contactMethod"
                value={option.value}
                checked={formData.treatmentPreferences?.preferredContactMethod === option.value}
                onChange={() => updatePreferences('preferredContactMethod', option.value)}
                className="w-4 h-4 text-forest border-forest-light/30 focus:ring-mint"
              />
              <span className="text-sm text-forest">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Best Time to Contact */}
      <div>
        <label className="block text-sm font-medium text-forest mb-3">
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
                  ? 'border-forest bg-mint'
                  : 'border-forest-light/20 hover:border-forest-light/30'
                }
              `}
            >
              <input
                type="radio"
                name="bestTime"
                value={option.value}
                checked={formData.treatmentPreferences?.bestTimeToContact === option.value}
                onChange={() => updatePreferences('bestTimeToContact', option.value)}
                className="w-4 h-4 text-forest border-forest-light/30 focus:ring-mint"
              />
              <span className="text-sm text-forest">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pharmacy Preference */}
      <div>
        <label htmlFor="pharmacyPreference" className="block text-sm font-medium text-forest mb-1">
          Do you have a preferred pharmacy? (Optional)
        </label>
        <input
          id="pharmacyPreference"
          type="text"
          value={formData.treatmentPreferences?.pharmacyPreference || ''}
          onChange={(e) => updatePreferences('pharmacyPreference', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
          placeholder="e.g., CVS on Main Street, Walgreens #1234"
        />
        <p className="text-xs text-forest-muted mt-1">
          Note: Compounded medications ship directly from our partner pharmacy.
        </p>
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-forest mb-1">
          Anything else you'd like us to know?
        </label>
        <textarea
          id="additionalNotes"
          value={formData.treatmentPreferences?.additionalNotes || ''}
          onChange={(e) => updatePreferences('additionalNotes', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all resize-none"
          placeholder="Share any additional information that might be helpful for your provider..."
        />
      </div>
    </div>
  );
}
