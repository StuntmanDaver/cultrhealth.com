import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ConsultationHistoryClient } from './ConsultationHistoryClient'

export const metadata = { title: 'Consultation History — CULTR Health' }

export default async function ConsultationHistoryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <ConsultationHistoryClient />
}
