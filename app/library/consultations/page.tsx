import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { BookingPageClient } from './BookingPageClient'

export const metadata = { title: 'Book a Consultation — CULTR Health' }

export default async function ConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <BookingPageClient email={session.email} />
}
