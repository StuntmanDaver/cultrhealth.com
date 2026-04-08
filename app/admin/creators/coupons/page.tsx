import { Metadata } from 'next'
import CouponsClient from './CouponsClient'

export const metadata: Metadata = {
  title: 'Coupons & Links — CULTR Admin',
}

export default function CouponsPage() {
  return <CouponsClient />
}
