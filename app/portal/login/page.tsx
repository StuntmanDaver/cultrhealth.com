import type { Metadata } from 'next'
import PortalLoginClient from './PortalLoginClient'

export const metadata: Metadata = {
  title: 'Member Login | CULTR Health',
  description: 'Log in to your CULTR Health portal with your phone number.',
}

export default function PortalLoginPage() {
  return <PortalLoginClient />
}
