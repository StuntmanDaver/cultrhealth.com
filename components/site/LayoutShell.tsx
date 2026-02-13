import { Header } from './Header'
import { Footer } from './Footer'
import { LayoutShellClient } from './LayoutShellClient'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShellClient header={<Header />} footer={<Footer />}>
      {children}
    </LayoutShellClient>
  )
}
