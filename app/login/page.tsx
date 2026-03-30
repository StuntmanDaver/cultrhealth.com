'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { LINKS } from '@/lib/config/links'
import { ArrowRight, Shield, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'Invalid or malformed link. Please request a new one.',
  expired_link: 'Your link has expired. Please request a new one.',
  no_subscription: 'No active membership found for this email.',
  verification_failed: 'Verification failed. Please try again.',
  session_timeout: 'Your session timed out. Please log in again.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grad-dark flex items-center justify-center">
        <div className="animate-pulse h-6 w-32 bg-white/20 rounded" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const redirectParam = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirect: redirectParam || undefined }),
      })

      const data = await res.json()

      if (res.ok) {
        // Staging bypass: auto-redirect immediately
        if (data.stagingAccess && data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-1 flex items-center justify-center py-24 px-6 grad-dark">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              Member Login
            </h1>
            <p className="text-white/70">
              Enter your email to access your member library and dashboard.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">

            {/* Error from redirect param */}
            {errorParam && ERROR_MESSAGES[errorParam] && status === 'idle' && (
              <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{ERROR_MESSAGES[errorParam]}</p>
              </div>
            )}

            {status === 'success' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-cultr-mint/30 border border-cultr-sage rounded-xl">
                  <CheckCircle className="w-5 h-5 text-cultr-forest mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-cultr-forest">Check your email</p>
                    <p className="text-sm text-cultr-forest/80 mt-1">
                      If you have an active membership, you&apos;ll receive a login link shortly. It expires in 15 minutes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setStatus('idle'); setEmail('') }}
                  className="w-full text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-cultr-forest/70 mb-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white border border-cultr-sage/40 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-stone-400 focus:outline-none focus:border-cultr-forest focus:ring-2 focus:ring-cultr-forest/10"
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={status === 'loading' || !email}
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</>
                  ) : (
                    <>Send Login Link <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-stone-100 text-center space-y-3">
              <p className="text-sm text-cultr-textMuted">
                Not a member?{' '}
                <Link href="/pricing" className="text-cultr-forest font-medium hover:underline">
                  Join <span className="font-display font-bold">CULTR</span>
                </Link>
              </p>
              <p className="text-xs text-cultr-textMuted">
                <Link href="/creators/login" className="hover:text-cultr-forest transition-colors">
                  Creator login →
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/50 text-sm mt-6">
            <Shield className="w-4 h-4" />
            <span>HIPAA-compliant secure access</span>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 grad-white border-t border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-display font-bold text-cultr-text mb-2">Need help?</h3>
          <p className="text-sm text-cultr-textMuted mb-4">
            If you&apos;re having trouble accessing your account, our support team is here to help.
          </p>
          <a href={`mailto:${LINKS.supportEmail}`} className="text-sm text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium">
            Contact Support →
          </a>
        </div>
      </section>
    </div>
  )
}
