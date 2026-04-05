import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { DISPENSING_PHARMACY, DISCLAIMERS, SERVED_STATES, EXCLUDED_STATES } from '@/lib/config/compliance';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — CULTR Health',
  description: 'Important medical disclaimer and safety information for CULTR Health services.',
};

export default function MedicalDisclaimerPage() {
  const p = DISPENSING_PHARMACY;

  return (
    <div className="min-h-screen grad-white">
      {/* Header */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Medical Disclaimer</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 section-veil">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-cultr max-w-none">
            {/* Emergency Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-10 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-display font-bold text-red-800 mb-2">Emergency Notice</h3>
                <p className="text-red-700 leading-relaxed">
                  {DISCLAIMERS.emergency}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">About CULTR Health</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              CULTR Health operates a technology platform that connects members with independent, licensed healthcare providers. CULTR Health does not itself provide medical services. Medical services, including prescribing and clinical decision-making, are provided by independent licensed healthcare professionals.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">No Guarantee of Results</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              {DISCLAIMERS.resultsVary}
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Provider-Patient Relationship</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              A provider-patient relationship is established only after a clinical evaluation by a licensed healthcare provider. Browsing this website, reading our content, taking our quiz, or creating an account does not establish a doctor-patient relationship. Medical advice is provided only during scheduled consultations with licensed providers.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Prescription Medications</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              {DISCLAIMERS.prescriptionRequired}
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Compounded Medications</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              {DISCLAIMERS.compoundedMedication}
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">FDA Disclosure</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              {DISCLAIMERS.generalMedical}
            </p>
            <p className="text-cultr-textMuted leading-relaxed">
              Some products and therapies described on this website are not FDA-approved. Where applicable, individual product and therapy pages indicate FDA approval status. Compounded medications are not FDA-approved but are prepared by licensed pharmacies in accordance with applicable state and federal regulations.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Dispensing Pharmacy</h2>
            <p className="text-cultr-textMuted leading-relaxed mb-4">
              Medications prescribed through CULTR Health are dispensed by:
            </p>
            <div className="bg-brand-cream border border-brand-primary/10 rounded-lg p-4 not-prose mb-6">
              <p className="font-semibold text-brand-primary">{p.name}</p>
              <p className="text-sm text-brand-primary/70 mt-1">
                {p.address}, {p.city}, {p.state} {p.zip}
                <br />
                Phone: {p.phone} · Fax: {p.fax} · Toll-Free: {p.tollFree}
                <br />
                License: {p.licenseNumber} (FL)
              </p>
            </div>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Educational Content</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Information provided on this website, including blog articles, dosing calculators, and educational content, is for educational purposes only and should not be considered medical advice. Always consult with your healthcare provider before making decisions about your health or starting any treatment.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Reporting Side Effects</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              If you experience side effects from treatments prescribed through <span className="font-display font-bold">CULTR</span> Health, contact your provider immediately through the patient portal. For severe or life-threatening reactions, call 911. You may also report adverse events to the FDA MedWatch program at{' '}
              <a
                href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary underline"
              >
                fda.gov/medwatch
              </a>.
            </p>

            <h2 id="availability" className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Service Availability</h2>
            <p className="text-cultr-textMuted leading-relaxed mb-4">
              CULTR Health telehealth services are currently available in the following states:
            </p>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 mb-4 not-prose">
              {SERVED_STATES.map((state) => (
                <span key={state} className="text-center text-xs font-medium text-brand-primary bg-brand-cream border border-brand-primary/10 rounded px-2 py-1">
                  {state}
                </span>
              ))}
            </div>
            <p className="text-cultr-textMuted leading-relaxed mb-2">
              We do not currently serve {EXCLUDED_STATES.join(' or ')}. Service availability may change as regulations evolve.
            </p>
            <p className="text-sm text-cultr-textMuted/70 leading-relaxed">
              Some states may have additional telemedicine requirements. Your provider will confirm service availability during your clinical evaluation.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Contact</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              For questions about this disclaimer, contact us at{' '}
              <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">support@cultrhealth.com</a>.
            </p>

            <p className="text-sm text-cultr-textMuted/50 border-t border-brand-primary/10 pt-6 mt-10">
              Last updated: April 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
