import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import IntakeViewerClient from './IntakeViewerClient'

export const metadata = {
  title: 'Intake Submissions — CULTR Admin',
  description: 'View patient intake form submissions',
}

export default async function IntakesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/admin/intakes')
  }

  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)

  if (!isAdmin) {
    redirect('/')
  }

  return <IntakeViewerClient />
}
