// SiPhox Kit Fulfillment Orchestration
// Coordinates kit ordering on subscription checkout, deferred order processing,
// retry logic, and refund notifications. Never throws -- all errors are logged.

import { sql } from '@vercel/postgres'
import { SiphoxApiError } from './errors'
import {
  insertFulfillmentOrder,
  getOrderByCheckoutSession,
  getPendingFulfillmentOrders,
  getDeferredIntakeOrders,
  updateFulfillmentStatus,
  incrementRetryCount,
} from './db'
import type { FulfillmentStatus } from './db'
import {
  createCustomer,
  getCustomerByExternalId,
  createOrder,
  checkCreditBalance,
  isSiphoxConfigured,
} from './client'
import { upsertSiphoxCustomer } from './db'
import { formatPhoneE164 } from '@/lib/validation'

// ============================================================
// INTERNAL TYPES
// ============================================================

interface ShippingAddress {
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
}

interface MemberData {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: ShippingAddress
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Resolve shipping address from intake form data.
 * Queries pending_intakes table by email (case-insensitive) for the latest intake_data.
 * Returns null if no intake data or no address found.
 */
async function resolveShippingAddress(customerEmail: string): Promise<ShippingAddress | null> {
  try {
    const result = await sql`
      SELECT intake_data
      FROM pending_intakes
      WHERE LOWER(customer_email) = LOWER(${customerEmail})
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.rows.length === 0) return null

    const intakeData = result.rows[0].intake_data
    if (!intakeData) return null

    // Parse intake_data if it's a string
    const data = typeof intakeData === 'string' ? JSON.parse(intakeData) : intakeData

    // Extract shipping address from intake_data
    const shipping = data.shippingAddress
    if (!shipping) return null

    // Map intake form field names to SiPhox address fields
    const address: ShippingAddress = {
      street1: shipping.address1 || shipping.street1 || '',
      street2: shipping.address2 || shipping.street2 || undefined,
      city: shipping.city || '',
      state: shipping.stateAbbreviation || shipping.state || '',
      zip: shipping.zipCode || shipping.zip || '',
      country: shipping.country || 'US',
    }

    // Validate required fields are present
    if (!address.street1 || !address.city || !address.state || !address.zip) {
      return null
    }

    return address
  } catch (error) {
    console.error('Failed to resolve shipping address:', error)
    return null
  }
}

/**
 * Resolve full member data (name, phone, address) from intake form data.
 * Returns null if intake data not found.
 */
async function resolveMemberData(customerEmail: string): Promise<MemberData | null> {
  try {
    const result = await sql`
      SELECT intake_data
      FROM pending_intakes
      WHERE LOWER(customer_email) = LOWER(${customerEmail})
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.rows.length === 0) return null

    const intakeData = result.rows[0].intake_data
    if (!intakeData) return null

    const data = typeof intakeData === 'string' ? JSON.parse(intakeData) : intakeData

    // Extract shipping address
    const shipping = data.shippingAddress
    if (!shipping) return null

    const address: ShippingAddress = {
      street1: shipping.address1 || shipping.street1 || '',
      street2: shipping.address2 || shipping.street2 || undefined,
      city: shipping.city || '',
      state: shipping.stateAbbreviation || shipping.state || '',
      zip: shipping.zipCode || shipping.zip || '',
      country: shipping.country || 'US',
    }

    if (!address.street1 || !address.city || !address.state || !address.zip) {
      return null
    }

    // Extract name and phone from personalInfo or top-level
    const personalInfo = data.personalInfo || data
    const firstName = personalInfo.firstName || personalInfo.first_name || 'Member'
    const lastName = personalInfo.lastName || personalInfo.last_name || ''
    const rawPhone = personalInfo.phone || personalInfo.phoneNumber || ''
    const phone = rawPhone ? formatPhoneE164(rawPhone) : ''

    return {
      firstName,
      lastName,
      phone,
      email: customerEmail,
      address,
    }
  } catch (error) {
    console.error('Failed to resolve member data:', error)
    return null
  }
}

