import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PROVIDERS } from '@/lib/config/social-proof';
import { DISPENSING_PHARMACY, PROVIDER_CREDENTIALS } from '@/lib/config/compliance';

export const metadata: Metadata = {
  title: 'Provider Credentials — CULTR Health',
  description: 'Licensed healthcare provider credentials and pharmacy information for CULTR Health.',
};

export default function ProviderCredentialsPage() {
  const pharmacy = DISPENSING_PHARMACY;

  return (
    <div className="min-h-screen grad-white">
      {/* Header */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Provider Credentials</h1>
          <p className="text-white/60 mt-3">
            CULTR Health works exclusively with licensed, credentialed healthcare professionals.
            All prescribing decisions are made by independent licensed providers following clinical evaluation.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 section-veil">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Medical Team */}
          <div>
            <h2 className="text-xl font-display font-semibold text-brand-primary mb-6">
              Medical Team
            </h2>
            <div className="space-y-6">
              {PROVIDERS.map((provider) => (
                <div
                  key={provider.name}
                  className="bg-white border border-brand-primary/10 rounded-xl p-6"
                >
                  <h3 className="text-lg font-display font-bold text-brand-primary">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-brand-primary/60 mt-1">
                    {provider.specialty} · {provider.credentials}
                  </p>
                  <p className="text-sm text-brand-primary/60">
                    {provider.yearsExperience}+ years of clinical experience
                  </p>
                  {provider.bio && (
                    <p className="text-sm text-brand-primary/80 mt-3 leading-relaxed">
                      {provider.bio}
                    </p>
                  )}
                </div>
              ))}

              {/* Medical Director */}
              <div className="bg-white border border-brand-primary/10 rounded-xl p-6 mt-4">
                <h3 className="text-lg font-display font-bold text-brand-primary">
                  {PROVIDER_CREDENTIALS.medical_director.name}
                </h3>
                <p className="text-sm text-brand-primary/60 mt-1">
                  {PROVIDER_CREDENTIALS.medical_director.specialty} · Medical Director
                </p>
                {PROVIDER_CREDENTIALS.medical_director.npi ? (
                  <p className="text-sm text-brand-primary/60 mt-1">
                    <strong>NPI:</strong> {PROVIDER_CREDENTIALS.medical_director.npi}
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 mt-1 italic">NPI: Pending verification</p>
                )}
              </div>
            </div>
          </div>

          {/* Dispensing Pharmacy */}
          <div>
            <h2 className="text-xl font-display font-semibold text-brand-primary mb-6">
              Dispensing Pharmacy
            </h2>
            <div className="bg-white border border-brand-primary/10 rounded-xl p-6">
              <h3 className="text-lg font-display font-bold text-brand-primary">
                {pharmacy.name}
              </h3>
              <div className="text-sm text-brand-primary/70 mt-2 space-y-1">
                <p>{pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.zip}</p>
                <p>Phone: {pharmacy.phone} · Fax: {pharmacy.fax}</p>
                <p>Toll-Free: {pharmacy.tollFree}</p>
                <p>Email: {pharmacy.email}</p>
                <p>Florida Pharmacy License: {pharmacy.licenseNumber}</p>
                <p>Control Number: {pharmacy.controlNumber}</p>
                <p>License Expires: {new Date(pharmacy.licenseExpires).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="mt-2">
                  <a
                    href={pharmacy.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary underline"
                  >
                    {pharmacy.website}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div>
            <h2 className="text-xl font-display font-semibold text-brand-primary mb-4">
              Credential Verification
            </h2>
            <p className="text-sm text-brand-primary/70 leading-relaxed">
              Provider licenses can be independently verified through state medical board websites.
              Pharmacy licenses can be verified through the Florida Board of Pharmacy at{' '}
              <a
                href="https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary underline"
              >
                Florida DOH License Verification
              </a>.
              If you have questions about our providers or pharmacy partners, contact us at{' '}
              <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">
                support@cultrhealth.com
              </a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
