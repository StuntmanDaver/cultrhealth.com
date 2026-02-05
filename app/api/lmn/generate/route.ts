import { NextRequest, NextResponse } from 'next/server'
import { generateAndStoreLmn, hasLmnEligibleItems, type LmnItem } from '@/lib/lmn'

/**
 * POST /api/lmn/generate
 * Generate LMN for an order (internal use)
 * 
 * Body: {
 *   orderNumber: string
 *   orderId?: string
 *   customerEmail: string
 *   customerName?: string
 *   items: LmnItem[]
 *   totalAmount: number
 *   currency?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for security
    const authHeader = request.headers.get('authorization')
    const internalApiKey = process.env.INTERNAL_API_KEY

    if (internalApiKey && authHeader !== `Bearer ${internalApiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      orderNumber,
      orderId,
      customerEmail,
      customerName,
      items,
      totalAmount,
      currency = 'USD',
    } = body

    // Validate required fields
    if (!orderNumber || !customerEmail || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: orderNumber, customerEmail, items' },
        { status: 400 }
      )
    }

    // Transform items to LmnItem format if needed
    const lmnItems: LmnItem[] = items.map((item: {
      sku: string
      name: string
      quantity: number
      unitPrice?: number
      unit_price?: number
      totalPrice?: number
      category: string
    }) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.unit_price || 0,
      totalPrice: item.totalPrice || (item.unitPrice || item.unit_price || 0) * item.quantity,
      category: item.category,
    }))

    // Check if there are eligible items
    if (!hasLmnEligibleItems(lmnItems)) {
      return NextResponse.json(
        { error: 'No LMN-eligible items in order' },
        { status: 400 }
      )
    }

    // Generate and store LMN
    const { data, record } = await generateAndStoreLmn(
      {
        orderNumber,
        orderId,
        customerEmail,
        customerName,
        items: lmnItems,
        eligibleTotal: totalAmount,
        currency,
      },
      orderId
    )

    return NextResponse.json({
      success: true,
      lmnNumber: data.lmnNumber,
      eligibleTotal: data.eligibleTotal,
      eligibleItems: data.items.length,
      issueDate: data.issueDate.toISOString(),
      recordId: record?.id,
    })
  } catch (error) {
    console.error('LMN generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate LMN' },
      { status: 500 }
    )
  }
}
