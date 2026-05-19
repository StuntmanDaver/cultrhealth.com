import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/profile
 *
 * Fetches the authenticated member's profile information.
 * First checks membership and completed intake records in the local database.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify session from cookie (JWT verification, not raw JSON.parse)
    const sessionCookie = request.cookies.get('cultr_session_v2');

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
        cultr_patient_number,
        ehr_patient_id,
        ehr_provider,
        lab_preference,
        siphox_status,
        siphox_order_id,
        calendly_review_url,
        stripe_customer_id,
        plan_tier,
        subscription_status,
        created_at
      FROM memberships
      WHERE stripe_customer_id = ${customerId}
         OR lower(email) = ${email}
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

      const localPatientId = (intakeData?.clinical_patient_id || intakeData?.asher_patient_id) as number | null;
      const raw = intakeData?.shippingAddress as Record<string, string> | null;

      patient = {
        id: localPatientId || intake.id,
        firstName: (intakeData?.firstName as string) || '',
        lastName: (intakeData?.lastName as string) || '',
        email: intake.customer_email,
        phone: (intakeData?.phone as string) || '',
        shippingAddress: raw ? {
          address1: raw.address1 || raw.street || '',
          address2: raw.address2 || '',
          city: raw.city || '',
          state: raw.state || '',
          zipCode: raw.zipCode || raw.zip || '',
        } : null,
      };
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
          address1: clubMember.address_street,
          address2: '',
          city: clubMember.address_city || '',
          state: clubMember.address_state || '',
          zipCode: clubMember.address_zip || '',
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
    const sessionCookie = request.cookies.get('cultr_session_v2');

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
    const { shippingAddress } = body as {
      shippingAddress?: { address1: string; address2?: string; city: string; state: string; zipCode: string }
    };

    if (!shippingAddress) {
      return NextResponse.json({ success: false, error: 'No address provided' }, { status: 400 });
    }

    const { sql } = await import('@vercel/postgres');

    // Update pending_intakes (intake-flow users)
    await sql`
      UPDATE pending_intakes
      SET intake_data = intake_data || ${JSON.stringify({ shippingAddress })}::jsonb,
          updated_at = NOW()
      WHERE lower(customer_email) = ${email}
        AND intake_status = 'completed'
    `;

    // Update club_members (club-only users)
    await sql`
      UPDATE club_members
      SET address_street = ${shippingAddress.address1},
          address_city   = ${shippingAddress.city},
          address_state  = ${shippingAddress.state},
          address_zip    = ${shippingAddress.zipCode},
          updated_at     = NOW()
      WHERE lower(email) = ${email}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update member profile:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
