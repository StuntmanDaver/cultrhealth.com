import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAdminAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.email ? 'Admin access required' : 'Authentication required' },
        {
          status: auth.email ? 403 : 401,
          headers: NO_CACHE_HEADERS,
        }
      )
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured.' },
        {
          status: 500,
          headers: NO_CACHE_HEADERS,
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestedDays = parseInt(searchParams.get('days') || '30', 10)
    const days = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(requestedDays, 365) : 30

    const result = await sql`
      SELECT
        scan_id,
        source,
        destination,
        ip_hash,
        device_type,
        os,
        browser,
        city,
        region,
        country,
        referer,
        user_agent,
        created_at
      FROM qr_scans
      WHERE created_at >= NOW() - make_interval(days => ${days})
      ORDER BY created_at DESC
    `

    const headers = [
      'Scan ID',
      'Source',
      'Destination',
      'IP Hash',
      'Device Type',
      'OS',
      'Browser',
      'City',
      'Region',
      'Country',
      'Referrer',
      'User Agent',
      'Scanned At',
    ]

    const rows = result.rows.map((scan: Record<string, unknown>) => [
      escapeCSVField(scan.scan_id as string | null),
      escapeCSVField(scan.source as string | null),
      escapeCSVField(scan.destination as string | null),
      escapeCSVField(scan.ip_hash as string | null),
      escapeCSVField(scan.device_type as string | null),
      escapeCSVField(scan.os as string | null),
      escapeCSVField(scan.browser as string | null),
      escapeCSVField(scan.city as string | null),
      escapeCSVField(scan.region as string | null),
      escapeCSVField(scan.country as string | null),
      escapeCSVField(scan.referer as string | null),
      escapeCSVField(scan.user_agent as string | null),
      escapeCSVField(formatDateTime(scan.created_at as string | Date | null)),
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const exportDate = new Date().toISOString().split('T')[0]

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cultr-visitor-events-${days}d-${exportDate}.csv"`,
        ...NO_CACHE_HEADERS,
      },
    })
  } catch (error) {
    console.error('[admin/qr-scans/export] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error.' },
      {
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    )
  }
}

function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'
  let field = String(value)
  const trimmed = field.trimStart()
  if (/^[=+\-@]/.test(trimmed) || /^[\t\r]/.test(field)) {
    field = `'${field}`
  }
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}
