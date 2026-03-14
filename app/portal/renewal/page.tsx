import type { Metadata } from 'next'
import PortalRenewalClient from './PortalRenewalClient'

export const metadata: Metadata = {
  title: 'Renew Prescription | CULTR Health Portal',
  description: 'Renew your prescription with pre-filled information.',
}

export default function PortalRenewalPage() {
  return <PortalRenewalClient />
}
