import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { LayoutDashboard, Megaphone, Shield } from 'lucide-react'

// Owners who hold both admin + creator roles and need to pick a destination.
const DUAL_ROLE_EMAILS = [
  'stewart@cultrhealth.com',
]

export default async function ChooseAreaPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  // If someone navigates here directly and isn't a dual-role user, send them
  // to the right place so they're never stuck on this screen.
  if (!DUAL_ROLE_EMAILS.includes(session.email.toLowerCase())) {
    const adminEmails = (process.env.ADMIN_ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
    if (adminEmails.includes(session.email.toLowerCase()) || session.role === 'admin') {
      redirect('/admin')
    }
    redirect('/members')
  }

  return (
    <div className="min-h-screen flex flex-col grad-dark">
      <div className="flex-1 flex items-center justify-center py-24 px-6">
        <div className="w-full max-w-lg">

          <div className="text-center mb-10">
            <Image
              src="/images/email-logo-cream.png"
              alt="CULTR Health"
              width={240}
              height={86}
              priority
              className="mx-auto mb-6 h-12 w-auto"
            />
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-white/60 text-base">
              Where would you like to go?
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/admin"
              className="group flex items-center gap-5 w-full bg-white/10 hover:bg-white/[0.16] border border-white/20 hover:border-white/40 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-brand-cream" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-lg leading-tight">Admin Area</p>
                <p className="text-white/50 text-sm mt-0.5">Orders, creators, analytics, and operations</p>
              </div>
              <div className="text-white/30 group-hover:text-white/70 transition-colors text-xl">→</div>
            </Link>

            <Link
              href="/creators/portal"
              className="group flex items-center gap-5 w-full bg-white/10 hover:bg-white/[0.16] border border-white/20 hover:border-white/40 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sage flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-lg leading-tight">Creator Portal</p>
                <p className="text-white/50 text-sm mt-0.5">Earnings, links, commissions, and campaigns</p>
              </div>
              <div className="text-white/30 group-hover:text-white/70 transition-colors text-xl">→</div>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/30 text-sm mt-10">
            <Shield className="w-4 h-4" />
            <span>HIPAA-compliant secure access</span>
          </div>

        </div>
      </div>
    </div>
  )
}
