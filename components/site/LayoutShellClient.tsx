'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

const HIDE_CHROME_PREFIXES = ['/creators/portal', '/admin', '/portal']
const HIDE_CHROME_EXACT = ['/join']
const HIDE_CHROME_HOSTNAMES = ['join.cultrhealth.com']

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
  const [isJoinDomain, setIsJoinDomain] = useState(false)

  useEffect(() => {
    setIsJoinDomain(HIDE_CHROME_HOSTNAMES.includes(window.location.hostname))
  }, [])

  const hideChrome = isJoinDomain || HIDE_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || HIDE_CHROME_EXACT.includes(pathname)

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