// ============================================================
// EXPORTED ORCHESTRATION FUNCTIONS
// ============================================================

/**
 * Trigger SiPhox kit fulfillment for a subscription checkout.
 * Called from the Stripe webhook handleCheckoutCompleted handler.
 *
 * This function NEVER throws. The subscription always activates regardless of
 * SiPhox outcome. All errors are logged and handled via deferred statuses.
 */
export async function triggerSiphoxFulfillment(params: {
  customerEmail: string
  planTier: string
  stripeCheckoutSessionId: string
  stripeSubscriptionId?: string
}): Promise<void> {
  const { customerEmail, planTier, stripeCheckoutSessionId, stripeSubscriptionId } = params

  try {
    // Guard: skip if SiPhox API key is not configured
    if (!isSiphoxConfigured()) {
      console.log('SiPhox fulfillment: skipped — SIPHOX_API_KEY not configured')
      return
    }

    // Tier check: only catalyst, concierge, or core-with-addon are eligible
    // (Core add-on detection is done in the webhook before calling this function)
    if (!['catalyst', 'concierge', 'core'].includes(planTier)) {
      return
    }

    // Idempotency: check if order already exists for this checkout session
    const existing = await getOrderByCheckoutSession(stripeCheckoutSessionId)
    if (existing) {
      console.log('SiPhox fulfillment: order already exists for checkout session', stripeCheckoutSessionId)
      return
    }

    // Resolve member data (address, name, phone) from intake form
    const memberData = await resolveMemberData(customerEmail)
    if (!memberData) {
      // No intake data yet -- queue for later processing
      await insertFulfillmentOrder({
        kitType: 'standard_panel',
        stripeCheckoutSessionId,
        customerEmail,
        planTier,
        fulfillmentStatus: 'pending_intake',
        stripeSubscriptionId,
      })
      console.log('SiPhox fulfillment: queued as pending_intake (no intake data)')
      return
    }

    // Check SiPhox credit balance
    const { balance } = await checkCreditBalance()
    if (balance < 1) {
      await insertFulfillmentOrder({
        kitType: 'standard_panel',
        stripeCheckoutSessionId,
        customerEmail,
        planTier,
        fulfillmentStatus: 'needs_credits',
        stripeSubscriptionId,
      })
      console.log('SiPhox fulfillment: queued as needs_credits')
      return
    }

    // Create or get SiPhox customer (use phone as external_id per Phase 1 pattern)
    const externalId = memberData.phone || customerEmail
    let siphoxCustomerId: string

    try {
      const existingCustomer = await getCustomerByExternalId(externalId)
      if (existingCustomer) {
        siphoxCustomerId = existingCustomer._id
      } else {
        const newCustomer = await createCustomer({
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          external_id: externalId,
          address: memberData.address,
        })
        siphoxCustomerId = newCustomer._id

        // Persist customer mapping (only if we have a valid phone for lookup)
        if (memberData.phone) {
          await upsertSiphoxCustomer(
            memberData.phone,
            siphoxCustomerId,
            memberData.firstName,
            memberData.lastName,
            memberData.email
          )
        }
      }
    } catch (customerError) {
      // Customer creation failed -- queue for retry
      await insertFulfillmentOrder({
        kitType: 'standard_panel',
        stripeCheckoutSessionId,
        customerEmail,
        planTier,
        fulfillmentStatus: 'pending_fulfillment',
        stripeSubscriptionId,
      })
      const errorMsg = customerError instanceof Error ? customerError.message : 'Customer creation failed'
      console.error('SiPhox fulfillment: customer creation failed, queued for retry:', errorMsg)
      return
    }

    // Create SiPhox order
    try {
      const order = await createOrder({
        recipient: {
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          external_id: externalId,
          address: memberData.address,
        },
        kit_types: [{ kitType: 'standard_panel', quantity: 1 }],
        is_notify_receiver: true,
      })

      // Success -- insert fulfilled order
      await insertFulfillmentOrder({
        siphoxCustomerId,
        siphoxOrderId: order._id,
        kitType: 'standard_panel',
        stripeCheckoutSessionId,
        customerEmail,
        planTier,
        fulfillmentStatus: 'fulfilled',
        stripeSubscriptionId,
      })

      // Send confirmation email to member
      try {
        const { sendKitFulfillmentEmail } = await import('@/lib/resend')
        await sendKitFulfillmentEmail({
          name: memberData.firstName,
          email: memberData.email,
          address: memberData.address,
        })
      } catch (emailError) {
        console.error('SiPhox fulfillment: confirmation email failed (non-fatal):', emailError)
      }

      console.log('SiPhox fulfillment: order placed successfully', { orderId: order._id })
    } catch (orderError) {
      // Handle specific error types
      if (orderError instanceof SiphoxApiError && (orderError.statusCode === 402 || orderError.message?.toLowerCase().includes('credit'))) {
        await insertFulfillmentOrder({
          siphoxCustomerId,
          kitType: 'standard_panel',
          stripeCheckoutSessionId,
          customerEmail,
          planTier,
          fulfillmentStatus: 'needs_credits',
          stripeSubscriptionId,
        })
        console.log('SiPhox fulfillment: queued as needs_credits (API 402)')
      } else {
        // Generic API failure -- queue for retry
        await insertFulfillmentOrder({
          siphoxCustomerId,
          kitType: 'standard_panel',
          stripeCheckoutSessionId,
          customerEmail,
          planTier,
          fulfillmentStatus: 'pending_fulfillment',
          stripeSubscriptionId,
        })
        const errorMsg = orderError instanceof Error ? orderError.message : 'Order creation failed'
        console.error('SiPhox fulfillment: order failed, queued for retry:', errorMsg)
      }
    }
  } catch (error) {
    // Top-level safety net -- NEVER let this function throw
    console.error('SiPhox fulfillment: unexpected error (non-fatal):', error)
  }
}

