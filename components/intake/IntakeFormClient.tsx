'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TypeformStep, TypeformRadio, TypeformInput, TypeformTextarea } from './TypeformStep';
import { LINKS } from '@/lib/config/links';
import { AnimatePresence } from 'framer-motion';
import { trackIntakeStart, trackIntakeStep, trackIntakeComplete } from '@/lib/analytics';

// Types
type IntakeState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  shippingAddress: string;
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  selectedMedications: string[];
  goalsMotivation: {
    primaryGoal: string;
    whyNow: string;
    topSymptoms: string;
  };
  currentMedications: string[];
  // Consent
  emailConsent: boolean | null;
  marketingConsent: boolean | null;
  telehealthConsent: boolean | null;
};

const initialState: IntakeState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  shippingAddress: '',
  heightFeet: '',
  heightInches: '',
  weightLbs: '',
  selectedMedications: [],
  goalsMotivation: {
    primaryGoal: '',
    whyNow: '',
    topSymptoms: '',
  },
  currentMedications: [],
  emailConsent: null,
  marketingConsent: null,
  telehealthConsent: null,
};

export function IntakeFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') || '';
  
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-focus logic can be handled natively or via refs if needed
  
  const updateData = (updates: Partial<IntakeState>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateGoals = (updates: Partial<IntakeState['goalsMotivation']>) => {
    setData((prev) => ({
      ...prev,
      goalsMotivation: { ...prev.goalsMotivation, ...updates },
    }));
  };

  const nextStep = () => {
    setStep((prev) => {
      const next = prev + 1;
      
      // Map step number to descriptive name for analytics
      const stepNames = [
        'start', 'name', 'contact', 'demographics', 'shipping', 
        'measurements', 'primary_goal', 'consent_email_text', 
        'consent_marketing', 'consent_telehealth', 'submit'
      ];
      
      trackIntakeStep(stepNames[next] || `step_${next}`, next);
      return next;
    });
  };

  // Track initial start when component mounts
  useEffect(() => {
    trackIntakeStart();
  }, []);

  const submitForm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          stripeSessionId: sessionId,
          // Map boolean consents to string flags if needed, or keep as boolean
          // API validation will be updated to accept these booleans
          wellnessQuestionnaire: data.goalsMotivation, // pass through for existing logic
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        trackIntakeComplete();
        router.push('/intake/success');
      } else {
        setError(result.error || 'Failed to submit form');
        setStep(step - 1); // Go back to show error
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setStep(step - 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <TypeformStep
            title="Let's get started with your medical intake."
            description="We need some basic information to personalize your protocol. This is secure and HIPAA-compliant."
            onNext={nextStep}
            canAdvance={true}
            nextButtonText="Let's go"
          >
            <div className="h-20" />
          </TypeformStep>
        );

      case 1:
        return (
          <TypeformStep
            stepNumber={1}
            title="What is your legal name?"
            onNext={nextStep}
            canAdvance={data.firstName.trim().length > 0 && data.lastName.trim().length > 0}
          >
            <TypeformInput
              label="First Name"
              placeholder="Jane"
              value={data.firstName}
              onChange={(e) => updateData({ firstName: e.target.value })}
              autoFocus
            />
            <TypeformInput
              label="Last Name"
              placeholder="Doe"
              value={data.lastName}
              onChange={(e) => updateData({ lastName: e.target.value })}
            />
          </TypeformStep>
        );

      case 2:
        return (
          <TypeformStep
            stepNumber={2}
            title="What is your best contact info?"
            description="We'll use this to update you on your treatment."
            onNext={nextStep}
            canAdvance={data.email.includes('@') && data.phone.length >= 10}
          >
            <TypeformInput
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              autoFocus
            />
            <TypeformInput
              label="Phone Number"
              type="tel"
              placeholder="(555) 555-5555"
              value={data.phone}
              onChange={(e) => updateData({ phone: e.target.value })}
            />
          </TypeformStep>
        );

      case 3:
        return (
          <TypeformStep
            stepNumber={3}
            title="What is your Date of Birth & Gender?"
            onNext={nextStep}
            canAdvance={data.dateOfBirth.length > 0 && data.gender.length > 0}
          >
            <TypeformInput
              label="Date of Birth"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => updateData({ dateOfBirth: e.target.value })}
              autoFocus
            />
            <div className="mt-6 mb-2 text-brand-primary font-medium">Sex assigned at birth</div>
            <TypeformRadio
              label="Female"
              letter="A"
              selected={data.gender === 'Female'}
              onClick={() => updateData({ gender: 'Female' })}
            />
            <TypeformRadio
              label="Male"
              letter="B"
              selected={data.gender === 'Male'}
              onClick={() => updateData({ gender: 'Male' })}
            />
          </TypeformStep>
        );

      case 4:
        return (
          <TypeformStep
            stepNumber={4}
            title="Where should we ship your protocol?"
            description="Must be a valid residential address (No PO Boxes for prescriptions)."
            onNext={nextStep}
            canAdvance={data.shippingAddress.length > 10}
          >
            <TypeformTextarea
              placeholder="123 Main St&#10;Apt 4B&#10;City, State 12345"
              value={data.shippingAddress}
              onChange={(e) => updateData({ shippingAddress: e.target.value })}
              autoFocus
            />
          </TypeformStep>
        );

      case 5:
        return (
          <TypeformStep
            stepNumber={5}
            title="What are your physical measurements?"
            onNext={nextStep}
            canAdvance={data.heightFeet !== '' && data.heightInches !== '' && data.weightLbs !== ''}
          >
            <div className="flex gap-4">
              <TypeformInput
                label="Height (ft)"
                type="number"
                placeholder="5"
                value={data.heightFeet}
                onChange={(e) => updateData({ heightFeet: e.target.value })}
                autoFocus
              />
              <TypeformInput
                label="Height (in)"
                type="number"
                placeholder="8"
                value={data.heightInches}
                onChange={(e) => updateData({ heightInches: e.target.value })}
              />
            </div>
            <TypeformInput
              label="Current Weight (lbs)"
              type="number"
              placeholder="165"
              value={data.weightLbs}
              onChange={(e) => updateData({ weightLbs: e.target.value })}
            />
          </TypeformStep>
        );

      case 6:
        return (
          <TypeformStep
            stepNumber={6}
            title="What is your primary goal with CULTR?"
            onNext={nextStep}
            canAdvance={data.goalsMotivation.primaryGoal.length > 0}
          >
            <TypeformRadio
              label="Weight Loss & Metabolic Health"
              letter="A"
              selected={data.goalsMotivation.primaryGoal === 'Weight Loss'}
              onClick={() => {
                updateGoals({ primaryGoal: 'Weight Loss' });
                updateData({ selectedMedications: ['GLP-1 Therapy'] });
              }}
            />
            <TypeformRadio
              label="Performance & Muscle Growth"
              letter="B"
              selected={data.goalsMotivation.primaryGoal === 'Performance'}
              onClick={() => {
                updateGoals({ primaryGoal: 'Performance' });
                updateData({ selectedMedications: ['Performance Peptides'] });
              }}
            />
            <TypeformRadio
              label="Anti-Aging & Longevity"
              letter="C"
              selected={data.goalsMotivation.primaryGoal === 'Longevity'}
              onClick={() => {
                updateGoals({ primaryGoal: 'Longevity' });
                updateData({ selectedMedications: ['Longevity Protocol'] });
              }}
            />
            <TypeformRadio
              label="Discuss with a provider"
              letter="D"
              selected={data.goalsMotivation.primaryGoal === 'Consultation'}
              onClick={() => {
                updateGoals({ primaryGoal: 'Consultation' });
                updateData({ selectedMedications: ['Undecided / Consult Provider'] });
              }}
            />
          </TypeformStep>
        );

      case 7:
        return (
          <TypeformStep
            stepNumber={7}
            title="CULTR Health Affiliated Covered Entity Patient Email and Text Message Informed Consent*"
            description={(
              <>
                Link to consent form: <a href="https://cultrhealth.com/legal/privacy" target="_blank" className="underline">https://cultrhealth.com/legal/privacy</a>
                <br/><br/>
                I acknowledge that I have read and fully understand this consent form. I understand the risks associated with the use of unencrypted email and text messaging as a form of communication between CULTR Health and me, and consent to the conditions and instructions outlined, as well as any other instructions that CULTR Health may impose to communicate with me by email or text message.
              </>
            )}
            onNext={nextStep}
            canAdvance={data.emailConsent !== null}
          >
            <TypeformRadio
              label="I agree"
              letter="A"
              selected={data.emailConsent === true}
              onClick={() => updateData({ emailConsent: true })}
            />
            <TypeformRadio
              label="I don't agree"
              letter="B"
              selected={data.emailConsent === false}
              onClick={() => updateData({ emailConsent: false })}
            />
          </TypeformStep>
        );

      case 8:
        return (
          <TypeformStep
            stepNumber={8}
            title="Authorization For Use Or Disclosure Of Health Information - Marketing*"
            description={(
              <>
                Link to consent form: <a href="https://cultrhealth.com/legal/privacy" target="_blank" className="underline">https://cultrhealth.com/legal/privacy</a>
                <br/><br/>
                I acknowledge that I have read and agree to the terms of CULTR Health&apos;s Marketing Authorization.
              </>
            )}
            onNext={nextStep}
            canAdvance={data.marketingConsent !== null}
          >
            <TypeformRadio
              label="I accept"
              letter="A"
              selected={data.marketingConsent === true}
              onClick={() => updateData({ marketingConsent: true })}
            />
            <TypeformRadio
              label="I don't accept"
              letter="B"
              selected={data.marketingConsent === false}
              onClick={() => updateData({ marketingConsent: false })}
            />
          </TypeformStep>
        );

      case 9:
        return (
          <TypeformStep
            stepNumber={9}
            title="Telehealth Informed Consent and Notice of Privacy Practices*"
            description={(
              <>
                Link to Telehealth Informed Consent: <a href="https://cultrhealth.com/legal/medical-disclaimer" target="_blank" className="underline">https://cultrhealth.com/legal/medical-disclaimer</a><br/>
                Link to Notice of Privacy Practices: <a href="https://cultrhealth.com/legal/privacy" target="_blank" className="underline">https://cultrhealth.com/legal/privacy</a>
                <br/><br/>
                I acknowledge that I have carefully read, understand, and agree to the terms of this Telehealth Informed Consent and consent to receive the Services. I acknowledge that I have received and reviewed the Notice of Privacy Practices.
              </>
            )}
            onNext={submitForm}
            canAdvance={data.telehealthConsent === true}
            nextButtonText="Submit Intake"
          >
            <TypeformRadio
              label="I acknowledge and accept"
              letter="A"
              selected={data.telehealthConsent === true}
              onClick={() => updateData({ telehealthConsent: true })}
            />
          </TypeformStep>
        );

      case 10:
        return (
          <TypeformStep
            title={isSubmitting ? "Submitting your intake..." : "Almost done..."}
            canAdvance={false}
          >
            <div className="flex justify-center my-12">
              <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
            {error && (
              <div className="text-red-500 text-center mt-4">
                {error}
                <button onClick={() => setStep(9)} className="block mx-auto mt-4 underline text-brand-primary">
                  Go Back
                </button>
              </div>
            )}
          </TypeformStep>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        <div key={step} className="w-full">
          {renderStep()}
        </div>
      </AnimatePresence>
    </div>
  );
}
