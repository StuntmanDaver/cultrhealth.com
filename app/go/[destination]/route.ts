import { NextRequest, NextResponse } from 'next/server'

// ── Public QR Code Redirect ──
// URLs: /go/instagram, /go/tiktok, /go/youtube, etc.
// This is the URL encoded in QR codes on business cards & marketing materials.
// It forwards to /api/track/qr-scan which logs the scan and redirects.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ destination: string }> }
) {
  const { destination } = await params
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source') || 'business_card'

  // Build tracking URL — same origin
  const trackingUrl = new URL('/api/track/qr-scan', request.url)
  trackingUrl.searchParams.set('destination', destination)
  trackingUrl.searchParams.set('source', source)

  return NextResponse.redirect(trackingUrl, { status: 302 })
}
