import { Metadata } from 'next'
import MembersClient from './MembersClient'

export const metadata: Metadata = {
  title: 'Members — CULTR Admin',
}

export default function MembersPage() {
  return <MembersClient />
}
