import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getClientIp } from '@/lib/rate-limit'
import crypto from 'crypto'

// ── QR Code Destination Map ──
const QR_DESTINATIONS: Record<string, string> = {
  instagram: 'https://www.instagram.com/cultrhealth/',
  tiktok: 'https://www.tiktok.com/@cultrhealth',
  youtube: 'https://www.youtube.com/@cultrhealth',
  website: 'https://cultrhealth.com',
  quiz: 'https://cultrhealth.com/quiz',
  pricing: 'https://cultrhealth.com/pricing',
}

// ── User Agent Parsing ──
function parseUserAgent(ua: string): { deviceType: string; os: string; browser: string } {
  const uaLower = ua.toLowerCase()

  // Device type
  let deviceType = 'desktop'
  if (/mobile|iphone|android.*mobile|ipod/.test(uaLower)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad|android(?!.*mobile)/.test(uaLower)) {
    deviceType = 'tablet'
  }

  // Operating system
  let os = 'Unknown'
  if (/iphone|ipad|ipod/.test(uaLower)) os = 'iOS'
  else if (/android/.test(uaLower)) os = 'Android'
  else if (/windows/.test(uaLower)) os = 'Windows'
  else if (/macintosh|mac os/.test(uaLower)) os = 'macOS'
  else if (/linux/.test(uaLower)) os = 'Linux'

  // Browser
  let browser = 'Unknown'
  if (/instagram/.test(uaLower)) browser = 'Instagram'
  else if (/fban|fbav/.test(uaLower)) browser = 'Facebook'
  else if (/tiktok/.test(uaLower)) browser = 'TikTok'
  else if (/crios/.test(uaLower)) browser = 'Chrome (iOS)'
  else if (/edg\//.test(uaLower)) browser = 'Edge'
  else if (/chrome/.test(uaLower) && !/chromium/.test(uaLower)) browser = 'Chrome'
  else if (/safari/.test(uaLower) && !/chrome/.test(uaLower)) browser = 'Safari'
  else if (/firefox/.test(uaLower)) browser = 'Firefox'

  return { deviceType, os, browser }
}

// ── IP Hashing (privacy-safe) ──
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

// ── Track QR Scan (called by /go/[destination]) ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination') || 'instagram'
    const source = searchParams.get('source') || 'business_card'

    // Resolve destination URL
    const redirectUrl = QR_DESTINATIONS[destination]
    if (!redirectUrl) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Capture scan data
    const ip = await getClientIp()
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || null
    const { deviceType, os, browser } = parseUserAgent(userAgent)

    // Generate unique scan ID
    const scanId = crypto.randomBytes(12).toString('base64url')

    // Extract geo info from Vercel headers (available on Vercel deployments)
    const city = request.headers.get('x-vercel-ip-city') || null
    const region = request.headers.get('x-vercel-ip-country-region') || null
    const country = request.headers.get('x-vercel-ip-country') || null

    // Store scan event (fire-and-forget — don't block the redirect)
    sql`
      INSERT INTO qr_scans (scan_id, source, destination, ip_hash, user_agent, referer, city, region, country, device_type, os, browser)
      VALUES (${scanId}, ${source}, ${destination}, ${hashIp(ip)}, ${userAgent}, ${referer}, ${city}, ${region}, ${country}, ${deviceType}, ${os}, ${browser})
    `.catch((err) => {
      console.error('QR scan tracking error:', err)
    })

    // Redirect to destination
    return NextResponse.redirect(redirectUrl, { status: 302 })
  } catch (error) {
    console.error('QR scan route error:', error)
    // Fail gracefully — always redirect to Instagram
    return NextResponse.redirect('https://www.instagram.com/cultrhealth/')
  }
}
