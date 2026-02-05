import { Metadata } from 'next';
import { IntakeFormClient } from './IntakeFormClient';

export const metadata: Metadata = {
  title: 'Complete Your Intake Form | CULTR Health',
  description: 'Complete your health questionnaire to get started with your personalized treatment plan.',
};

export default function IntakePage() {
  return <IntakeFormClient />;
}
