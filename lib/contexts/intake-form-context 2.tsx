'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Simple form data interface for components
export interface SimpleFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  shippingAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  selectedMedication?: string; // Deprecated - kept for backwards compatibility
  selectedMedications?: string[]; // New: array for multi-select
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  goalWeightLbs?: number;
  wellnessQuestionnaire?: Record<string, string | string[]>;
  glp1History?: Record<string, string>;
  currentMedications?: Array<{ name: string; dosage: string; frequency: string }>;
  noCurrentMedications?: boolean;
  treatmentPreferences?: Record<string, string>;
  idDocumentKey?: string;
  telehealthSignatureKey?: string;
  compoundedConsentKey?: string;
  stripeSessionId?: string;
  planTier?: string;
}

interface IntakeFormContextValue {
  formData: SimpleFormData;
  updateFormData: (updates: Partial<SimpleFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepComplete: (stepId: string) => boolean;
  getCompletedSteps: () => string[];
  resetForm: () => void;
}

const IntakeFormContext = createContext<IntakeFormContextValue | null>(null);

const STORAGE_KEY = 'cultr-intake-simple';

export function IntakeFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<SimpleFormData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFormData(parsed.formData || {});
        setCurrentStep(parsed.currentStep || 0);
      } catch {
        // Ignore parse errors
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep }));
    }
  }, [formData, currentStep, isLoaded]);

  const updateFormData = useCallback((updates: Partial<SimpleFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const isStepComplete = useCallback(
    (stepId: string): boolean => {
      switch (stepId) {
        case 'personal-info':
          return !!(
            formData.firstName &&
            formData.lastName &&
            formData.email &&
            formData.phone &&
            formData.dateOfBirth &&
            formData.gender
          );
        case 'shipping':
          return !!(
            formData.shippingAddress?.address1 &&
            formData.shippingAddress?.city &&
            formData.shippingAddress?.state &&
            formData.shippingAddress?.zipCode
          );
        case 'medications':
          // Support both old single selection and new multi-select
          return (formData.selectedMedications && formData.selectedMedications.length > 0) || !!formData.selectedMedication;
        case 'physical':
          return !!(
            formData.heightFeet &&
            formData.heightInches !== undefined &&
            formData.weightLbs
          );
        case 'wellness':
          return Object.keys(formData.wellnessQuestionnaire || {}).length >= 5;
        case 'glp1-history':
          return !!formData.glp1History?.previousGlp1Use;
        case 'current-medications':
          return (
            formData.noCurrentMedications ||
            (formData.currentMedications && formData.currentMedications.length > 0) ||
            false
          );
        case 'preferences':
          return !!formData.treatmentPreferences?.preferredContactMethod;
        case 'id-upload':
          return !!formData.idDocumentKey;
        case 'consent':
          return !!(formData.telehealthSignatureKey && formData.compoundedConsentKey);
        case 'review':
          return true;
        default:
          return false;
      }
    },
    [formData]
  );

  const getCompletedSteps = useCallback((): string[] => {
    const steps = [
      'personal-info',
      'shipping',
      'medications',
      'physical',
      'wellness',
      'glp1-history',
      'current-medications',
      'preferences',
      'id-upload',
      'consent',
    ];
    return steps.filter((step) => isStepComplete(step));
  }, [isStepComplete]);

  const resetForm = useCallback(() => {
    setFormData({});
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <IntakeFormContext.Provider
      value={{
        formData,
        updateFormData,
        currentStep,
        setCurrentStep,
        isStepComplete,
        getCompletedSteps,
        resetForm,
      }}
    >
      {children}
    </IntakeFormContext.Provider>
  );
}

export function useIntakeForm() {
  const context = useContext(IntakeFormContext);
  if (!context) {
    throw new Error('useIntakeForm must be used within an IntakeFormProvider');
  }
  return context;
}
