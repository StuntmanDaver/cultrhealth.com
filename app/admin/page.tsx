import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
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

  return <AdminDashboardClient />
}
