import type { Metadata } from 'next'
import PortalIntakeClient from './PortalIntakeClient'

export const metadata: Metadata = {
  title: 'Start Intake | CULTR Health Portal',
  description: 'Complete your medical intake with pre-filled information from your profile.',
}

export default function PortalIntakePage() {
  return <PortalIntakeClient />
}
