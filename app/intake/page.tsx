import Link from 'next/link';
import { Metadata } from 'next';
import { LINKS, getClinicalIntakeUrl } from '@/lib/config/links';

export const metadata: Metadata = {
  title: 'Complete Your Intake Form | CULTR Health',
  description: 'Complete your health questionnaire to get started with your personalized treatment plan.',
};

export default function IntakePage() {
  const intakeUrl = getClinicalIntakeUrl();

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

          <div className="bg-white rounded-2xl border border-cultr-sage p-8 text-left">
            {intakeUrl ? (
              <div className="space-y-5 text-center">
                <p className="text-cultr-textMuted">
                  CULTR uses Healthie EHR for secure intake submissions. Open the form below to complete your medical questionnaire in Healthie and return to onboarding when you&apos;re done.
                </p>
                <a
                  href={intakeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-medium text-brand-cream transition-all duration-200 hover:scale-[1.03] hover:bg-brand-primaryHover active:scale-[0.97]"
                >
                  Continue to Healthie Intake
                </a>
                <p className="text-xs text-cultr-textMuted/70">
                  This opens the Healthie intake workflow in a new tab.
                </p>
                <Link
                  href={LINKS.onboarding}
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary/30 px-6 py-3 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/5 hover:border-brand-primary/50"
                >
                  Back to Onboarding
                </Link>
              </div>
            ) : (
              <p className="text-cultr-textMuted text-center">
                The Healthie intake link is being finalized. Please contact{' '}
                <a href={`mailto:${LINKS.supportEmail}`} className="text-brand-primary underline">
                  {LINKS.supportEmail}
                </a>{' '}
                for assistance.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
