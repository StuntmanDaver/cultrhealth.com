import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, ArrowRight, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Renewal Submitted | CULTR Health',
  description: 'Your renewal request has been submitted successfully.',
};

export default function RenewalSuccessPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 text-purple-600" />
          </div>

          <h1 className="text-2xl font-display font-bold text-stone-900 mb-2">
            Renewal Request Submitted!
          </h1>

          <p className="text-stone-600 mb-8">
            Your renewal request is being processed. We'll notify you once it's been reviewed.
          </p>

          {/* Status */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            Processing
          </div>

          {/* Timeline */}
          <div className="bg-stone-50 rounded-2xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-stone-900 mb-4">What's next?</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-stone-600">Request submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-stone-300 rounded-full" />
                <span className="text-sm text-stone-600">Provider review (24-48 hours)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-stone-300 rounded-full" />
                <span className="text-sm text-stone-600">Prescription sent to pharmacy</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-stone-300 rounded-full" />
                <span className="text-sm text-stone-600">Medication shipped to you</span>
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
