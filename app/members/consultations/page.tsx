import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { LINKS, getConsultationBookingUrl } from '@/lib/config/links'

export const metadata = { title: 'Schedule a Consultation — CULTR Health' }

export default async function ConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const bookingUrl = getConsultationBookingUrl()

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
            {bookingUrl ? (
              <div className="space-y-5">
                <p className="text-cultr-textMuted">
                  Scheduling happens in Healthie EHR so your appointment details stay in one system of record.
                </p>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-medium text-brand-cream transition-all duration-200 hover:scale-[1.03] hover:bg-brand-primaryHover active:scale-[0.97]"
                >
                  Open Healthie Scheduling
                </a>
                <p className="text-xs text-cultr-textMuted/70">
                  This opens Healthie scheduling in a new tab.
                </p>
                <a
                  href={LINKS.dashboard}
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary/30 px-6 py-3 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/5 hover:border-brand-primary/50"
                >
                  Back to Dashboard
                </a>
              </div>
            ) : (
              <p className="text-cultr-textMuted">
                The Healthie scheduling link is being finalized. Please contact{' '}
                <a href={`mailto:${LINKS.supportEmail}`} className="text-brand-primary underline">
                  {LINKS.supportEmail}
                </a>{' '}
                to book your appointment.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
