import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export const metadata = { title: 'Schedule a Consultation — CULTR Health' }

/**
 * Consultations Page — Calendly Embedded Scheduling
 *
 * TODO: Embed Calendly inline widget with tier-based gating once
 * CALENDLY_SCHEDULING_URL is configured. Tier limits are defined in
 * lib/config/plans.ts (consultationsPerMonth): Club=0, Core=1, Catalyst=2, Concierge=Infinity.
 */
export default async function ConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-4">
            Schedule a Consultation
          </h1>
          <p className="text-cultr-textMuted mb-8">
            Book a visit with your CULTR Health provider.
          </p>

          <div className="bg-white rounded-2xl border border-cultr-sage p-8">
            <p className="text-cultr-textMuted">
              Scheduling is being set up. Please check back shortly or contact{' '}
              <a href="mailto:support@cultrhealth.com" className="text-brand-primary underline">
                support@cultrhealth.com
              </a>{' '}
              to book your appointment.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
