import { NextRequest, NextResponse } from 'next/server';
import {
  createRenewalOrder,
  AsherRenewalOrderRequest,
  AsherMedicationName,
  AsherMedicationType,
  formatPhoneNumber,
} from '@/lib/asher-med-api';
import { MEDICATION_OPTIONS } from '@/lib/config/asher-med';

/**
 * POST /api/renewal/submit
 *
 * Submits a renewal order to Asher Med.
 * This is for existing patients who need to renew their medication.
 *
 * Renewal orders require:
 * - Personal information (to identify the patient)
 * - Updated shipping address (if changed)
 * - Medication selection
 * - Wellness questionnaire
 * - Telehealth consent signature
 *
 * Renewal orders do NOT require:
 * - ID document upload (already on file)
 * - Compounded medication consent (already acknowledged)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields for renewal
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'selectedMedication',
      'wellnessQuestionnaire',
      'telehealthSignatureKey',
      'shippingAddress',
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Find the selected medication
    const medication = MEDICATION_OPTIONS.find(m => m.id === body.selectedMedication);
    if (!medication) {
      return NextResponse.json(
        { success: false, error: 'Invalid medication selection' },
        { status: 400 }
      );
    }

    // Build partner note
    const partnerNote = buildPartnerNote(body);

    // Construct the Asher Med renewal request with proper nested structure
    const renewalRequest: AsherRenewalOrderRequest = {
      personalInformation: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email.toLowerCase(),
        phoneNumber: formatPhoneNumber(body.phone),
        dateOfBirth: body.dateOfBirth,
        gender: body.gender.toUpperCase() as 'MALE' | 'FEMALE',
      },
      shippingAddress: {
        address1: body.shippingAddress.address1,
        city: body.shippingAddress.city,
        stateAbbreviation: body.shippingAddress.state,
        zipCode: body.shippingAddress.zipCode,
        country: 'US',
        apartmentNumber: body.shippingAddress.address2 || undefined,
      },
      medicationPackages: [
        {
          name: medication.name as AsherMedicationName,
          duration: medication.durations[0] || 30,
          medicationType: (medication.types[0] || 'Injection') as AsherMedicationType,
        },
      ],
      telehealthConsent: {
        agreeTelehealthService: true,
        telehealthSigS3Key: body.telehealthSignatureKey,
      },
      wellnessQuestionnaire: body.wellnessQuestionnaire || {},
    };

    // Submit renewal to Asher Med
    const result = await createRenewalOrder(renewalRequest);

    // Build partner note for database
    void partnerNote; // Mark as intentionally unused for now

    // Record renewal order in database
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');

        await sql`
          INSERT INTO asher_orders (
            asher_order_id,
            asher_patient_id,
            customer_email,
            order_type,
            order_status,
            partner_note,
            medication_packages,
            created_at
          )
          VALUES (
            ${result.data?.id || null},
            ${body.patientId},
            ${body.email?.toLowerCase() || ''},
            'renewal',
            'pending',
            ${partnerNote},
            ${JSON.stringify(renewalRequest.medicationPackages)},
            NOW()
          )
        `;

        console.log('Renewal order recorded in database');
      } catch (dbError) {
        console.error('Failed to record renewal in database:', dbError);
        // Don't fail the request - the order was created in Asher Med
      }
    }

    // Log successful submission (no PHI)
    console.log('Renewal order submitted to Asher Med:', {
      timestamp: new Date().toISOString(),
      medication: medication.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Renewal order submitted successfully',
      orderId: result.data?.id,
    });
  } catch (error) {
    console.error('Failed to submit renewal order:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to submit renewal order';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Build partner note from form data
 */
function buildPartnerNote(body: Record<string, unknown>): string {
  const notes: string[] = [];

  notes.push('RENEWAL ORDER');

  if (body.additionalNotes) {
    notes.push(`Patient notes: ${body.additionalNotes}`);
  }

  if (body.planTier) {
    notes.push(`CULTR Plan: ${body.planTier}`);
  }

  return notes.join('\n');
}
