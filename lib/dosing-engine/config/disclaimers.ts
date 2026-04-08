import { DisclaimerBlock } from '../types';

export const DISCLAIMERS: Record<string, DisclaimerBlock> = {
  NOT_MEDICAL_ADVICE: {
    id: 'not_medical_advice',
    title: 'Not Medical Advice',
    text: 'This recommendation engine provides informational guidelines based on established literature. It does not replace the advice, diagnosis, or treatment plan of your licensed medical provider.',
    type: 'warning',
  },
  CONSULT_PROVIDER: {
    id: 'consult_provider',
    title: 'Consult Your Provider',
    text: 'Always review and approve your dosing schedule with your CULTR Health provider or a primary care physician before beginning any new treatment.',
    type: 'warning',
  },
  AI_MAY_BE_WRONG: {
    id: 'ai_may_be_wrong',
    title: 'Automated Calculation',
    text: 'Calculations are provided by an automated rule engine and may not account for your complete medical history. Please verify the insulin syringe units independently.',
    type: 'info',
  },
  INVESTIGATIONAL: {
    id: 'investigational',
    title: 'Investigational Product',
    text: 'This product is considered investigational or off-label for this use case. There is no standardized FDA-approved human maintenance dose for this compound.',
    type: 'info',
  },
  CONVERSION_ONLY: {
    id: 'conversion_only',
    title: 'Conversion Reference Only',
    text: 'This compound lacks a standard human titration schedule. The units provided below are purely mathematical conversions based on common hypothetical dosages, not an endorsed medical protocol.',
    type: 'info',
  }
};
