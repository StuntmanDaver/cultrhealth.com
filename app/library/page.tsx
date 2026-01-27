import { getLibraryAccess, getMembershipTier, getSession } from '@/lib/auth'
import { LibraryLogin } from './LibraryLogin'
import { LibraryContent } from './LibraryContent'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession()
  const params = await searchParams
  const error = params.error

  if (!session) {
    return <LibraryLogin error={error} />
  }

  const tier = await getMembershipTier(session.customerId)
  const libraryAccess = getLibraryAccess(tier)

  return <LibraryContent email={session.email} tier={tier} libraryAccess={libraryAccess} />
}
