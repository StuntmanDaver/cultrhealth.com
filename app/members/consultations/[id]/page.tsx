import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ConsultationRoomClient } from './ConsultationRoomClient'

export const metadata = { title: 'Consultation — CULTR Health' }

export default async function ConsultationRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  return <ConsultationRoomClient consultationId={Number(id)} />
}
