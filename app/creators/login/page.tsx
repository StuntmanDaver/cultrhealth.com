'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'Invalid login link. Please request a new one.',
  expired_link: 'Your login link has expired. Please request a new one.',
  no_account: 'No creator account found for this email. Apply to become a creator first.',
  inactive_account: 'Your creator account is not currently active. Contact creators@cultrhealth.com for help.',
  verification_failed: 'Login verification failed. Please try again.',
}

export default function CreatorLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cultr-forest flex items-center justify-center">
        <div className="animate-pulse h-6 w-32 bg-white/20 rounded" />
      </div>
    }>
      <CreatorLoginForm />
    </Suspense>
  )
}

function CreatorLoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/creators/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        // Dev mode: auto-redirect if URL is returned
        if (data.redirectUrl) {
          setRedirectUrl(data.redirectUrl)
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-cultr-forest flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-display font-bold text-white">
            CULTR <span className="text-sm font-body font-normal text-white/50">Creator</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-display font-bold text-cultr-forest mb-2">Creator Login</h1>
          <p className="text-sm text-cultr-textMuted mb-6">
            Enter your email to receive a login link for your creator portal.
          </p>

          {/* Error from redirect */}
          {errorParam && ERROR_MESSAGES[errorParam] && status === 'idle' && (
            <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{ERROR_MESSAGES[errorParam]}</p>
            </div>
          )}

          {status === 'success' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-emerald-800 font-medium">Check your email</p>
                  <p className="text-sm text-emerald-700 mt-1">{message}</p>
                </div>
              </div>

              {/* Dev mode redirect */}
              {redirectUrl && (
                <a
                  href={redirectUrl}
                  className="block w-full text-center px-4 py-3 bg-cultr-forest text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors"
                >
                  Open Portal (Dev Mode)
                </a>
              )}

              <button
                onClick={() => {
                  setStatus('idle')
                  setMessage('')
                  setRedirectUrl(null)
                }}
                className="w-full text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors"
              >
                Send another link
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
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-stone-400 focus:outline-none focus:border-cultr-forest focus:ring-2 focus:ring-cultr-forest/10"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cultr-forest text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Login Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-stone-100 text-center space-y-3">
            <p className="text-sm text-cultr-textMuted">
              Don&apos;t have an account?{' '}
              <Link href="/creators/apply" className="text-cultr-forest font-medium hover:underline">
                Apply as a Creator
              </Link>
            </p>
            <p className="text-xs text-cultr-textMuted">
              <Link href="/login" className="hover:text-cultr-forest transition-colors">
                Member login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
