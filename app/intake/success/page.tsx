import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, MessageSquare, Phone, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Intake Submitted | CULTR Health',
  description: 'Your intake form has been submitted successfully.',
};

export default function IntakeSuccessPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-display font-bold text-stone-900 mb-2">
            Intake Form Submitted!
          </h1>

          <p className="text-stone-600 mb-8">
            Your health information has been received and is being reviewed by our medical team.
          </p>

          {/* Timeline */}
          <div className="bg-stone-50 rounded-2xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-stone-900 mb-4">What happens next?</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Provider Review</p>
                  <p className="text-sm text-stone-500">
                    A licensed healthcare provider will review your intake within 24-48 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-stone-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Prescription</p>
                  <p className="text-sm text-stone-500">
                    If approved, your prescription will be sent to our partner pharmacy.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-stone-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Shipping</p>
                  <p className="text-sm text-stone-500">
                    Your medication will be shipped directly to your address.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Review in Progress
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/library"
              className="flex items-center justify-center gap-2 w-full py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-all"
            >
              Explore Our Library
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-stone-500 mb-3">Questions about your order?</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:support@cultrhealth.com"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
            >
              <MessageSquare className="w-4 h-4" />
              support@cultrhealth.com
            </a>
            <a
              href="tel:+18005551234"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
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
