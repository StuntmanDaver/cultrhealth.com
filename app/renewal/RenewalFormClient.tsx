'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { MEDICATION_OPTIONS, US_STATES } from '@/lib/config/asher-med';

interface PatientInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

type RenewalStep = 'verify' | 'medication' | 'wellness' | 'consent' | 'review';

const RENEWAL_STEPS: { id: RenewalStep; title: string }[] = [
  { id: 'verify', title: 'Verify Info' },
  { id: 'medication', title: 'Medication' },
  { id: 'wellness', title: 'Wellness Check' },
  { id: 'consent', title: 'Consent' },
  { id: 'review', title: 'Review' },
];

export function RenewalFormClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Renewal form data
  const [formData, setFormData] = useState({
    selectedMedication: '',
    weightLbs: '',
    shippingAddress: {
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
    },
    wellnessQuestionnaire: {} as Record<string, string>,
    telehealthSignatureKey: '',
  });

  // Check eligibility by phone number
  const checkEligibility = async () => {
    if (!phoneNumber.replace(/\D/g, '').match(/^\d{10,11}$/)) {
      setCheckError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsChecking(true);
    setCheckError(null);

    try {
      const response = await fetch('/api/renewal/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check eligibility');
      }

      if (!result.eligible) {
        setCheckError(result.reason || 'You are not eligible for renewal at this time.');
        return;
      }

      setPatient(result.patient);

      // Pre-fill shipping address
      if (result.patient.shippingAddress) {
        setFormData((prev) => ({
          ...prev,
          shippingAddress: result.patient.shippingAddress,
        }));
      }

      setCurrentStep(1);
    } catch (error) {
      console.error('Check eligibility error:', error);
      setCheckError(error instanceof Error ? error.message : 'Failed to check eligibility');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!patient) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/renewal/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          email: patient.email,
          selectedMedication: formData.selectedMedication,
          shippingAddress: formData.shippingAddress,
          weightLbs: formData.weightLbs ? parseFloat(formData.weightLbs) : undefined,
          wellnessQuestionnaire: formData.wellnessQuestionnaire,
          telehealthSignatureKey: formData.telehealthSignatureKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit renewal');
      }

      router.push('/renewal/success');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = RENEWAL_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="font-display font-bold text-xl text-stone-900">
                  Request Renewal
                </h1>
                <p className="text-sm text-stone-500">
                  {patient ? `Welcome back, ${patient.firstName}!` : 'Continue your treatment'}
                </p>
              </div>
            </div>
            {patient && (
              <div className="text-sm text-stone-500">
                Step {currentStep + 1} of {RENEWAL_STEPS.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      {patient && (
        <div className="bg-white border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex gap-2">
              {RENEWAL_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`
                    flex-1 h-2 rounded-full transition-all
                    ${index <= currentStep ? 'bg-purple-500' : 'bg-stone-200'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8">
          {/* Step 0: Phone Verification */}
          {currentStep === 0 && !patient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
                  Verify Your Account
                </h2>
                <p className="text-stone-600">
                  Enter the phone number associated with your account to continue.
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {checkError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{checkError}</p>
                </div>
              )}

              <button
                onClick={checkEligibility}
                disabled={isChecking}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-all"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-stone-500">
                Don't have an account?{' '}
                <a href="/pricing" className="text-purple-600 hover:underline">
                  Start here
                </a>
              </p>
            </div>
          )}

          {/* Step 1: Medication Selection */}
          {currentStep === 1 && patient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
                  Select Your Medication
                </h2>
                <p className="text-stone-600">
                  Choose the medication you'd like for your renewal.
                </p>
              </div>

              <div className="space-y-3">
                {MEDICATION_OPTIONS.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => setFormData({ ...formData, selectedMedication: med.id })}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all
                      ${formData.selectedMedication === med.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-stone-200 hover:border-stone-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-900">{med.name}</p>
                        <p className="text-sm text-stone-500 mt-0.5">{med.description}</p>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center
                        ${formData.selectedMedication === med.id
                          ? 'bg-purple-500 text-white'
                          : 'border-2 border-stone-300'
                        }
                      `}>
                        {formData.selectedMedication === med.id && (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Wellness Questionnaire */}
          {currentStep === 2 && patient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
                  Wellness Check-In
                </h2>
                <p className="text-stone-600">
                  Tell us how you've been doing since your last order.
                </p>
              </div>

              {/* Weight Update */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-stone-700 mb-1">
                  Current Weight (lbs)
                </label>
                <input
                  id="weight"
                  type="number"
                  value={formData.weightLbs}
                  onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  placeholder="Enter current weight"
                />
              </div>

              {/* Quick wellness questions */}
              {[
                { id: 'sideEffects', question: 'Have you experienced any side effects?' },
                { id: 'satisfactionLevel', question: 'How satisfied are you with your treatment?' },
                { id: 'healthChanges', question: 'Any significant health changes since your last order?' },
              ].map((item) => (
                <div key={item.id}>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {item.question}
                  </label>
                  <textarea
                    value={formData.wellnessQuestionnaire[item.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wellnessQuestionnaire: {
                          ...formData.wellnessQuestionnaire,
                          [item.id]: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
                    placeholder="Type your response..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Telehealth Consent */}
          {currentStep === 3 && patient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
                  Telehealth Consent
                </h2>
                <p className="text-stone-600">
                  Please confirm your consent to continue receiving telehealth services.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 max-h-48 overflow-y-auto">
                <p className="mb-2">
                  I consent to receiving telehealth services from <span className="font-display font-bold tracking-[0.08em]">CULTR</span> Health for the purpose
                  of renewing my medication. I understand that my health information will be
                  reviewed by a licensed healthcare provider.
                </p>
                <p>
                  I confirm that there have been no significant changes to my health that
                  would affect my ability to safely continue this medication, unless noted
                  in the wellness questionnaire.
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={!!formData.telehealthSignatureKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telehealthSignatureKey: e.target.checked ? 'renewal-consent-accepted' : '',
                    })
                  }
                  className="w-5 h-5 text-purple-600 border-stone-300 rounded focus:ring-purple-500 mt-0.5"
                />
                <div>
                  <p className="font-medium text-stone-900">I agree to the telehealth consent</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    By checking this box, I electronically sign and consent to the above terms.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && patient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-stone-900 mb-2">
                  Review Your Renewal
                </h2>
                <p className="text-stone-600">
                  Please confirm your information before submitting.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Patient</p>
                  <p className="font-medium text-stone-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Medication</p>
                  <p className="font-medium text-stone-900">
                    {MEDICATION_OPTIONS.find((m) => m.id === formData.selectedMedication)?.name || 'Not selected'}
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Shipping Address</p>
                  <p className="font-medium text-stone-900">
                    {formData.shippingAddress.address1}
                    {formData.shippingAddress.address2 && `, ${formData.shippingAddress.address2}`}
                    <br />
                    {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                  </p>
                </div>
              </div>

              {submitError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-xl font-medium text-lg hover:bg-purple-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Renewal Request'
                )}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {patient && currentStep < 4 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-stone-200">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                  ${currentStep === 1
                    ? 'text-stone-300 cursor-not-allowed'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }
                `}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !formData.selectedMedication) ||
                  (currentStep === 3 && !formData.telehealthSignatureKey)
                }
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all
                  ${(currentStep === 1 && !formData.selectedMedication) ||
                    (currentStep === 3 && !formData.telehealthSignatureKey)
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  }
                `}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
