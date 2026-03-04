import { NextRequest, NextResponse } from 'next/server';
import {
  createNewOrder,
  AsherNewOrderRequest,
  AsherMedicationName,
  AsherMedicationType,
  calculateBMI,
  formatPhoneNumber,
} from '@/lib/asher-med-api';
import { MEDICATION_OPTIONS } from '@/lib/config/asher-med';
import { getAsherMedIdFromProductId } from '@/lib/config/product-to-asher-mapping';

/**
 * POST /api/intake/submit
 *
 * Submits completed intake form to Asher Med to create a new order.
 * This is called after the user completes the multi-step intake form.
 *
 * The intake form collects:
 * - Personal information (name, DOB, gender, contact)
 * - Shipping address
 * - Physical measurements (height, weight)
 * - Medication selection
 * - Wellness questionnaire responses
 * - GLP-1 history (if applicable)
 * - Current medications (if applicable)
 * - Treatment preferences
 * - ID document upload (S3 key)
 * - Consent signatures (telehealth + compounded medication)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'shippingAddress',
      'heightFeet',
      'heightInches',
      'weightLbs',
      'wellnessQuestionnaire',
      'idDocumentKey',
      'telehealthSignatureKey',
      'compoundedConsentKey',
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

    // Validate medication selection (support both old and new format)
    const selectedMedications = body.selectedMedications || (body.selectedMedication ? [body.selectedMedication] : []);

    console.log('Received medication selection:', { selectedMedications });

    if (selectedMedications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one medication must be selected' },
        { status: 400 }
      );
    }

    // Map product IDs to Asher Med medication IDs using comprehensive mapping
    const medications = selectedMedications
      .map((productId: string) => {
        const asherMedId = getAsherMedIdFromProductId(productId);
        const found = asherMedId ? MEDICATION_OPTIONS.find(m => m.id === asherMedId) : null;
        console.log('Mapping medication:', { productId, asherMedId, found: found?.id });
        return found;
      })
      .filter(Boolean);

    console.log('Available Asher Med IDs:', MEDICATION_OPTIONS.map(m => m.id));
    console.log('Matched medications:', medications.map(m => m.id));

    if (medications.length === 0) {
      console.error('No matching medications found for:', selectedMedications);
      return NextResponse.json(
        { success: false, error: 'Invalid medication selection. Please try selecting medications again.' },
        { status: 400 }
      );
    }

    // Calculate physical measurements
    const heightFeet = parseInt(body.heightFeet, 10);
    const heightInches = parseInt(body.heightInches, 10);
    const weightLbs = parseFloat(body.weightLbs);
    const totalHeightInches = heightFeet * 12 + heightInches;
    const bmi = calculateBMI(totalHeightInches, weightLbs);

    // Build partner note from treatment preferences
    const partnerNote = buildPartnerNote(body);

    // Construct the Asher Med order request with proper nested structure
    const orderRequest: AsherNewOrderRequest = {
      personalInformation: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email.toLowerCase(),
        phoneNumber: formatPhoneNumber(body.phone),
        dateOfBirth: body.dateOfBirth, // YYYY-MM-DD format
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
      physicalMeasurements: {
        height: totalHeightInches,
        weight: weightLbs,
        bmi,
      },
      medicationPackages: medications.map(medication => ({
        name: medication.name as AsherMedicationName,
        duration: medication.durations[0] || 30,
        medicationType: (medication.types[0] || 'Injection') as AsherMedicationType,
      })),
      idDocumentUpload: {
        frontIDFileS3Key: body.idDocumentKey,
        isGovernmentIDConfirmed: true,
      },
      telehealthConsent: {
        agreeTelehealthService: true,
        telehealthSigS3Key: body.telehealthSignatureKey,
      },
      consentAcknowledgments: {
        consentCompoundedSigS3Key: body.compoundedConsentKey,
        consentHealthcareConsultation: true,
      },
      wellnessQuestionnaire: body.wellnessQuestionnaire || {},
      glp1MedicationHistory: medications.some(m => m.isGLP1) && body.glp1History ? body.glp1History : undefined,
      currentMedicationDetails: body.currentMedications ? {
        which_medications_have_you_been_taking: Array.isArray(body.currentMedications)
          ? body.currentMedications.join(', ')
          : body.currentMedications,
      } : undefined,
      treatmentPreferences: {
        providerCustomSolution: body.treatmentPreferences?.customSolution ? 'yes_custom' : 'no_custom',
      },
      medicationTypeSelection: medications.some(m => m.isGLP1) ? 'GLP1' : 'NonGLP1',
    };

    // Submit to Asher Med
    const result = await createNewOrder(orderRequest);

    // Update pending intake status in database
    if (process.env.POSTGRES_URL && body.stripeSessionId) {
      try {
        const { sql } = await import('@vercel/postgres');

        await sql`
          UPDATE pending_intakes
          SET
            intake_status = 'completed',
            completed_at = NOW(),
            intake_data = intake_data || ${JSON.stringify({
              asher_patient_id: result.data?.id,
              submitted_at: new Date().toISOString(),
            })}::jsonb
          WHERE stripe_payment_intent_id = ${body.stripeSessionId}
            OR intake_data->>'session_id' = ${body.stripeSessionId}
        `;

        // Create asher_orders record
        await sql`
          INSERT INTO asher_orders (
            asher_order_id,
            asher_patient_id,
            customer_email,
            order_type,
            order_status,
            partner_note,
            medication_packages,
            stripe_payment_intent_id,
            created_at
          )
          VALUES (
            ${result.data?.id || null},
            ${result.data?.id || null},
            ${body.email.toLowerCase()},
            'new',
            'pending',
            ${partnerNote},
            ${JSON.stringify(orderRequest.medicationPackages)},
            ${body.stripeSessionId || null},
            NOW()
          )
        `;

        console.log('Database records updated for intake submission');
      } catch (dbError) {
        console.error('Failed to update database:', dbError);
        // Don't fail the request - the order was created in Asher Med
      }
    }

    // Log successful submission (no PHI)
    console.log('Intake form submitted to Asher Med:', {
      timestamp: new Date().toISOString(),
      medications: medications.map(m => m.name),
      medicationCount: medications.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Intake form submitted successfully',
      patientId: result.data?.id,
    });
  } catch (error) {
    console.error('Failed to submit intake form:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to submit intake form';

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

  // Add treatment preferences
  if (body.treatmentPreferences) {
    const prefs = body.treatmentPreferences as Record<string, unknown>;
    if (prefs.preferredContactMethod) {
      notes.push(`Preferred contact: ${prefs.preferredContactMethod}`);
    }
    if (prefs.additionalNotes) {
      notes.push(`Patient notes: ${prefs.additionalNotes}`);
    }
  }

  // Add current medications if specified
  if (body.currentMedications && Array.isArray(body.currentMedications) && body.currentMedications.length > 0) {
    notes.push(`Current medications: ${body.currentMedications.join(', ')}`);
  }

  // Add plan tier
  if (body.planTier) {
    notes.push(`CULTR Plan: ${body.planTier}`);
  }

  return notes.join('\n');
}
