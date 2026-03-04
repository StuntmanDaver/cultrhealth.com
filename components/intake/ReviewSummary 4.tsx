'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { MEDICATION_OPTIONS } from '@/lib/config/asher-med';
import { CheckCircle2, AlertCircle, Loader2, Edit2 } from 'lucide-react';

interface ReviewSummaryProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function ReviewSummary({ onSubmit, isSubmitting, error }: ReviewSummaryProps) {
  const { formData, setCurrentStep } = useIntakeForm();

  const selectedMedication = MEDICATION_OPTIONS.find((m) => m.id === formData.selectedMedication);

  const calculateBMI = () => {
    if (formData.heightFeet && formData.heightInches !== undefined && formData.weightLbs) {
      const totalInches = formData.heightFeet * 12 + formData.heightInches;
      return ((formData.weightLbs / (totalInches * totalInches)) * 703).toFixed(1);
    }
    return null;
  };

  const sections = [
    {
      title: 'Personal Information',
      stepIndex: 0,
      items: [
        { label: 'Name', value: `${formData.firstName} ${formData.lastName}` },
        { label: 'Email', value: formData.email },
        { label: 'Phone', value: formData.phone },
        { label: 'Date of Birth', value: formData.dateOfBirth },
        { label: 'Gender', value: formData.gender },
      ],
    },
    {
      title: 'Shipping Address',
      stepIndex: 1,
      items: [
        {
          label: 'Address',
          value: formData.shippingAddress
            ? `${formData.shippingAddress.address1}${formData.shippingAddress.address2 ? `, ${formData.shippingAddress.address2}` : ''}, ${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.zipCode}`
            : '',
        },
      ],
    },
    {
      title: 'Medication Selection',
      stepIndex: 2,
      items: [{ label: 'Selected', value: selectedMedication?.name || 'None selected' }],
    },
    {
      title: 'Physical Measurements',
      stepIndex: 3,
      items: [
        { label: 'Height', value: `${formData.heightFeet}'${formData.heightInches}"` },
        { label: 'Weight', value: `${formData.weightLbs} lbs` },
        { label: 'BMI', value: calculateBMI() || 'N/A' },
        { label: 'Goal Weight', value: formData.goalWeightLbs ? `${formData.goalWeightLbs} lbs` : 'Not specified' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          Please review your information below. Click "Edit" next to any section to make changes.
        </p>
      </div>

      {/* Review Sections */}
      {sections.map((section) => (
        <div key={section.title} className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-stone-50 border-b border-stone-200">
            <h3 className="font-medium text-stone-900">{section.title}</h3>
            <button
              onClick={() => setCurrentStep(section.stepIndex)}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <div className="p-4 space-y-2">
            {section.items.map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-stone-500">{item.label}</span>
                <span className="text-stone-900 font-medium">{item.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Documents Status */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200">
          <h3 className="font-medium text-stone-900">Documents & Consent</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Government ID</span>
            {formData.idDocumentKey ? (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Uploaded
              </span>
            ) : (
              <span className="text-sm text-red-500">Missing</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Telehealth Consent</span>
            {formData.telehealthSignatureKey ? (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Signed
              </span>
            ) : (
              <span className="text-sm text-red-500">Missing</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Compounded Medication Consent</span>
            {formData.compoundedConsentKey ? (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Signed
              </span>
            ) : (
              <span className="text-sm text-red-500">Missing</span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Submission Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting || !formData.idDocumentKey || !formData.telehealthSignatureKey || !formData.compoundedConsentKey}
        className={`
          w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-lg transition-all
          ${isSubmitting || !formData.idDocumentKey || !formData.telehealthSignatureKey || !formData.compoundedConsentKey
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
          }
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Intake Form'
        )}
      </button>

      <p className="text-xs text-center text-stone-500">
        By submitting, you confirm that all information provided is accurate and complete.
        Your information will be reviewed by a licensed healthcare provider.
      </p>
    </div>
  );
}
