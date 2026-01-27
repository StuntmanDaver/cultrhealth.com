'use client'

import { useState, useRef } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { waitlistSchema, type WaitlistFormData } from '@/lib/validation'

type FormErrors = Partial<Record<keyof WaitlistFormData, string>>

interface WaitlistFormProps {
  onSuccess?: (data: WaitlistFormData) => void
}

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [formData, setFormData] = useState<WaitlistFormData>({
    name: '',
    email: '',
    phone: '',
    social_handle: '',
    treatment_reason: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof WaitlistFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validate with Zod
    const result = waitlistSchema.safeParse(formData)
    
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof WaitlistFormData
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result.data,
          turnstileToken: turnstileToken || 'pending-setup',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        throw new Error(data.error || 'Something went wrong')
      }

      setShowPopup(true)
      onSuccess?.(result.data)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const closePopup = () => {
    setShowPopup(false)
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      social_handle: '',
      treatment_reason: '',
    })
  }

  return (
    <>
      {/* Success Popup */}
      {showPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={closePopup}
        >
          <div 
            className="bg-cultr-charcoal border border-cultr-lightgray/20 rounded-lg p-8 md:p-12 max-w-md w-full text-center animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-cultr-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-light tracking-wide uppercase mb-4 text-white">
              Thank You
            </h3>
            <p className="text-neutral-400 text-base tracking-wide mb-8">
              You&apos;re on the list! We&apos;ll be in touch soon with exclusive updates.
            </p>
            <button
              onClick={closePopup}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className={`input-luxury ${errors.name ? 'error' : ''}`}
            disabled={isSubmitting}
            autoComplete="name"
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className={`input-luxury ${errors.email ? 'error' : ''}`}
            disabled={isSubmitting}
            autoComplete="email"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className={`input-luxury ${errors.phone ? 'error' : ''}`}
            disabled={isSubmitting}
            autoComplete="tel"
          />
          {errors.phone && <p className="error-message">{errors.phone}</p>}
        </div>

        {/* Social Handle */}
        <div>
          <input
            type="text"
            name="social_handle"
            value={formData.social_handle}
            onChange={handleChange}
            placeholder="Social Handle (optional)"
            className={`input-luxury ${errors.social_handle ? 'error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.social_handle && <p className="error-message">{errors.social_handle}</p>}
        </div>

        {/* Treatment Reason */}
        <div>
          <textarea
            name="treatment_reason"
            value={formData.treatment_reason}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, treatment_reason: e.target.value }))
              if (errors.treatment_reason) {
                setErrors((prev) => ({ ...prev, treatment_reason: undefined }))
              }
            }}
            placeholder="Why do you want treatment? (optional)"
            className={`input-luxury resize-none min-h-[100px] ${errors.treatment_reason ? 'error' : ''}`}
            disabled={isSubmitting}
            rows={3}
          />
          {errors.treatment_reason && <p className="error-message">{errors.treatment_reason}</p>}
        </div>

        {/* Turnstile Widget - only show if configured */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center pt-2">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => {
                setTurnstileToken(null)
                setSubmitError('Verification failed. Please try again.')
              }}
              onExpire={() => {
                setTurnstileToken(null)
              }}
              options={{
                theme: 'dark',
              }}
            />
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="text-red-400 text-sm text-center py-2">
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Joining...
              </span>
            ) : (
              'Join Waitlist'
            )}
          </button>
        </div>
      </form>
    </>
  )
}
