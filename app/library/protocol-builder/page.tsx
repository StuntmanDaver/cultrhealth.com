import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProtocolBuilderClient } from '../../provider/protocol-builder/ProtocolBuilderClient'

export const metadata = { title: 'Protocol Builder — CULTR Health' }

export default async function LibraryProtocolBuilderPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (!isProviderEmail(session.email)) redirect('/library')

  return <ProtocolBuilderClient providerEmail={session.email} />
}
