import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProviderConsultationClient } from '../../../provider/consultations/[id]/ProviderConsultationClient'

export default async function LibraryProviderConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()

  if (!session) redirect('/login')
  if (!isProviderEmail(session.email)) redirect('/members')

  const { id } = await params
  return <ProviderConsultationClient consultationId={Number(id)} />
}
