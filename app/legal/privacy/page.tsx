import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CULTR Health privacy policy. Learn how we collect, use, and protect your personal health information under HIPAA compliance.',
  alternates: {
    canonical: '/legal/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Privacy Policy</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-cultr-textMuted mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-cultr max-w-none">
            <p className="text-cultr-text leading-relaxed">
              Your privacy is critically important to us. This policy details how CULTR Health (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and protects your information.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">1. Information We Collect</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We collect information necessary to provide our services, including:
            </p>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li>Contact information (name, email, phone number)</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Health information provided during intake and consultations</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">2. HIPAA Compliance</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Protected Health Information (PHI) is stored in HIPAA-compliant systems through our partner Healthie. We maintain Business Associate Agreements (BAAs) with all vendors who handle PHI. We do not sell your health data to third parties.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">3. How We Use Your Information</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li>Provide and improve our services</li>
              <li>Communicate with you about your care</li>
              <li>Process payments</li>
              <li>Send important updates about your membership</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">4. Data Security</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We use industry-standard encryption (TLS 1.3) and security measures to protect your information. All data is encrypted at rest and in transit. We regularly audit our security practices and maintain SOC 2 compliance through our infrastructure providers.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">5. Your Rights</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at privacy@cultrhealth.com.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">6. Contact Us</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              If you have questions about this privacy policy, please contact us at privacy@cultrhealth.com.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
