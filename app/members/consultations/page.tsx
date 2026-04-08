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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-4">
            Schedule a Consultation
          </h1>
          <p className="text-cultr-textMuted mb-8">
            Book a visit with your CULTR Health provider.
          </p>

          <div className="bg-white rounded-2xl border border-cultr-sage overflow-hidden shadow-sm">
            {bookingUrl ? (
              <>
                <iframe
                  title="Schedule Consultation"
                  src={bookingUrl}
                  style={{ width: '100%', height: '100%', minHeight: '600px', border: '0px' }}
                  allow="camera; microphone; geolocation"
                />
                <div className="p-3 bg-brand-cream/50 border-t border-cultr-sage/30 text-center flex flex-col sm:flex-row items-center justify-between px-6">
                  <p className="text-sm text-cultr-textMuted">
                    Booking Provided by{' '}
                    <a href="https://gethealthie.com" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">
                      Healthie
                    </a>
                  </p>
                  <a
                    href={LINKS.dashboard}
                    className="inline-flex items-center justify-center rounded-full border border-brand-primary/30 px-4 py-2 mt-3 sm:mt-0 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/5 hover:border-brand-primary/50"
                  >
                    Back to Dashboard
                  </a>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-cultr-textMuted mb-4">
                  The Healthie scheduling link is being finalized. Please contact{' '}
                  <a href={`mailto:${LINKS.supportEmail}`} className="text-brand-primary underline">
                    {LINKS.supportEmail}
                  </a>{' '}
                  to book your appointment.
                </p>
                <a
                  href={LINKS.dashboard}
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary/30 px-6 py-3 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/5 hover:border-brand-primary/50"
                >
                  Back to Dashboard
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
