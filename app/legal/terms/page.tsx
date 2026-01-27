import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — CULTR Health',
  description: 'CULTR Health terms of service. Please read these terms carefully before using our services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Terms of Service</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-cultr-textMuted mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-cultr max-w-none">
            <p className="text-cultr-text leading-relaxed">
              Welcome to CULTR Health. By accessing our website and services, you agree to these terms. Please read them carefully.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">1. Services</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              CULTR Health provides a technology platform to connect members with healthcare providers. We do not provide medical services directly; medical services are provided by independent licensed healthcare professionals. CULTR Health facilitates the connection between you and these providers.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">2. Membership</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Membership fees cover access to the CULTR platform, care coordination, and included consultations as specified in your plan. Lab draw fees, medications, and certain specialized services may incur additional fees or be billed separately.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">3. Eligibility</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              You must be at least 18 years old and reside in a state where we operate to use our services. Certain treatments may have additional eligibility requirements based on medical criteria determined by your provider.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">4. Cancellation</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              You may cancel your membership at any time through your member portal or by contacting support. Cancellations are effective at the end of the current billing cycle. No refunds are provided for partial months.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">5. User Responsibilities</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              You agree to provide accurate information, maintain the confidentiality of your account credentials, and comply with all applicable laws. You are responsible for all activity that occurs under your account.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">6. Limitation of Liability</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              CULTR Health provides a platform for connecting you with healthcare services. We do not guarantee specific health outcomes. To the maximum extent permitted by law, CULTR Health shall not be liable for any indirect, incidental, or consequential damages.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">7. Changes to Terms</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We may update these terms from time to time. We will notify you of material changes via email or through the platform. Continued use of our services after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">8. Contact</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              For questions about these terms, please contact us at legal@cultrhealth.com.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
