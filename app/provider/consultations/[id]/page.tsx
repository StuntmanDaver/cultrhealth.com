import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProviderConsultationClient } from './ProviderConsultationClient'

export default async function ProviderConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!isProviderEmail(session.email)) redirect('/library')

  const { id } = await params
  return <ProviderConsultationClient consultationId={Number(id)} />
}
