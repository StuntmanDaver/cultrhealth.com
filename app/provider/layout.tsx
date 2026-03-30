import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProviderLayoutClient } from '@/components/provider/ProviderLayoutClient'

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/provider')
  }

  if (!isProviderEmail(session.email)) {
    redirect('/')
  }

  return (
    <ProviderLayoutClient email={session.email}>
      {children}
    </ProviderLayoutClient>
  )
}
