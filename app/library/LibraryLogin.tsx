'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Mail, AlertCircle, CheckCircle, Lock, Shield } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'Invalid or malformed link. Please request a new one.',
  expired_link: 'Your link has expired. Please request a new one.',
  no_subscription: 'No active subscription found. Please join CULTR to access the library.',
  verification_failed: 'Verification failed. Please try again.',
}

export function LibraryLogin({ error }: { error?: string }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFormError(data.error || 'Something went wrong')
        return
      }

      // Handle staging access - redirect immediately
      if (data.stagingAccess && data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      setSuccess(true)
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const errorMessage = error ? ERROR_MESSAGES[error] || 'An error occurred' : null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-24 px-6 bg-cultr-forest text-white">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-cultr-sage" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">
            Member Library
          </h1>
          <p className="text-white/80">
            Access your peptide reference library with detailed protocols, mechanisms, and safety information.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="flex-1 py-12 px-6 bg-white">
        <div className="max-w-md mx-auto">
          {/* Error from URL params */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {success ? (
            /* Success State */
            <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-cultr-mint rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-cultr-forest" />
              </div>
              <h2 className="text-xl font-display font-bold text-cultr-forest mb-3">Check Your Email</h2>
              <p className="text-cultr-textMuted mb-6">
                If you have an active CULTR membership, you&apos;ll receive a link to access the library. The link expires in 15 minutes.
              </p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="text-cultr-forest hover:text-cultr-forestDark transition-colors text-sm font-medium"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Login Form */
            <div className="bg-cultr-offwhite border border-cultr-sage rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-cultr-text mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cultr-textMuted" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-cultr-sage rounded-xl text-cultr-text placeholder-cultr-textMuted focus:outline-none focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 transition-colors"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{formError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Sending...' : 'Send Access Link'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-cultr-sage text-center">
                <p className="text-cultr-textMuted text-sm">
                  Not a member?{' '}
                  <Link href="/pricing" className="text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium">
                    Join CULTR
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-cultr-textMuted text-sm">
            <Shield className="w-4 h-4" />
            <span>Secure access verified via Stripe</span>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center">
            <p className="text-cultr-textMuted text-xs">
              Library access is included with all CULTR memberships.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
