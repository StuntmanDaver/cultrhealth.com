'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Megaphone } from 'lucide-react'

function ApplyForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [bio, setBio] = useState('')
  const [recruiterCode, setRecruiterCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)

  const searchParams = useSearchParams()
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setRecruiterCode(ref)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/creators/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          social_handle: socialHandle,
          bio,
          recruiter_code: recruiterCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      if (data.autoApproved) {
        setAutoApproved(true)
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] grad-light flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-cultr-forest mb-3">
            {autoApproved ? 'You\'re Approved!' : 'Application Submitted'}
          </h1>
          <p className="text-cultr-textMuted mb-2">
            {autoApproved
              ? 'Your creator account is active. Log in to access your dashboard, tracking links, and coupon codes.'
              : 'Check your email to verify your address. Once verified, our team will review your application within 48 hours.'}
          </p>
          {!autoApproved && (
            <p className="text-sm text-cultr-textMuted mb-6">
              You&apos;ll receive an email when your application is approved with your tracking link and coupon code.
            </p>
          )}
          <Link
            href={autoApproved ? '/creators/login' : '/creators'}
            className="inline-flex items-center gap-2 px-6 py-3 grad-dark text-white rounded-full text-sm font-medium hover:opacity-90 transition-all"
          >
            {autoApproved ? 'Log In to Dashboard' : 'Back to Creator Program'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grad-light py-16 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 grad-mint px-4 py-2 rounded-full mb-4">
            <Megaphone className="w-4 h-4 text-cultr-forest" />
            <span className="text-sm font-medium text-cultr-forest">Creator Application</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-cultr-forest mb-3">
            Join the <span className="">CULTR</span> Creator Program
          </h1>
          <p className="text-cultr-textMuted">
            Earn 10% commission on every referral. We review applications within 48 hours.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">
              Social Handle
            </label>
            <input
              type="text"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
              placeholder="@yourhandle (Instagram, TikTok, YouTube)"
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">
              Tell us about your audience
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Platform, niche, audience size, content style..."
              rows={3}
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">
              Referral Code (optional)
            </label>
            <input
              type="text"
              value={recruiterCode}
              onChange={(e) => setRecruiterCode(e.target.value)}
              placeholder="If another creator referred you"
              className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 grad-dark text-white rounded-full text-sm font-medium hover:bg-cultr-forestDark transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : (
              <>Submit Application <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-xs text-cultr-textMuted text-center">
            By applying, you agree to <span className="font-display font-bold">CULTR</span> Health&apos;s creator program terms.
          </p>
        </form>
      </div>
    </div>
  )
}

export default function CreatorApplyPage() {
  return (
    <Suspense>
      <ApplyForm />
    </Suspense>
  )
}
