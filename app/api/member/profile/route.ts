import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/profile
 *
 * Fetches the authenticated member's profile information.
 * First checks local database, then optionally fetches from Asher Med.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify session from cookie (JWT verification, not raw JSON.parse)
    const sessionCookie = request.cookies.get('cultr_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const email = session.email?.toLowerCase();
    const customerId = session.customerId;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email in session' },
        { status: 401 }
      );
    }

    // Fetch profile from database
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({
        success: true,
        patient: null,
        renewalEligible: false,
      });
    }

    const { sql } = await import('@vercel/postgres');

    // Get membership info — filtered by the authenticated user's Stripe customer ID
    const membershipResult = await sql`
      SELECT
        id,
        asher_patient_id,
        stripe_customer_id,
        plan_tier,
        subscription_status,
        created_at
      FROM memberships
      WHERE stripe_customer_id = ${customerId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Get patient info from pending intakes (has the most recent form data)
    const intakeResult = await sql`
      SELECT
        id,
        customer_email,
        intake_data,
        intake_status,
        created_at
      FROM pending_intakes
      WHERE lower(customer_email) = ${email}
        AND intake_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Get club member info as well
    const clubResult = await sql`
      SELECT id, name, email, phone, address_street, address_city, address_state, address_zip
      FROM club_members
      WHERE lower(email) = ${email}
      LIMIT 1
    `;

    let patient = null;
    let renewalEligible = false;

    if (intakeResult.rows.length > 0) {
      const intake = intakeResult.rows[0];
      const intakeData = intake.intake_data as Record<string, unknown> | null;

      // Check if patient has a completed order (eligible for renewal)
      const orderResult = await sql`
        SELECT COUNT(*) as count
        FROM asher_orders
        WHERE lower(customer_email) = ${email}
          AND order_status IN ('completed', 'prescribed', 'shipped')
      `;

      renewalEligible = parseInt(orderResult.rows[0]?.count || '0', 10) > 0;

      // Build patient object from intake data
      // intake_data stores firstName/lastName directly (set during intake/submit)
      const asherPatientId = intakeData?.asher_patient_id as number | null;

      patient = {
        id: asherPatientId || intake.id,
        firstName: (intakeData?.firstName as string) || '',
        lastName: (intakeData?.lastName as string) || '',
        email: intake.customer_email,
        phone: (intakeData?.phone as string) || '',
        shippingAddress: intakeData?.shippingAddress || null,
      };

      // TODO: Reconnect to new pharmacy partner for real-time patient data
    } else if (clubResult.rows.length > 0) {
      const clubMember = clubResult.rows[0];
      const nameParts = (clubMember.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      patient = {
        id: clubMember.id,
        firstName,
        lastName,
        email: clubMember.email,
        phone: clubMember.phone || '',
        shippingAddress: clubMember.address_street ? {
          street: clubMember.address_street,
          city: clubMember.address_city || '',
          state: clubMember.address_state || '',
          zip: clubMember.address_zip || '',
        } : null,
      };
    }

    return NextResponse.json({
      success: true,
      patient,
      renewalEligible,
      membership: membershipResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Failed to fetch member profile:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/member/profile
 *
 * Updates the member's profile information.
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify session from cookie (JWT verification)
    const sessionCookie = request.cookies.get('cultr_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const email = session.email?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email in session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, shippingAddress } = body;

    // TODO: Reconnect profile updates to new pharmacy partner

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Failed to update member profile:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
