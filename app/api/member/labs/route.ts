import { NextRequest, NextResponse } from 'next/server'
import { getSession, getMembershipTier } from '@/lib/auth'
import { getSiphoxCustomerByEmail, getKitOrdersByCustomer, updateKitOrderStatus, SiphoxDatabaseError } from '@/lib/siphox/db'
import { registerKit } from '@/lib/siphox/client'
import { SiphoxApiError } from '@/lib/siphox/errors'
import { deriveKitLifecycleState } from '@/lib/siphox/kit-lifecycle'
import { addTagsToContact } from '@/lib/mailchimp'

const EMPTY_LABS_RESPONSE = {
  success: true,
  kitOrders: [],
  siphoxCustomerId: null,
  tier: null,
}

/**
 * GET /api/member/labs
 * Member-auth version of /api/portal/labs.
 * Uses session email instead of portal phone auth.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByEmail(session.email)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        return NextResponse.json(EMPTY_LABS_RESPONSE)
      }
      throw dbError
    }

    if (!siphoxCustomer) {
      // Try to determine tier even without SiPhox customer
      const tier = await getMembershipTier(session.customerId, session.email)
      return NextResponse.json({ ...EMPTY_LABS_RESPONSE, tier })
    }

    let kitOrders
    try {
      kitOrders = await getKitOrdersByCustomer(siphoxCustomer.siphox_customer_id)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
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
    console.error('Failed to fetch member labs data:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labs data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/member/labs
 * Register a kit — member-auth version of /api/portal/labs POST.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.email) {
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

    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByEmail(session.email)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        return NextResponse.json(
          { success: false, error: 'Lab services temporarily unavailable.' },
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
        console.error('Failed to update kit order status:', updateError instanceof Error ? updateError.message : updateError)
      }

      // Tag Mailchimp contact (non-blocking)
      addTagsToContact(session.email, ['labs-ordered']).catch((err) =>
        console.error('[member/labs] Mailchimp tag error (non-fatal):', err)
      )
    }

    return NextResponse.json({ success: true, registration })
  } catch (error) {
    if (error instanceof SiphoxApiError) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to register kit' },
        { status: error.statusCode || 500 }
      )
    }
    console.error('Failed to register kit:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
