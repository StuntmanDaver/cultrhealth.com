import { getSession } from '@/lib/auth'
import { ProtocolBuilderClient } from './ProtocolBuilderClient'

export default async function ProtocolBuilderPage() {
  const session = await getSession()
  return <ProtocolBuilderClient providerEmail={session!.email} />
}
