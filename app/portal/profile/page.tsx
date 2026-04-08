import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = {
  title: 'Profile | CULTR Health',
  description: 'View and manage your profile information.',
}

export default function PortalProfilePage() {
  return <ProfileClient />
}
