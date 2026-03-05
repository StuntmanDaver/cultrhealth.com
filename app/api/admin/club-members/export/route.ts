import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    // Verify authorization via bearer token
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    // Use the same secret as club order approvals
    const secret = process.env.CLUB_ORDER_APPROVAL_SECRET || process.env.JWT_SECRET
    if (!secret || token !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured.' },
        { status: 500 }
      )
    }

    // Fetch all club members ordered by most recent first
    const result = await sql`
      SELECT name, email, phone, social_handle, source, created_at
      FROM club_members
      ORDER BY created_at DESC
    `

    const members = result.rows

    // Build CSV content
    const headers = ['Name', 'Email', 'Phone', 'Social Handle', 'Source', 'Joined At']
    const rows = members.map((member: any) => [
      escapeCSVField(member.name || ''),
      escapeCSVField(member.email || ''),
      escapeCSVField(member.phone || ''),
      escapeCSVField(member.social_handle || ''),
      escapeCSVField(member.source || ''),
      formatDate(member.created_at),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    // Return as CSV file download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cultr-club-members-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[admin/club-members/export] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

function escapeCSVField(field: string): string {
  if (!field) return '""'
  // If field contains comma, quotes, or newlines, wrap in quotes and escape inner quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0] // YYYY-MM-DD format
}
