import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProtocolBuilderClient } from './ProtocolBuilderClient'

export default async function ProtocolBuilderPage() {
  const session = await getSession()

  if (!session) {
    redirect('/library')
  }

  if (!isProviderEmail(session.email)) {
    return (
      <div className="min-h-screen grad-white">
        <section className="py-16 px-6 grad-dark text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-3">Access Restricted</h1>
            <p className="text-white/80 text-lg">
              This tool is limited to authorized providers.
            </p>
          </div>
        </section>
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl border border-cultr-sage grad-light p-8">
              <p className="text-cultr-text font-medium mb-4">
                If you need access, contact the operations team.
              </p>
              <Link
                href="mailto:support@cultrhealth.com"
                className="inline-flex items-center gap-2 text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return <ProtocolBuilderClient providerEmail={session.email} />
}
