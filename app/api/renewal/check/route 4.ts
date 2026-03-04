import { NextRequest, NextResponse } from 'next/server';
import { getPatientByPhone, formatPhoneNumber } from '@/lib/asher-med-api';

/**
 * POST /api/renewal/check
 *
 * Checks if a patient is eligible for renewal by looking up their
 * existing record in Asher Med using their phone number.
 *
 * Request body:
 *   - phone: string (patient's phone number)
 *
 * Response:
 *   - eligible: boolean
 *   - patient: patient data if found
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Look up patient in Asher Med
    const patient = await getPatientByPhone(formattedPhone);

    if (!patient) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'No existing patient record found',
      });
    }

    // Check if patient is eligible for renewal
    // ACTIVE status indicates they have a completed order and can renew
    const isEligible = patient.status === 'ACTIVE';

    return NextResponse.json({
      success: true,
      eligible: isEligible,
      patient: isEligible ? {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        shippingAddress: patient.address1 ? {
          address1: patient.address1,
          address2: patient.address2 || undefined,
          city: patient.city,
          state: patient.stateAbbreviation,
          zipCode: patient.zipcode,
        } : undefined,
        // Don't expose sensitive medical data
      } : undefined,
      reason: isEligible ? undefined : 'Patient not eligible for renewal at this time',
    });
  } catch (error) {
    console.error('Failed to check renewal eligibility:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to check eligibility';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
