import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { AdminConsultationsClient } from './AdminConsultationsClient'

export const metadata = { title: 'Consultations — Admin' }

export default async function AdminConsultationsPage() {
  const session = await getSession()
  if (!session || !isProviderEmail(session.email)) redirect('/admin')

  return <AdminConsultationsClient />
}
