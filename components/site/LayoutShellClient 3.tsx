'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

const HIDE_CHROME_PREFIXES = ['/creators/portal', '/admin', '/join-club']

export function LayoutShellClient({
  header,
  footer,
  children,
}: {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()
  const hideChrome = HIDE_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <>
      {!hideChrome && header}
      <main className={hideChrome ? 'min-h-screen' : 'pt-20 min-h-[calc(100vh-80px)]'}>
        {children}
      </main>
      {!hideChrome && footer}
    </>
  )
}
