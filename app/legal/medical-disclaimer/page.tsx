import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — CULTR Health',
  description: 'Important medical disclaimer and safety information for CULTR Health services.',
};

export default function MedicalDisclaimerPage() {
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
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-cultr max-w-none">
            {/* Emergency Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-10 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-display font-bold text-red-800 mb-2">Not Emergency Care</h3>
                <p className="text-red-700 leading-relaxed">
                  If you are experiencing a medical emergency, call 911 immediately. Do not rely on <span className="font-display font-bold">CULTR</span> Health for emergency medical needs. Our services are not intended for urgent or emergency care.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">No Guarantees</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Individual results vary significantly based on numerous factors including genetics, lifestyle, adherence to protocols, and underlying health conditions. We do not guarantee specific weight loss, longevity, or health optimization results. All treatments carry potential risks and side effects.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Provider-Patient Relationship</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              The provider-patient relationship is established only after a consultation with a licensed healthcare provider. Browsing this website, reading our content, or creating an account does not establish a doctor-patient relationship. Medical advice is only provided during scheduled consultations with licensed providers.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Prescription Medications</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              All prescription medications are prescribed only when clinically appropriate based on your health history, lab results, and provider assessment. Not all patients will qualify for all treatments. Your provider will discuss risks, benefits, and alternatives during your consultation.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">FDA Statement</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Statements on this website have not been evaluated by the Food and Drug Administration. Products and services are not intended to diagnose, treat, cure, or prevent any disease. Compounded medications are not FDA-approved but are prepared by licensed pharmacies in compliance with applicable regulations.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Educational Content</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Information provided on this website and in our platform is for educational purposes only and should not be considered medical advice. Always consult with a qualified healthcare provider before making decisions about your health or starting any treatment.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">Reporting Side Effects</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              If you experience any side effects from treatments prescribed through <span className="font-display font-bold">CULTR</span> Health, please contact your provider immediately through the patient portal. For severe or life-threatening reactions, seek emergency medical care by calling 911.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
