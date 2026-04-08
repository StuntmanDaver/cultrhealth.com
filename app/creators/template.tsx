'use client'

import { PageTransition } from '@/components/ui/PageTransition'

export default function CreatorsTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
