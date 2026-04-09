'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Mail, AlertCircle, CheckCircle, Lock, Shield } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'Invalid or malformed link. Please request a new one.',
  expired_link: 'Your link has expired. Please request a new one.',
  no_subscription: 'No active subscription found. Please join to access the library.',
  verification_failed: 'Verification failed. Please try again.',
  session_timeout: 'Your session timed out. Please log in again.',
}

export function LibraryLogin({ error }: { error?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsLoading(true)

    const queryString = searchParams.toString()
    const currentPath = pathname + (queryString ? `?${queryString}` : '')

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirect: currentPath }),
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[2rem] shadow-xl shadow-brand-primary/5 overflow-hidden border border-brand-primary/10">
        
        {/* Left Side: Brand & Info */}
        <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 bg-brand-primary text-white relative overflow-hidden">
          {/* Decorative aura */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sage/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-forest-dark/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          
          <div className="relative z-10">
            <ScrollReveal direction="up" duration={800}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 border border-white/20">
                <Lock className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium">Members Only</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight">
                Member Library
              </h1>
              <p className="text-lg text-white/80 leading-relaxed max-w-md">
                Access your peptide reference library with detailed protocols, mechanisms, and safety information.
              </p>
            </ScrollReveal>
          </div>
          
          <div className="relative z-10">
            <ScrollReveal delay={200} direction="up" duration={800}>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Shield className="w-5 h-5" />
                <span>Secure access verified via Stripe</span>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile Header (hidden on desktop) */}
            <div className="lg:hidden text-center mb-8">
              <ScrollReveal direction="up" duration={800}>
                <div className="inline-flex items-center gap-2 bg-sage/20 text-brand-primary rounded-full px-4 py-1.5 mb-5 border border-sage/30">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Members Only</span>
                </div>
                <h1 className="text-3xl font-display font-bold text-brand-primary mb-3">
                  Member Library
                </h1>
                <p className="text-brand-primary/60 text-sm">
                  Access your reference library and protocols.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={100} direction="up" duration={800}>
              {/* Error from URL params */}
              {errorMessage && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              )}

              {success ? (
                /* Success State */
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-mint/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-brand-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-brand-primary mb-4">Check Your Email</h2>
                  <p className="text-brand-primary/60 mb-8 leading-relaxed text-sm">
                    If you have an active membership, you&apos;ll receive a link to access the library. The link expires in 15 minutes.
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="text-brand-primary hover:text-forest-light transition-colors text-sm font-medium underline underline-offset-4"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                /* Login Form */
                <div>
                  <h2 className="text-2xl font-display font-bold text-brand-primary mb-6 hidden lg:block">
                    Sign In
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-brand-primary">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary/40" />
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-brand-cream/30 border border-brand-primary/10 rounded-2xl text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                        <p className="text-red-600 text-sm">{formError}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full py-6 text-base shadow-sm"
                      size="lg"
                    >
                      {isLoading ? 'Sending Link...' : 'Send Access Link'}
                    </Button>
                  </form>

                  <div className="mt-8 pt-8 border-t border-brand-primary/10 text-center">
                    <p className="text-brand-primary/60 text-sm">
                      Not a member?{' '}
                      <Link href="/pricing" className="text-brand-primary hover:text-forest-light transition-colors font-medium">
                        Join <span className="font-display font-bold">CULTR</span>
                      </Link>
                    </p>
                  </div>
                </div>
              )}
              
              {/* Mobile Trust Badge */}
              <div className="mt-8 flex flex-col items-center gap-2 lg:hidden text-center">
                <div className="flex items-center justify-center gap-2 text-brand-primary/40 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secure access verified via Stripe</span>
                </div>
                <p className="text-brand-primary/40 text-xs">
                  Library access is included with all CULTR memberships.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  )
}
