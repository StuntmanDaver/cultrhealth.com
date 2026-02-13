import { getLibraryAccess, getMembershipTier, getSession } from '@/lib/auth'
import { LibraryLogin } from './LibraryLogin'
import { LibraryContent } from './LibraryContent'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  try {
    const session = await getSession()
    if (!session) {
      return <LibraryLogin error={error} />
    }

    const tier = await getMembershipTier(session.customerId)
    const libraryAccess = getLibraryAccess(tier)

    return <LibraryContent email={session.email} tier={tier} libraryAccess={libraryAccess} />
  } catch (e) {
    console.error('Library page error:', e)
    return <LibraryLogin error={error || 'verification_failed'} />
  }
}
