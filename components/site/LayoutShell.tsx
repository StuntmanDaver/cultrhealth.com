'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

/**
 * Routes that manage their own header/footer and should NOT
 * show the site-wide Header and Footer.
 */
const HIDE_CHROME_PREFIXES = [
  '/creators/portal',
  '/admin',
]

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome = HIDE_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <>
      {!hideChrome && <Header />}
      <main className={hideChrome ? 'min-h-screen' : 'pt-20 min-h-[calc(100vh-80px)]'}>
        {children}
      </main>
      {!hideChrome && <Footer />}
    </>
  )
}
