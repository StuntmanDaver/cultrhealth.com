import type { Metadata } from 'next'
import LabsClient from './LabsClient'

export const metadata: Metadata = {
  title: 'Labs | CULTR Health',
  description: 'Register your blood test kit and track results.',
}

export default function PortalLabsPage() {
  return <LabsClient />
}
