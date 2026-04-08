'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

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
      <div className="min-h-[80vh] grad-dark flex items-center justify-center">
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
        // Staging/dev mode: auto-redirect if URL is returned
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
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
    <div className="min-h-[80vh] grad-dark flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="mb-6 text-center">
            <Image
              src="/cultr-health-logo.png"
              alt="CULTR Health"
              width={220}
              height={79}
              priority
              className="mx-auto mb-6 h-11 md:h-12 w-auto"
            />
            <h1 className="text-2xl font-display font-bold text-cultr-forest mb-2">Creator Portal</h1>
            <p className="text-sm text-cultr-textMuted">
              Use your email to receive a secure sign-in link.
            </p>
          </div>

          {/* Error from redirect */}
          {errorParam && ERROR_MESSAGES[errorParam] && status === 'idle' && (
            <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{ERROR_MESSAGES[errorParam]}</p>
            </div>
          )}

          {status === 'success' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-2.5 p-4 bg-cultr-mint/30 border border-cultr-sage rounded-xl">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-5 h-5 text-cultr-forest mt-0.5 flex-shrink-0" />
                </motion.div>
                <div>
                  <p className="text-sm text-cultr-forest font-medium">Check your email</p>
                  <p className="text-sm text-cultr-forest/80 mt-1">{message}</p>
                </div>
              </div>

              {/* Dev mode redirect */}
              {redirectUrl && (
                <a
                  href={redirectUrl}
                  className="block w-full text-center px-4 py-3 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors"
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
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit} className="space-y-4"
            >
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-cultr-forest/70 mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="text"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white border border-cultr-sage/40 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-stone-400 focus:outline-none focus:border-cultr-forest focus:ring-2 focus:ring-cultr-forest/10 transition-shadow duration-200"
                />
              </div>

              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{message}</p>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
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
              </motion.button>
            </motion.form>
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