/**
 * Process deferred orders where intake data is now available.
 * Called by the cron job every 15 minutes.
 */
export async function processDeferredOrders(): Promise<{
  processed: number
  fulfilled: number
  stillPending: number
}> {
  let processed = 0
  let fulfilled = 0
  let stillPending = 0

  if (!isSiphoxConfigured()) {
    return { processed, fulfilled, stillPending }
  }

  try {
    const orders = await getDeferredIntakeOrders()

    for (const order of orders) {
      processed++

      // Try to resolve address from intake data
      const memberData = await resolveMemberData(order.customer_email || '')
      if (!memberData) {
        stillPending++
        continue
      }

      // Address now available -- attempt full fulfillment
      try {
        const externalId = memberData.phone || memberData.email
        let siphoxCustomerId: string

        // Get or create SiPhox customer
        const existingCustomer = await getCustomerByExternalId(externalId)
        if (existingCustomer) {
          siphoxCustomerId = existingCustomer._id
        } else {
          const newCustomer = await createCustomer({
            first_name: memberData.firstName,
            last_name: memberData.lastName,
            email: memberData.email,
            phone: memberData.phone,
            external_id: externalId,
            address: memberData.address,
          })
          siphoxCustomerId = newCustomer._id
          await upsertSiphoxCustomer(
            memberData.phone || externalId,
            siphoxCustomerId,
            memberData.firstName,
            memberData.lastName,
            memberData.email
          )
        }

        // Create SiPhox order
        const siphoxOrder = await createOrder({
          recipient: {
            first_name: memberData.firstName,
            last_name: memberData.lastName,
            email: memberData.email,
            phone: memberData.phone,
            external_id: externalId,
            address: memberData.address,
          },
          kit_types: [{ kitType: 'standard_panel', quantity: 1 }],
          is_notify_receiver: true,
        })

        // Update status to fulfilled
        await updateFulfillmentStatus(order.id, 'fulfilled', {
          siphoxCustomerId,
          siphoxOrderId: siphoxOrder._id,
        })
        fulfilled++

        // Send confirmation email
        try {
          const { sendKitFulfillmentEmail } = await import('@/lib/resend')
          await sendKitFulfillmentEmail({
            name: memberData.firstName,
            email: memberData.email,
            address: memberData.address,
          })
        } catch (emailError) {
          console.error('SiPhox deferred: confirmation email failed (non-fatal):', emailError)
        }
      } catch (apiError) {
        // API failed -- move to pending_fulfillment for cron retry
        const errorMsg = apiError instanceof Error ? apiError.message : 'Fulfillment failed'
        await updateFulfillmentStatus(order.id, 'pending_fulfillment', {
          lastError: errorMsg,
        })
        console.error('SiPhox deferred: fulfillment failed, moved to pending_fulfillment:', errorMsg)
      }
    }
  } catch (error) {
    console.error('SiPhox processDeferredOrders: unexpected error:', error)
  }

  return { processed, fulfilled, stillPending }
}

