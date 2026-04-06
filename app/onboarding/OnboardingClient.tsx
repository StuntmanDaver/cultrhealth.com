'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Loader2, ArrowRight, TestTube2, ClipboardList, Calendar, PartyPopper } from 'lucide-react'
import { LINKS } from '@/lib/config/links'

interface OnboardingStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  complete: boolean
  active: boolean
  href?: string
}

export default function OnboardingClient({ email }: { email: string }) {
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<OnboardingStep[]>([])

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/onboarding/status')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            buildSteps(data.onboarding)
            setLoading(false)
            return
          }
        }
      } catch { /* fallback to defaults */ }

      // Default steps if API not ready
      buildSteps({
        step: 'welcome',
        blood_test_ordered: false,
        intake_completed: false,
        appointment_scheduled: false,
      })
      setLoading(false)
    }
    fetchStatus()
  }, [])

  function buildSteps(data: {
    step: string
    blood_test_ordered: boolean
    intake_completed: boolean
    appointment_scheduled: boolean
  }) {
    const activeStepId = data.appointment_scheduled
      ? 'complete'
      : !data.blood_test_ordered
        ? 'blood-test'
        : !data.intake_completed
          ? 'intake'
          : 'schedule'

    setSteps([
      {
        id: 'welcome',
        label: 'Welcome',
        description: 'Your membership is active.',
        icon: <Check className="w-5 h-5" />,
        complete: true,
        active: false,
      },
      {
        id: 'blood-test',
        label: 'Blood Test Kit',
        description: data.blood_test_ordered
          ? 'Your SiPhox blood test kit has been ordered.'
          : 'Order your at-home blood test kit to establish your baseline.',
        icon: <TestTube2 className="w-5 h-5" />,
        complete: data.blood_test_ordered,
        active: activeStepId === 'blood-test',
        href: LINKS.members,
      },
      {
        id: 'intake',
        label: 'Medical Intake',
        description: data.intake_completed
          ? 'Your medical intake form is complete.'
          : 'Complete your health questionnaire so your provider can review your history.',
        icon: <ClipboardList className="w-5 h-5" />,
        complete: data.intake_completed,
        active: activeStepId === 'intake',
        href: LINKS.intake,
      },
      {
        id: 'schedule',
        label: 'Schedule Visit',
        description: data.appointment_scheduled
          ? 'Your appointment is confirmed.'
          : 'Book your first telehealth consultation with a CULTR Health provider.',
        icon: <Calendar className="w-5 h-5" />,
        complete: data.appointment_scheduled,
        active: activeStepId === 'schedule',
        href: LINKS.memberConsultations,
      },
      {
        id: 'complete',
        label: "You're All Set",
        description: "Your onboarding is complete. Welcome to CULTR Health.",
        icon: <PartyPopper className="w-5 h-5" />,
        complete: data.appointment_scheduled,
        active: activeStepId === 'complete',
        href: LINKS.members,
      },
    ])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary/40" />
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-2 text-center">
            Welcome to CULTR Health
          </h1>
          <p className="text-cultr-textMuted text-center mb-12">
            Complete these steps to start your personalized protocol.
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`
                  flex items-start gap-4 p-5 rounded-2xl border transition-all
                  ${step.active
                    ? 'border-brand-primary bg-white shadow-sm'
                    : step.complete
                      ? 'border-cultr-sage/60 bg-cultr-mint/20'
                      : 'border-cultr-sage/40 bg-white/50 opacity-60'
                  }
                `}
              >
                {/* Step indicator */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  ${step.complete
                    ? 'bg-brand-primary text-white'
                    : step.active
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'bg-cultr-sage/30 text-cultr-textMuted'
                  }
                `}>
                  {step.complete ? <Check className="w-5 h-5" /> : step.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-brand-primary text-lg">
                    {step.label}
                  </h3>
                  <p className="text-sm text-cultr-textMuted mt-0.5">
                    {step.description}
                  </p>

                  {step.active && step.href && !step.complete && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Help */}
          <p className="text-center text-sm text-cultr-textMuted mt-10">
            Questions? Contact{' '}
            <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">
              support@cultrhealth.com
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
