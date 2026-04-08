import { Metadata } from 'next'
import MarketingClient from './MarketingClient'

export const metadata: Metadata = {
  title: 'Marketing — CULTR Admin',
}

export default function MarketingPage() {
  return <MarketingClient />
}
