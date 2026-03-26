import { Metadata } from 'next'
import OrdersClient from './OrdersClient'

export const metadata: Metadata = {
  title: 'Orders — CULTR Admin',
}

export default function OrdersPage() {
  return <OrdersClient />
}
