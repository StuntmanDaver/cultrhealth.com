import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getSiphoxCustomerByPhone, getKitOrdersByCustomer, updateKitOrderStatus, SiphoxDatabaseError } from '@/lib/siphox/db'
import { registerKit } from '@/lib/siphox/client'
import { SiphoxApiError } from '@/lib/siphox/errors'
import { deriveKitLifecycleState } from '@/lib/siphox/kit-lifecycle'

/** Empty labs response — used when DB is unavailable or customer has no data */
const EMPTY_LABS_RESPONSE = {
  success: true,
  kitOrders: [],
  siphoxCustomerId: null,
  tier: null,
}

/**
 * GET /api/portal/labs
 * Returns kit orders with lifecycle state for authenticated member.
 * Gracefully returns empty state when DB tables are missing or unreachable.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)
    if (!auth.authenticated || !auth.phone) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByPhone(auth.phone)
    } catch (dbError) {
      // DB unavailable or siphox_customers table missing — return empty state
      if (dbError instanceof SiphoxDatabaseError) {
        console.warn('Labs DB unavailable, returning empty state:', dbError.message)
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
      // siphox_kit_orders table missing — return empty state
      if (dbError instanceof SiphoxDatabaseError) {
        console.warn('Kit orders DB unavailable, returning empty state:', dbError.message)
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

    // Determine tier from the latest order
    const tier = kitOrders.length > 0 ? kitOrders[0].plan_tier : null

    return NextResponse.json({
      success: true,
      kitOrders: ordersWithState,
      siphoxCustomerId: siphoxCustomer.siphox_customer_id,
      tier,
    })
  } catch (error) {
    console.error('Failed to fetch labs data:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labs data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/portal/labs
 * Register a kit and link it to the member's SiPhox customer
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)
    if (!auth.authenticated || !auth.phone) {
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

    const siphoxCustomer = await getSiphoxCustomerByPhone(auth.phone)

    if (!siphoxCustomer) {
      return NextResponse.json(
        { success: false, error: 'No SiPhox customer found. Please complete checkout first.' },
        { status: 400 }
      )
    }

    const registration = await registerKit(kitId, siphoxCustomer.siphox_customer_id)

    // Update local kit order status to 'registered' if registration succeeded
    if (registration.valid) {
      try {
        // Find the kit order that matches and update its status
        const kitOrders = await getKitOrdersByCustomer(siphoxCustomer.siphox_customer_id)
        if (kitOrders.length > 0) {
          // Update the most recent order's status to registered
          await updateKitOrderStatus(kitOrders[0].siphox_order_id, 'registered')
        }
      } catch (updateError) {
        // Non-fatal: SiPhox registration succeeded, local DB update failed
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

    console.error('Failed to register kit:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
