import { Metadata } from 'next'
import CreatorsClient from './CreatorsClient'

export const metadata: Metadata = {
  title: 'Creator Network — CULTR Admin',
}

export default function CreatorsPage() {
  return <CreatorsClient />
}
