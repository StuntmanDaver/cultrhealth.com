import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/member/profile
 *
 * Fetches the authenticated member's profile information.
 * First checks local database, then optionally fetches from Asher Med.
 */
export async function GET(request: NextRequest) {
  try {
    // Get email from session/cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('cultr_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse session to get email
    let email: string;
    try {
      const session = JSON.parse(sessionCookie.value);
      email = session.email?.toLowerCase();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

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

    // Get membership info
    const membershipResult = await sql`
      SELECT
        id,
        asher_patient_id,
        stripe_customer_id,
        plan_tier,
        subscription_status,
        created_at
      FROM memberships
      WHERE lower(stripe_customer_id) IN (
        SELECT stripe_customer_id FROM memberships WHERE id IN (
          SELECT MIN(id) FROM memberships GROUP BY stripe_customer_id
        )
      )
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
      const customerName = (intakeData?.customer_name as string) || '';
      const asherPatientId = intakeData?.asher_patient_id as number | null;

      patient = {
        id: asherPatientId || intake.id,
        firstName: customerName.split(' ')[0] || '',
        lastName: customerName.split(' ').slice(1).join(' ') || '',
        email: intake.customer_email,
        phone: (intakeData?.phone as string) || '',
        shippingAddress: intakeData?.shippingAddress || null,
      };

      // Optionally fetch real-time patient data from Asher Med
      if (process.env.ASHER_MED_API_KEY && asherPatientId) {
        try {
          const { getPatientById } = await import('@/lib/asher-med-api');
          const asherPatient = await getPatientById(asherPatientId);

          if (asherPatient) {
            // Merge with Asher Med data (prefer Asher Med as source of truth)
            patient = {
              ...patient,
              firstName: asherPatient.firstName || patient.firstName,
              lastName: asherPatient.lastName || patient.lastName,
              email: asherPatient.email || patient.email,
              phone: asherPatient.phoneNumber || patient.phone,
              shippingAddress: asherPatient.address1 ? {
                address1: asherPatient.address1,
                address2: asherPatient.address2 || '',
                city: asherPatient.city || '',
                state: asherPatient.stateAbbreviation || '',
                zipCode: asherPatient.zipcode || '',
              } : patient.shippingAddress,
            };
          }
        } catch (apiError) {
          console.log('Unable to fetch real-time patient data from Asher Med:', apiError);
          // Continue with database data
        }
      }
    }

    return NextResponse.json({
      success: true,
      patient,
      renewalEligible,
      membership: membershipResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Failed to fetch member profile:', error);

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
    // Get email from session/cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('cultr_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let email: string;
    try {
      const session = JSON.parse(sessionCookie.value);
      email = session.email?.toLowerCase();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email in session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, shippingAddress } = body;

    // Update Asher Med patient if we have their ID
    if (process.env.POSTGRES_URL) {
      const { sql } = await import('@vercel/postgres');

      // Get Asher patient ID
      const intakeResult = await sql`
        SELECT intake_data->>'asher_patient_id' as asher_patient_id
        FROM pending_intakes
        WHERE lower(customer_email) = ${email}
          AND intake_status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const asherPatientId = intakeResult.rows[0]?.asher_patient_id;

      if (asherPatientId) {
        try {
          const { updatePatient } = await import('@/lib/asher-med-api');

          const updateData: Parameters<typeof updatePatient>[1] = {};

          if (phone) {
            updateData.phoneNumber = phone;
          }

          if (shippingAddress) {
            updateData.address1 = shippingAddress.address1;
            updateData.address2 = shippingAddress.address2 || null;
            updateData.city = shippingAddress.city;
            updateData.stateAbbreviation = shippingAddress.state;
            updateData.zipcode = shippingAddress.zipCode;
          }

          await updatePatient(parseInt(asherPatientId, 10), updateData);
        } catch (apiError) {
          console.error('Failed to update Asher Med patient:', apiError);
          // Continue anyway - we can update locally
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Failed to update member profile:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
