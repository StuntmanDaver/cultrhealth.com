import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/admin')
  }

  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email) || session.role === 'admin'

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <AdminLayoutClient email={session.email}>
      {children}
    </AdminLayoutClient>
  )
}
