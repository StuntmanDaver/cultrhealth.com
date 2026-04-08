import { Suspense } from 'react'
import { Metadata } from 'next'
import OrdersClient from './OrdersClient'

export const metadata: Metadata = {
  title: 'Orders — CULTR Admin',
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Orders</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
        </div>
      </div>
    }>
      <OrdersClient />
    </Suspense>
  )
}
