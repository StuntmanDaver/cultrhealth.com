'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IntakeFormProvider, useIntakeForm } from '@/lib/contexts/intake-form-context';
import { INTAKE_FORM_STEPS } from '@/lib/config/asher-med';
import { IntakeProgress } from '@/components/intake/IntakeProgress';
import { PersonalInfoForm } from '@/components/intake/PersonalInfoForm';
import { ShippingAddressForm } from '@/components/intake/ShippingAddressForm';
import { MedicationSelector } from '@/components/intake/MedicationSelector';
import { PhysicalMeasurementsForm } from '@/components/intake/PhysicalMeasurementsForm';
import { WellnessQuestionnaire } from '@/components/intake/WellnessQuestionnaire';
import { GLP1HistoryForm } from '@/components/intake/GLP1HistoryForm';
import { CurrentMedicationsForm } from '@/components/intake/CurrentMedicationsForm';
import { TreatmentPreferencesForm } from '@/components/intake/TreatmentPreferencesForm';
import { IDUploader } from '@/components/intake/IDUploader';
import { ConsentForms } from '@/components/intake/ConsentForms';
import { ReviewSummary } from '@/components/intake/ReviewSummary';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

function IntakeFormLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-forest animate-spin" />
        <p className="text-forest-muted">Loading intake form...</p>
      </div>
    </div>
  );
}

export function IntakeFormClient() {
  return (
    <IntakeFormProvider>
      <Suspense fallback={<IntakeFormLoading />}>
        <IntakeFormContent />
      </Suspense>
    </IntakeFormProvider>
  );
}

function IntakeFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    isStepComplete,
    getCompletedSteps,
    resetForm,
  } = useIntakeForm();

  // Get session ID from URL params (from checkout success redirect)
  const sessionId = searchParams.get('session_id');
  const planTier = searchParams.get('plan');

  // Store session ID in form data on mount
  useEffect(() => {
    if (sessionId) {
      updateFormData({ stripeSessionId: sessionId });
    }
    if (planTier) {
      updateFormData({ planTier });
    }
  }, [sessionId, planTier, updateFormData]);

  // Calculate visible steps based on medication selection
  const selectedMeds = formData.selectedMedications || (formData.selectedMedication ? [formData.selectedMedication] : []);
  const isGLP1 = selectedMeds.some(med =>
    med.includes('glp1') || med.includes('tirzepatide') || med.includes('semaglutide')
  );

  const visibleSteps = INTAKE_FORM_STEPS.filter((step) => {
    if (step.id === 'glp1-history') {
      return isGLP1;
    }
    return true;
  });

  const currentStepData = visibleSteps[currentStep];
  const isLastStep = currentStep === visibleSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stripeSessionId: sessionId || formData.stripeSessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit intake form');
      }

      // Clear form data and redirect to success
      resetForm();
      router.push('/intake/success');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStepData?.id) {
      case 'personal-info':
        return <PersonalInfoForm />;
      case 'shipping':
        return <ShippingAddressForm />;
      case 'medications':
        return <MedicationSelector />;
      case 'physical':
        return <PhysicalMeasurementsForm />;
      case 'wellness':
        return <WellnessQuestionnaire />;
      case 'glp1-history':
        return <GLP1HistoryForm />;
      case 'current-medications':
        return <CurrentMedicationsForm />;
      case 'preferences':
        return <TreatmentPreferencesForm />;
      case 'id-upload':
        return <IDUploader />;
      case 'consent':
        return <ConsentForms />;
      case 'review':
        return <ReviewSummary onSubmit={handleSubmit} isSubmitting={isSubmitting} error={submitError} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header - Forest green background */}
      <div className="bg-forest sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-white">
                Health Intake Form
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                Step {currentStep + 1} of {visibleSteps.length}
              </p>
            </div>
            <div className="text-sm text-mint font-medium">
              {Math.round(((currentStep + 1) / visibleSteps.length) * 100)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <IntakeProgress
        steps={visibleSteps}
        currentStep={currentStep}
        completedSteps={getCompletedSteps()}
        onStepClick={(index) => {
          if (index <= currentStep || isStepComplete(visibleSteps[index - 1]?.id)) {
            setCurrentStep(index);
          }
        }}
      />

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg shadow-forest/5 border border-forest-light/20 p-6 md:p-8">
          {/* Step Title */}
          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-forest">
              {currentStepData?.title}
            </h2>
            {currentStepData?.description && (
              <p className="text-forest-muted mt-1">{currentStepData.description}</p>
            )}
          </div>

          {/* Step Content */}
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStepData?.id !== 'review' && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all
                ${isFirstStep
                  ? 'text-forest-muted/50 cursor-not-allowed'
                  : 'text-forest-muted hover:text-forest hover:bg-white/80'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepComplete(currentStepData?.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                ${isStepComplete(currentStepData?.id)
                  ? 'bg-forest text-white hover:bg-forest-dark shadow-lg shadow-forest/30'
                  : 'bg-forest-light/30 text-forest-muted cursor-not-allowed border border-forest-light/30'
                }
              `}
            >
              {isLastStep ? 'Review' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
