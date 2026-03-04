import Link from 'next/link'
import { Clock, Mail } from 'lucide-react'

export default function CreatorPendingPage() {
  return (
    <div className="min-h-[80vh] grad-light flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest mb-3">
          Application Under Review
        </h1>
        <p className="text-cultr-textMuted mb-6">
          Your creator application is being reviewed by our team. We typically process applications within 48 hours.
        </p>

        <div className="bg-white border border-stone-200 rounded-xl p-5 text-left mb-6">
          <h3 className="font-medium text-cultr-forest text-sm mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-cultr-textMuted">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 grad-mint rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-cultr-forest">1</span>
              Our team reviews your application
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 grad-mint rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-cultr-forest">2</span>
              You&apos;ll receive an email with your approval status
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 grad-mint rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-cultr-forest">3</span>
              Once approved, access your dashboard with tracking links and codes
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="mailto:creators@cultrhealth.com"
            className="flex items-center justify-center gap-2 text-sm text-cultr-forest font-medium hover:underline"
          >
            <Mail className="w-4 h-4" /> Contact us at creators@cultrhealth.com
          </a>
          <Link
            href="/creators"
            className="text-sm text-cultr-textMuted hover:text-cultr-forest"
          >
            Back to Creator Program
          </Link>
        </div>
      </div>
    </div>
  )
}
