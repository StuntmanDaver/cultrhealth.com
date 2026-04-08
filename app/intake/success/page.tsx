import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, MessageSquare, Phone, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Intake Submitted | CULTR Health',
  description: 'Your intake form has been submitted successfully.',
};

export default function IntakeSuccessPage() {
  return (
    <div className="min-h-screen grad-page flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="card text-center p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-sage rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-brand-primary" />
          </div>

          <h1 className="text-2xl font-display font-bold text-brand-primary mb-2">
            Intake Form Submitted!
          </h1>

          <p className="text-brand-primary/70 mb-8">
            Your health information has been received and is being reviewed by our medical team.
          </p>

          {/* Timeline */}
          <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-brand-primary mb-4">What happens next?</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-sage rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-primary font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-brand-primary">Provider Review</p>
                  <p className="text-sm text-brand-primary/60">
                    A licensed healthcare provider will review your intake within 24-48 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-primary/60 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-brand-primary">Prescription</p>
                  <p className="text-sm text-brand-primary/60">
                    If approved, your prescription will be sent to our partner pharmacy.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-primary/60 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-brand-primary">Shipping</p>
                  <p className="text-sm text-brand-primary/60">
                    Your medication will be shipped directly to your address.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-mint text-brand-primary rounded-full text-sm font-medium mb-6 border border-brand-primary/10">
            <Clock className="w-4 h-4" />
            Review in Progress
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="btn-primary w-full"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>

            <Link
              href="/members"
              className="btn-secondary w-full"
            >
              Explore Our Library
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-brand-primary/60 mb-3">Questions about your order?</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:support@cultrhealth.com"
              className="flex items-center gap-2 text-sm text-brand-primary/80 hover:text-brand-primary"
            >
              <MessageSquare className="w-4 h-4" />
              support@cultrhealth.com
            </a>
            <a
              href="tel:+18005551234"
              className="flex items-center gap-2 text-sm text-brand-primary/80 hover:text-brand-primary"
            >
              <Phone className="w-4 h-4" />
              1-800-555-1234
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
