export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { clearPortalCookies } from '@/lib/portal-auth'

export async function POST() {
  // Clear both portal cookies (idempotent -- works even if no cookies present)
  await clearPortalCookies()

  return NextResponse.json({ success: true })
}
