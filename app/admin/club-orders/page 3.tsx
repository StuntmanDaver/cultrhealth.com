import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import ClubOrdersClient from './ClubOrdersClient'

export const metadata = {
  title: 'Club Orders — CULTR Admin',
  description: 'Manage CULTR Club orders and approvals',
}

export default async function ClubOrdersPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/admin/club-orders')
  }

  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)

  if (!isAdmin) {
    redirect('/')
  }

  return <ClubOrdersClient />
}
