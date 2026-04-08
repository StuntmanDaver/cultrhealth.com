import { Metadata } from 'next'
import StackingClient from './StackingClient'

export const metadata: Metadata = {
  title: 'Stacking Guides | CULTR Health Portal',
}

export default function PortalStackingPage() {
  return <StackingClient />
}
