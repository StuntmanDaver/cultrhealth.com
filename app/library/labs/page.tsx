import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LabsPageClient from './LabsPageClient'

export const metadata = { title: 'Labs & Results — CULTR Health' }

export default async function LibraryLabsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <LabsPageClient />
}
