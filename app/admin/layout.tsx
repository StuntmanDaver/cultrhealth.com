import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession, isProviderEmail } from '@/lib/auth'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const cookieStore = await cookies()
  const adminReturnToken = cookieStore.get('cultr_admin_return_v2')?.value

  if (!session) {
    // If the session was wiped by "Login As" impersonation, restore admin access seamlessly
    if (adminReturnToken) {
      redirect('/api/admin/restore-session?redirect=/admin')
    }
    redirect('/login?redirect=/admin')
  }

  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email) || session.role === 'admin'

  if (!isAdmin) {
    // Current session belongs to a creator (from "Login As"). Restore admin access if possible.
    if (adminReturnToken) {
      redirect('/api/admin/restore-session?redirect=/admin')
    }
    redirect('/login?redirect=/admin&error=access_denied')
  }

  return (
    <AdminLayoutClient email={session.email}>
      {children}
    </AdminLayoutClient>
  )
}
