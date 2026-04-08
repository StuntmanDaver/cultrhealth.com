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
    <div className="min-h-screen grad-white">
      {/* Header */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Privacy Policy</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 section-veil">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-cultr-textMuted mb-8">Last updated: April 5, 2026</p>

          <div className="prose prose-cultr max-w-none">
            <p className="text-cultr-text leading-relaxed">
              Your privacy is critically important to us. This policy details how <span className="font-display font-bold">CULTR</span> Health (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and protects your information.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">1. Information We Collect</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We collect the following categories of information:
            </p>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li><strong>Contact information:</strong> Name, email address, phone number, mailing address</li>
              <li><strong>Account credentials:</strong> Email and authentication tokens</li>
              <li><strong>Payment information:</strong> Processed securely via Stripe — we do not store card numbers</li>
              <li><strong>Health information (PHI):</strong> Medical history, intake form responses, lab results, prescription information, and consultation records</li>
              <li><strong>Usage data:</strong> Pages visited, features used, device type, browser type</li>
              <li><strong>Cookies:</strong> Session management, attribution tracking (30-day affiliate cookies), and analytics</li>
            </ul>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">2. HIPAA Compliance</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              <span className="font-display font-bold">CULTR</span> Health is committed to protecting your Protected Health Information (PHI) in accordance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA).
            </p>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li>PHI is stored in HIPAA-compliant systems with encryption at rest and in transit</li>
              <li>We maintain Business Associate Agreements (BAAs) with all vendors who access or process PHI</li>
              <li>We do not sell, rent, or trade your health data to any third party</li>
              <li>Access to PHI is restricted to authorized personnel on a need-to-know basis</li>
              <li>We conduct regular security assessments and maintain audit logs of PHI access</li>
              <li>Our platform enforces automatic session timeouts (30 minutes of inactivity) for pages containing PHI</li>
            </ul>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li>Provide, maintain, and improve our healthcare platform services</li>
              <li>Connect you with licensed healthcare providers for clinical evaluation</li>
              <li>Process payments and manage your membership</li>
              <li>Send transactional communications about your care (appointment confirmations, lab results, prescription updates)</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Improve website functionality through aggregated, de-identified analytics</li>
            </ul>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">4. Service Providers &amp; Clinical Partners</h2>
            <p className="text-cultr-textMuted leading-relaxed mb-4">
              We work with carefully selected service providers to operate the platform, process payments, fulfill prescriptions, and support secure clinical workflows. We only enable a vendor to handle PHI when the required contractual and security controls are in place for that use case.
            </p>
            <div className="overflow-x-auto not-prose mb-6">
              <table className="min-w-full text-sm border border-brand-primary/10 rounded-lg">
                <thead className="bg-brand-cream">
                  <tr className="border-b border-brand-primary/10">
                    <th className="text-left py-3 px-4 font-semibold text-brand-primary">Provider</th>
                    <th className="text-left py-3 px-4 font-semibold text-brand-primary">Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold text-brand-primary">BAA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-primary/5 text-brand-primary/70">
                  <tr><td className="py-3 px-4">St. Luke Compounding Pharmacy</td><td className="py-3 px-4">Medication compounding and dispensing</td><td className="py-3 px-4">Operational care partner</td></tr>
                  <tr><td className="py-3 px-4">Healthie EHR</td><td className="py-3 px-4">Clinical intake, appointment scheduling, and patient workflow</td><td className="py-3 px-4">BAA required before PHI activation</td></tr>
                  <tr><td className="py-3 px-4">Stripe</td><td className="py-3 px-4">Payment processing</td><td className="py-3 px-4">Payment data only — PHI not intentionally sent</td></tr>
                  <tr><td className="py-3 px-4">Vercel / Neon</td><td className="py-3 px-4">Application hosting and database infrastructure</td><td className="py-3 px-4">Security and contractual controls required for authorized data</td></tr>
                  <tr><td className="py-3 px-4">Resend</td><td className="py-3 px-4">Transactional email delivery</td><td className="py-3 px-4">Routine PHI excluded from email content</td></tr>
                  <tr><td className="py-3 px-4">SiPhox Health</td><td className="py-3 px-4">At-home lab testing</td><td className="py-3 px-4">Clinical partner handling lab workflows</td></tr>
                  <tr><td className="py-3 px-4">Cloudflare</td><td className="py-3 px-4">CDN, security, bot protection</td><td className="py-3 px-4">Security traffic data only</td></tr>
                  <tr><td className="py-3 px-4">Google Analytics</td><td className="py-3 px-4">Aggregated website analytics (no PHI pages)</td><td className="py-3 px-4">N/A — no PHI access</td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">5. Data Security</h2>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Automatic session timeout after 30 minutes of inactivity</li>
              <li>Secure, HttpOnly cookies with SameSite protections</li>
              <li>Regular security audits through our infrastructure providers</li>
              <li>Infrastructure providers maintain enterprise security controls and independent audit programs where applicable</li>
            </ul>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">6. Data Retention</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We retain your health information for a minimum of 7 years following your last interaction, consistent with medical record retention requirements. Account and billing data is retained for the duration required by applicable tax and financial regulations. You may request deletion of non-medical data at any time.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">7. Your Rights</h2>
            <p className="text-cultr-textMuted leading-relaxed mb-4">
              Under HIPAA and applicable state privacy laws, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li><strong>Access:</strong> Request copies of your health records</li>
              <li><strong>Correction:</strong> Request amendments to inaccurate health information</li>
              <li><strong>Restriction:</strong> Request restrictions on certain uses of your PHI</li>
              <li><strong>Accounting:</strong> Request an accounting of disclosures of your PHI</li>
              <li><strong>Deletion:</strong> Request deletion of your personal (non-medical) data</li>
              <li><strong>Portability:</strong> Receive your data in a commonly used electronic format</li>
            </ul>
            <p className="text-cultr-textMuted leading-relaxed mt-4">
              To exercise any of these rights, contact us at <a href="mailto:privacy@cultrhealth.com" className="text-brand-primary underline">privacy@cultrhealth.com</a>.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">8. Breach Notification</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              In the event of a breach of unsecured PHI, we will notify affected individuals within 60 days as required by the HIPAA Breach Notification Rule. Breaches affecting 500 or more individuals will also be reported to the U.S. Department of Health and Human Services and, where required, to local media.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">9. Cookies &amp; Tracking</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We use cookies for session management, affiliate attribution (30-day window), and analytics. Analytics cookies collect aggregated, non-identifiable usage data. We do not use tracking cookies on authenticated pages that may display health information.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">10. Changes to This Policy</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              We may update this privacy policy periodically. Material changes will be communicated via email or a notice on our platform. Your continued use of our services after changes constitutes acceptance.
            </p>

            <h2 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">11. Contact</h2>
            <p className="text-cultr-textMuted leading-relaxed">
              For privacy-related inquiries or to exercise your rights:
            </p>
            <ul className="list-disc pl-6 text-cultr-textMuted space-y-2">
              <li>Email: <a href="mailto:privacy@cultrhealth.com" className="text-brand-primary underline">privacy@cultrhealth.com</a></li>
              <li>Support: <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">support@cultrhealth.com</a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
