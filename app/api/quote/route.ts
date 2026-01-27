import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Quote request item type
interface QuoteItem {
  sku: string
  name: string
  quantity: number
  doseMg: number
  volumeMl: number
  category: string
}

// Request body type
interface QuoteRequestBody {
  email: string
  tier: string | null
  items: QuoteItem[]
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: QuoteRequestBody = await request.json()
    const { email, tier, items, notes } = body

    // Validate required fields
    if (!email || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Email and items are required.' },
        { status: 400 }
      )
    }

    // Verify the email matches the session
    if (email !== session.email) {
      return NextResponse.json(
        { error: 'Email mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.sku || !item.name || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data. Each item must have sku, name, and quantity > 0.' },
          { status: 400 }
        )
      }
    }

    // Generate quote ID
    const quoteId = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const timestamp = new Date()

    // Calculate totals for logging
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueProducts = items.length

    // Log the quote request
    console.log('Quote request submitted:', {
      quoteId,
      email,
      tier,
      totalItems,
      uniqueProducts,
      items: items.map(i => ({ sku: i.sku, qty: i.quantity })),
      notes: notes ? notes.substring(0, 100) : null,
      timestamp: timestamp.toISOString(),
    })

    // Send notification email (if configured)
    if (process.env.RESEND_API_KEY) {
      const { sendQuoteRequestNotification } = await import('@/lib/resend')
      sendQuoteRequestNotification({
        quoteId,
        email,
        tier,
        items,
        notes,
        timestamp,
      }).catch((emailError) => {
        console.error('Failed to send quote notification:', emailError)
      })
    }

    // Return success
    return NextResponse.json({
      success: true,
      quoteId,
      message: 'Quote request submitted successfully. Our team will contact you within 24-48 hours.',
    })

  } catch (error) {
    console.error('Quote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
