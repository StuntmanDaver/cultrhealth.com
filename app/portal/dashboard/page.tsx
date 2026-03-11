import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | CULTR Health',
  description: 'View your order status and manage your CULTR Health membership.',
}

export default function PortalDashboardPage() {
  return <DashboardClient />
}
