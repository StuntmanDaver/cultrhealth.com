import { NextRequest, NextResponse } from 'next/server'
import { getSession, getMembershipTier } from '@/lib/auth'
import { getSiphoxCustomerByEmail, getKitOrdersByCustomer, SiphoxDatabaseError } from '@/lib/siphox/db'
import { deriveKitLifecycleState } from '@/lib/siphox/kit-lifecycle'

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