/**
 * Retry failed orders (pending_fulfillment with retry_count < 3).
 * After 3 failed attempts, marks order as failed and emails support.
 * Called by the cron job every 15 minutes.
 */
export async function retryFailedOrders(): Promise<{
  retried: number
  fulfilled: number
  permanentlyFailed: number
}> {
  let retried = 0
  let fulfilled = 0
  let permanentlyFailed = 0

  if (!isSiphoxConfigured()) {
    return { retried, fulfilled, permanentlyFailed }
  }

  try {
    const orders = await getPendingFulfillmentOrders()

    for (const order of orders) {
      retried++

      try {
        // Attempt SiPhox order creation
        // Customer should already exist from initial attempt, but resolve data fresh
        const memberData = await resolveMemberData(order.customer_email || '')
        if (!memberData) {
          // Still no data -- increment retry but keep as pending_fulfillment
          await incrementRetryCount(order.id, 'Member data not available')

          // Check if this was the 3rd retry
          const newRetryCount = (order.retry_count || 0) + 1
          if (newRetryCount >= 3) {
            await updateFulfillmentStatus(order.id, 'failed')
            permanentlyFailed++
            try {
              const { sendSiphoxFailureAlert } = await import('@/lib/resend')
              await sendSiphoxFailureAlert({
                customerEmail: order.customer_email || 'unknown',
                planTier: order.plan_tier || 'unknown',
                siphoxOrderId: order.siphox_order_id,
                lastError: 'Member data not available after 3 retries',
                retryCount: newRetryCount,
              })
            } catch (emailErr) {
              console.error('SiPhox retry: failure alert email failed:', emailErr)
            }
          }
          continue
        }

        const externalId = memberData.phone || memberData.email

        // Get or create SiPhox customer
        let siphoxCustomerId = order.siphox_customer_id
        if (!siphoxCustomerId || siphoxCustomerId === 'pending') {
          const existingCustomer = await getCustomerByExternalId(externalId)
          if (existingCustomer) {
            siphoxCustomerId = existingCustomer._id
          } else {
            const newCustomer = await createCustomer({
              first_name: memberData.firstName,
              last_name: memberData.lastName,
              email: memberData.email,
              phone: memberData.phone,
              external_id: externalId,
              address: memberData.address,
            })
            siphoxCustomerId = newCustomer._id
            await upsertSiphoxCustomer(
              memberData.phone || externalId,
              siphoxCustomerId,
              memberData.firstName,
              memberData.lastName,
              memberData.email
            )
          }
        }

        const siphoxOrder = await createOrder({
          recipient: {
            first_name: memberData.firstName,
            last_name: memberData.lastName,
            email: memberData.email,
            phone: memberData.phone,
            external_id: externalId,
            address: memberData.address,
          },
          kit_types: [{ kitType: 'standard_panel', quantity: 1 }],
          is_notify_receiver: true,
        })

        // Success
        await updateFulfillmentStatus(order.id, 'fulfilled', {
          siphoxCustomerId,
          siphoxOrderId: siphoxOrder._id,
        })
        fulfilled++

        // Send confirmation email
        try {
          const { sendKitFulfillmentEmail } = await import('@/lib/resend')
          await sendKitFulfillmentEmail({
            name: memberData.firstName,
            email: memberData.email,
            address: memberData.address,
          })
        } catch (emailError) {
          console.error('SiPhox retry: confirmation email failed (non-fatal):', emailError)
        }
      } catch (orderError) {
        const errorMsg = orderError instanceof Error ? orderError.message : 'Order creation failed'
        await incrementRetryCount(order.id, errorMsg)

        // Check if this was the 3rd retry
        const newRetryCount = (order.retry_count || 0) + 1
        if (newRetryCount >= 3) {
          await updateFulfillmentStatus(order.id, 'failed')
          permanentlyFailed++

          // Send failure alert to support
          try {
            const { sendSiphoxFailureAlert } = await import('@/lib/resend')
            await sendSiphoxFailureAlert({
              customerEmail: order.customer_email || 'unknown',
              planTier: order.plan_tier || 'unknown',
              siphoxOrderId: order.siphox_order_id,
              lastError: errorMsg,
              retryCount: newRetryCount,
            })
          } catch (emailErr) {
            console.error('SiPhox retry: failure alert email failed:', emailErr)
          }
        }
      }
    }
  } catch (error) {
    console.error('SiPhox retryFailedOrders: unexpected error:', error)
  }

  return { retried, fulfilled, permanentlyFailed }
}

