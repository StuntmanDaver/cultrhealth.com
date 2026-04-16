import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getCustomerFullProfile, updateClubMemberByEmail, deleteClubMemberByEmail, logAdminAction } from '@/lib/db'

/**
 * Shared admin auth check. Returns either a NextResponse error or the
 * authenticated admin session.
 */
async function requireAdmin(): Promise<
  | { ok: true; session: { email: string } }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession()
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }

  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email) || session.role === 'admin'

  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    }
  }

  return { ok: true, session: { email: session.email } }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth.ok === false) return auth.response

    const email = decodeURIComponent(params.email)
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email parameter required' },
        { status: 400 }
      )
    }

    const profile = await getCustomerFullProfile(email)

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Admin customer profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/customers/[email]
// Admin-only edit of a club_members row. Only fields provided in the body are
// updated (COALESCE semantics in lib/db.ts). Every successful edit is audited.
const PatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  address_street: z.string().trim().max(200).nullable().optional(),
  address_city: z.string().trim().max(100).nullable().optional(),
  address_state: z.string().trim().length(2).nullable().optional(),
  address_zip: z.string().trim().max(20).nullable().optional(),
  age: z.number().int().min(13).max(120).nullable().optional(),
  gender: z.enum(['male', 'female']).nullable().optional(),
  signup_type: z.enum(['products', 'membership']).nullable().optional(),
  source: z.string().trim().max(100).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth.ok === false) return auth.response

    const email = decodeURIComponent(params.email)
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email parameter required' },
        { status: 400 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Normalize: if state is provided and non-null, uppercase it for consistency
    const patch = { ...parsed.data }
    if (typeof patch.address_state === 'string') {
      patch.address_state = patch.address_state.toUpperCase()
    }

    const result = await updateClubMemberByEmail(email, patch)
    if (!result) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Audit log — non-throwing, fire and forget semantics already exist inside helper
    await logAdminAction(
      'update_member',
      result.id,
      { fields: Object.keys(parsed.data), email: email.toLowerCase() },
      auth.session.email
    )

    // Return refreshed profile so client can update modal in one round trip
    const profile = await getCustomerFullProfile(email)
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Admin customer update error:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/customers/[email]
// Admin-only deletion of a club_members row. Blocked if the customer has orders
// (FK constraint on club_orders.member_id). Every successful delete is audited.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth.ok === false) return auth.response

    const email = decodeURIComponent(params.email)
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email parameter required' },
        { status: 400 }
      )
    }

    const result = await deleteClubMemberByEmail(email)

    if (result.blockedByOrders !== undefined && result.blockedByOrders > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete customer with existing orders',
          orderCount: result.blockedByOrders,
        },
        { status: 409 }
      )
    }

    if (!result.deleted || !result.id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Audit log
    await logAdminAction(
      'delete_customer',
      result.id,
      { email: email.toLowerCase() },
      auth.session.email
    )

    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error('Admin customer delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
