import { Suspense } from 'react'
import { Metadata } from 'next'
import InventoryClient from './InventoryClient'

export const metadata: Metadata = {
  title: 'Inventory — CULTR Admin',
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Inventory</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl" />)}
        </div>
      </div>
    }>
      <InventoryClient />
    </Suspense>
  )
}
