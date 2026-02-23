import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { CheckCircle, ArrowRight, Clock, Mail, ShoppingCart } from 'lucide-react'

export const metadata = {
  title: 'Quote Submitted | CULTR Health',
  description: 'Your quote request has been submitted successfully.',
}

export default async function QuoteSuccessPage() {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId, session.email)

  // Check if user has access (Core+ tier — requires advancedProtocols)
  if (!hasFeatureAccess(tier, 'advancedProtocols')) {
    redirect('/pricing?upgrade=core')
  }

  return (
    <div className="min-h-screen grad-light">
      {/* Header */}
      <header className="grad-dark text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/library"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            ← Back to Library
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-cultr-text mb-4">
            Quote Request Submitted!
          </h1>
          <p className="text-cultr-textMuted text-lg">
            Thank you for your request. Our team will review your order and get back to you shortly.
          </p>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-2xl border border-cultr-sage p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-cultr-text mb-4">
            What Happens Next
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 grad-mint rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-cultr-forest" />
              </div>
              <div>
                <h3 className="font-bold text-cultr-text">Review Period</h3>
                <p className="text-cultr-textMuted text-sm">
                  Our team will review your request within 24-48 business hours.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 grad-mint rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-cultr-forest" />
              </div>
              <div>
                <h3 className="font-bold text-cultr-text">Pricing Email</h3>
                <p className="text-cultr-textMuted text-sm">
                  You&apos;ll receive an email at <strong>{session.email}</strong> with your personalized quote and pricing details.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 grad-mint rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-cultr-forest" />
              </div>
              <div>
                <h3 className="font-bold text-cultr-text">Confirm & Purchase</h3>
                <p className="text-cultr-textMuted text-sm">
                  Once you approve the quote, we&apos;ll process your order and coordinate with your provider for any required prescriptions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/library/shop"
            className="flex items-center justify-center gap-2 px-6 py-3 grad-dark text-white font-bold rounded-lg hover:bg-cultr-forest/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Continue Shopping
          </Link>
          <Link
            href="/library"
            className="flex items-center justify-center gap-2 px-6 py-3 grad-white border border-cultr-sage text-cultr-text font-bold rounded-lg hover:grad-light transition-colors"
          >
            Back to Library
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 p-4 grad-mint border border-cultr-sage rounded-xl text-center">
          <p className="text-sm text-cultr-textMuted">
            <strong className="text-cultr-text">Questions?</strong> Contact us at{' '}
            <a href="mailto:support@cultrhealth.com" className="text-cultr-forest underline">
              support@cultrhealth.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
