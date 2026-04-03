import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Your Intake Form | CULTR Health',
  description: 'Complete your health questionnaire to get started with your personalized treatment plan.',
};

/**
 * Intake Page — Healthie Embedded Forms
 *
 * This page will embed the Healthie SDK form widget for patient intake.
 * The form is configured in the Healthie dashboard and covers:
 * - Personal info, shipping address, medications
 * - Physical measurements, goals, wellness questionnaire
 * - GLP-1 history, current meds, treatment preferences
 * - ID upload, consent forms
 *
 * TODO: Replace placeholder with @healthie/sdk embed once Healthie account is provisioned.
 */
export default function IntakePage() {
  return (
    <div className="min-h-screen grad-light">
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-primary mb-6">
            Medical Intake Form
          </h1>
          <p className="text-lg text-cultr-textMuted mb-8">
            Complete your health questionnaire to get started with your personalized treatment plan.
          </p>

          {/* Healthie SDK embed placeholder */}
          <div className="bg-white rounded-2xl border border-cultr-sage p-8 text-left">
            <p className="text-cultr-textMuted text-center">
              The intake form is being configured. Please check back shortly or contact{' '}
              <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">
                support@cultrhealth.com
              </a>{' '}
              for assistance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
