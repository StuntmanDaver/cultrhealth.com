import { Metadata } from 'next'
import CustomersClient from './CustomersClient'

export const metadata: Metadata = {
  title: 'Customers — CULTR Admin',
}

export default function CustomersPage() {
  return <CustomersClient />
}
