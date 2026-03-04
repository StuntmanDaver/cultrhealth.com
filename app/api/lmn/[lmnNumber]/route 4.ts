import { NextRequest, NextResponse } from 'next/server'
import { getLmnByNumber, regenerateLmnPdf } from '@/lib/lmn'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ lmnNumber: string }>
}

/**
 * GET /api/lmn/[lmnNumber]
 * Download LMN PDF by LMN number
 * Requires authentication - user must own the LMN (email match)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { lmnNumber } = await params

    if (!lmnNumber) {
      return NextResponse.json(
        { error: 'LMN number required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get LMN record
    const record = await getLmnByNumber(lmnNumber)
    if (!record) {
      return NextResponse.json(
        { error: 'LMN not found' },
        { status: 404 }
      )
    }

    // Verify ownership (email must match)
    if (record.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate PDF
    const pdfBuffer = await regenerateLmnPdf(lmnNumber)
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      )
    }

    // Return PDF with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CULTR-LMN-${lmnNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('LMN download error:', error)
    return NextResponse.json(
      { error: 'Failed to download LMN' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lmn/[lmnNumber]/info
 * Get LMN metadata without downloading PDF
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  try {
    const { lmnNumber } = await params

    // Verify user authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return new NextResponse(null, { status: 401 })
    }

    // Get LMN record
    const record = await getLmnByNumber(lmnNumber)
    if (!record) {
      return new NextResponse(null, { status: 404 })
    }

    // Verify ownership
    if (record.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return new NextResponse(null, { status: 403 })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-LMN-Number': record.lmn_number,
        'X-Order-Number': record.order_number,
        'X-Issue-Date': new Date(record.issue_date).toISOString(),
        'X-Eligible-Total': record.eligible_total.toString(),
      },
    })
  } catch (error) {
    console.error('LMN info error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
