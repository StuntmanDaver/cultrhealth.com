'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ArrowRight, Shield, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function PortalLoginClient() {
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
        body: JSON.stringify({ email }),
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
    <div className="min-h-screen flex items-center justify-center px-6 grad-dark">
      <div className="w-full max-w-md">

        <ScrollReveal direction="none" duration={800}>
          <div className="text-center mb-8">
            <div className="mb-4">
              <span
                className="font-display font-bold uppercase text-white text-3xl tracking-wide"
                style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
              >
                CULTR
              </span>
              <span className="block font-display font-medium tracking-[0.12em] uppercase text-white/60 text-xs">
                Health
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              Change the CULTR
            </h1>
            <p className="text-white/70 text-lg">Access your portal</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200} direction="none" duration={800}>
          <div className="bg-white rounded-2xl p-8 shadow-xl">

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
                    autoComplete="email"
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

            <div className="mt-6 pt-6 border-t border-stone-100 text-center">
              <p className="text-sm text-cultr-textMuted">
                Not a member?{' '}
                <Link href="/pricing" className="text-cultr-forest font-medium hover:underline">
                  Join <span className="font-display font-bold">CULTR</span>
                </Link>
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400} direction="none" duration={800}>
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm mt-6">
            <Shield className="w-4 h-4" />
            <span>HIPAA-compliant secure access</span>
          </div>
        </ScrollReveal>

      </div>
    </div>
  )
}
