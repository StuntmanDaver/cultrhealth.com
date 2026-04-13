import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorPhone } from '@/lib/creators/db'
import { getSiphoxCustomerByPhone, getKitOrdersByCustomer, updateKitOrderStatus, SiphoxDatabaseError } from '@/lib/siphox/db'
import { registerKit } from '@/lib/siphox/client'
import { SiphoxApiError } from '@/lib/siphox/errors'
import { deriveKitLifecycleState } from '@/lib/siphox/kit-lifecycle'
import { formatPhoneE164 } from '@/lib/validation'

/** Empty labs response — used when DB is unavailable or creator has no data */
const EMPTY_LABS_RESPONSE = {
  success: true,
  kitOrders: [],
  siphoxCustomerId: null,
  tier: null,
}

/**
 * Resolve creator's phone → E.164 format.
 * Returns null if creator has no phone on file.
 */
async function resolveCreatorPhone(creatorId: string): Promise<{ phone: string | null; needsPhone: boolean }> {
  const rawPhone = await getCreatorPhone(creatorId)
  if (!rawPhone) return { phone: null, needsPhone: true }
  return { phone: formatPhoneE164(rawPhone), needsPhone: false }
}

/**
 * GET /api/creators/labs
 * Returns kit orders with lifecycle state for authenticated creator.
 * Mirrors /api/portal/labs but uses creator auth + creator phone lookup.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyCreatorAuth(request)
    if (!auth.authenticated || !auth.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { phone, needsPhone } = await resolveCreatorPhone(auth.creatorId)
    if (!phone) {
      return NextResponse.json({ ...EMPTY_LABS_RESPONSE, needsPhone })
    }

    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByPhone(phone)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        console.warn('Creator labs DB unavailable, returning empty state:', dbError.message)
        return NextResponse.json(EMPTY_LABS_RESPONSE)
      }
      throw dbError
    }

    if (!siphoxCustomer) {
      return NextResponse.json(EMPTY_LABS_RESPONSE)
    }

    let kitOrders
    try {
      kitOrders = await getKitOrdersByCustomer(siphoxCustomer.siphox_customer_id)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        console.warn('Creator kit orders DB unavailable, returning empty state:', dbError.message)
        return NextResponse.json({
          ...EMPTY_LABS_RESPONSE,
          siphoxCustomerId: siphoxCustomer.siphox_customer_id,
        })
      }
      throw dbError
    }

    const ordersWithState = kitOrders.map((order) => ({
      ...order,
      lifecycleState: deriveKitLifecycleState(order),
    }))

    const tier = kitOrders.length > 0 ? kitOrders[0].plan_tier : null

    return NextResponse.json({
      success: true,
      kitOrders: ordersWithState,
      siphoxCustomerId: siphoxCustomer.siphox_customer_id,
      tier,
    })
  } catch (error) {
    console.error('Failed to fetch creator labs data:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labs data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/creators/labs
 * Register a kit and link it to the creator's SiPhox customer.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyCreatorAuth(request)
    if (!auth.authenticated || !auth.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const kitId = typeof body.kitId === 'string' ? body.kitId.trim() : ''

    if (!kitId) {
      return NextResponse.json(
        { success: false, error: 'Kit ID is required' },
        { status: 400 }
      )
    }

    const { phone } = await resolveCreatorPhone(auth.creatorId)
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Please add your phone number in Settings to use lab features.' },
        { status: 400 }
      )
    }

    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByPhone(phone)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        return NextResponse.json(
          { success: false, error: 'Lab services temporarily unavailable. Please try again later.' },
          { status: 503 }
        )
      }
      throw dbError
    }

    if (!siphoxCustomer) {
      return NextResponse.json(
        { success: false, error: 'No SiPhox customer found. Please complete checkout first.' },
        { status: 400 }
      )
    }

    const registration = await registerKit(kitId, siphoxCustomer.siphox_customer_id)

    if (registration.valid) {
      try {
        const kitOrders = await getKitOrdersByCustomer(siphoxCustomer.siphox_customer_id)
        if (kitOrders.length > 0) {
          await updateKitOrderStatus(kitOrders[0].siphox_order_id, 'registered')
        }
      } catch (updateError) {
        console.error('Failed to update local kit order status:', updateError instanceof Error ? updateError.message : updateError)
      }
    }

    return NextResponse.json({ success: true, registration })
  } catch (error) {
    if (error instanceof SiphoxApiError) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to register kit' },
        { status: error.statusCode || 500 }
      )
    }

    console.error('Failed to register creator kit:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
