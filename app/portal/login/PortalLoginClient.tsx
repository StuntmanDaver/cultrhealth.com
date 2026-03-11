'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp'
import Button from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Phone, Shield, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

// ===========================================
// TYPES
// ===========================================

type Step = 'phone' | 'otp' | 'support'

// ===========================================
// HELPERS
// ===========================================

function formatUSPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const last4 = digits.slice(-4)
  return `*** *** ${last4}`
}

// ===========================================
// OTP SLOT COMPONENT
// ===========================================

function OTPSlot({ char, isActive, hasFakeCaret }: { char: string | null; isActive: boolean; hasFakeCaret: boolean }) {
  return (
    <div
      className={`
        relative w-14 h-16 border-2 rounded-xl flex items-center justify-center
        text-3xl font-bold text-white bg-white/10 transition-all duration-200
        ${isActive ? 'border-cultr-sage ring-2 ring-cultr-sage/30' : 'border-white/20'}
      `}
    >
      {char}
      {hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-6 bg-cultr-sage animate-pulse" />
        </div>
      )}
    </div>
  )
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function PortalLoginClient() {
  const router = useRouter()

  // State
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [phoneE164, setPhoneE164] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  // Refs
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ===========================================
  // COUNTDOWN TIMER
  // ===========================================

  const startCountdown = useCallback(() => {
    setResendCountdown(30)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  // ===========================================
  // PHONE SUBMIT
  // ===========================================

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit US phone number.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/portal/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setPhoneE164(data.phone)
        setStep('otp')
        startCountdown()
      } else {
        setError(data.error || 'Failed to send verification code.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ===========================================
  // OTP VERIFY
  // ===========================================

  const handleVerify = useCallback(async (code: string) => {
    if (code.length !== 6) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/portal/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneE164, code }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        if (data.hasPatient) {
          router.push(data.redirect || '/portal/dashboard')
        } else if (data.knownPhone) {
          router.push(data.redirect || '/intake')
        } else {
          setStep('support')
        }
      } else if (res.status === 401) {
        setError(data.error || 'Invalid or expired code. Please try again.')
        setOtp('')
      } else if (res.status === 429) {
        setError('Too many attempts. Please wait a few minutes.')
        setOtp('')
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setOtp('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }, [phoneE164, router])

  // ===========================================
  // RESEND OTP
  // ===========================================

  const handleResend = async () => {
    if (resendCountdown > 0) return

    setError('')
    try {
      const digits = phone.replace(/\D/g, '')
      const res = await fetch('/api/portal/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        startCountdown()
      } else {
        setError(data.error || 'Failed to resend code.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  // ===========================================
  // NAVIGATION
  // ===========================================

  const goBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setError('')
  }

  const resetAll = () => {
    setStep('phone')
    setPhone('')
    setPhoneE164('')
    setOtp('')
    setError('')
    setResendCountdown(0)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  // Clear error when user starts typing
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setPhone(formatUSPhone(e.target.value))
  }

  const handleOtpChange = (value: string) => {
    setError('')
    setOtp(value)
  }

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="min-h-screen flex items-center justify-center px-6 grad-dark">
      <div className="max-w-lg w-full relative overflow-hidden">

        {/* ── PHONE STEP ── */}
        <div
          className={`
            transition-all duration-300 ease-out
            ${step === 'phone'
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
            }
          `}
        >
          <div className="text-center">
            <ScrollReveal direction="none" duration={800}>
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
                <Phone className="w-10 h-10 text-white" />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100} direction="none" duration={800}>
              <div className="mb-2">
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
            </ScrollReveal>

            <ScrollReveal delay={200} direction="none" duration={800}>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
                Change the CULTR
              </h1>
              <p className="text-white/70 text-lg mb-12">Access your portal</p>
            </ScrollReveal>

            <ScrollReveal delay={400} direction="none" duration={800}>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    className="w-full pl-14 pr-5 py-5 bg-white/10 border border-white/20 rounded-xl text-lg text-white placeholder:text-white/40 focus:outline-none focus:border-cultr-sage focus:ring-1 focus:ring-cultr-sage transition-colors"
                    data-testid="phone-input"
                  />
                </div>

                {error && step === 'phone' && (
                  <div className="flex items-center gap-2 text-red-300 text-sm" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading || phone.replace(/\D/g, '').length < 10}
                >
                  Continue
                </Button>
              </form>
            </ScrollReveal>

            <ScrollReveal delay={600} direction="none" duration={800}>
              <div className="flex items-center justify-center gap-2 text-white/50 text-sm mt-8">
                <Shield className="w-4 h-4" />
                <span>HIPAA-compliant secure access</span>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* ── OTP STEP ── */}
        <div
          className={`
            transition-all duration-300 ease-out
            ${step === 'otp'
              ? 'opacity-100 translate-x-0'
              : step === 'phone'
                ? 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
                : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
            }
          `}
        >
          <div className="text-center">
            <button
              onClick={goBackToPhone}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 mx-auto"
              type="button"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
              Enter verification code
            </h2>
            <p className="text-white/60 text-base mb-8">
              We sent a 6-digit code to{' '}
              <span className="text-white/80 font-medium">{maskPhone(phoneE164 || phone)}</span>
            </p>

            <div className="flex justify-center mb-4">
              <OTPInput
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={handleOtpChange}
                onComplete={handleVerify}
                data-testid="otp-input"
                render={({ slots }) => (
                  <div className="flex gap-2">
                    {slots.map((slot, i) => (
                      <OTPSlot
                        key={i}
                        char={slot.char}
                        isActive={slot.isActive}
                        hasFakeCaret={slot.hasFakeCaret}
                      />
                    ))}
                  </div>
                )}
              />
            </div>

            {isLoading && (
              <p className="text-white/60 text-sm mb-4">Verifying...</p>
            )}

            {error && step === 'otp' && (
              <div className="flex items-center justify-center gap-2 text-red-300 text-sm mb-4" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6">
              {resendCountdown > 0 ? (
                <p className="text-white/40 text-sm">
                  Didn&apos;t get it? Resend in {resendCountdown}s
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-cultr-sage text-sm font-medium hover:text-cultr-sage/80 transition-colors"
                  type="button"
                  data-testid="resend-button"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── SUPPORT MESSAGE STEP ── */}
        <div
          className={`
            transition-all duration-300 ease-out
            ${step === 'support'
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
            }
          `}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-cultr-sage/20 flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-8 h-8 text-cultr-sage" />
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
              Phone verified
            </h2>
            <p className="text-white/70 mb-6 max-w-sm mx-auto">
              We verified your phone but couldn&apos;t find your medical record. Contact support to link your account.
            </p>

            <a
              href="mailto:support@cultrhealth.com"
              className="text-cultr-sage underline underline-offset-4 hover:text-cultr-sage/80 transition-colors font-medium"
            >
              support@cultrhealth.com
            </a>

            <div className="mt-8">
              <button
                onClick={resetAll}
                className="text-white/60 text-sm hover:text-white transition-colors font-medium"
                type="button"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
