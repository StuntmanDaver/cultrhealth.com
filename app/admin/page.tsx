import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import AdminDashboardClient from './AdminDashboardClient'

export const metadata = {
  title: 'Admin Dashboard — CULTR Health',
  description: 'Analytics and admin dashboard for CULTR Health',
}

export default async function AdminPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login?redirect=/admin')
  }

  // Check admin access
  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)
  
  if (!isAdmin) {
    redirect('/')
  }

  return <AdminDashboardClient userEmail={session.email} />
}