/**
 * Send refund notification to support if there's an associated SiPhox kit order.
 * Called from the Stripe webhook handleChargeRefunded handler.
 * Never auto-cancels SiPhox orders -- just notifies support with full context.
 * Never throws.
 */
export async function notifySiphoxRefund(params: {
  stripeCheckoutSessionId: string
  refundAmount: number
  customerEmail?: string
  customerName?: string
}): Promise<void> {
  try {
    const order = await getOrderByCheckoutSession(params.stripeCheckoutSessionId)
    if (!order) {
      // No SiPhox order associated with this checkout -- nothing to do
      return
    }

    // Determine suggested action based on kit status
    let suggestedAction: string
    const status = (order as { fulfillment_status?: string }).fulfillment_status || order.status
    switch (status) {
      case 'pending_intake':
      case 'pending_fulfillment':
        suggestedAction = 'Cancel order -- kit has not been shipped yet. Consider cancelling the SiPhox order manually.'
        break
      case 'fulfilled':
        suggestedAction = 'Kit already shipped. Consider requesting return from member or marking as a loss.'
        break
      case 'needs_credits':
        suggestedAction = 'Order was never placed (no credits). No SiPhox action needed.'
        break
      case 'failed':
        suggestedAction = 'Order already failed. No SiPhox action needed.'
        break
      default:
        suggestedAction = 'Review order status and take appropriate action.'
    }

    const { sendSiphoxRefundAlert } = await import('@/lib/resend')
    await sendSiphoxRefundAlert({
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      planTier: (order as { plan_tier?: string }).plan_tier || 'unknown',
      siphoxOrderId: order.siphox_order_id,
      kitStatus: status,
      refundAmount: params.refundAmount,
      suggestedAction,
    })

    console.log('SiPhox refund notification sent:', {
      checkoutSession: params.stripeCheckoutSessionId,
      kitStatus: status,
    })
  } catch (error) {
    console.error('SiPhox refund notification failed (non-fatal):', error)
  }
}
