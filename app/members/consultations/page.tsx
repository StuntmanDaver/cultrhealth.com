import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export const metadata = { title: 'Schedule a Consultation — CULTR Health' }

export default async function ConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

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
            <iframe
              title="Schedule Consultation"
              src="https://secure.gethealthie.com/appointments/embed_appt?dietitian_id=13052862&provider_ids=%5B13052862%5D&appt_type_ids=%5B510493,510494,510495%5D&primary_color=4A9625"
              style={{ width: '100%', height: '100%', minHeight: '600px', border: '0px' }}
              allow="camera; microphone; geolocation"
            />
            <div className="p-3 bg-brand-cream/50 border-t border-cultr-sage/30 text-center">
              <p className="text-sm text-cultr-textMuted">
                Booking Provided by{' '}
                <a href="https://gethealthie.com" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">
                  Healthie
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
