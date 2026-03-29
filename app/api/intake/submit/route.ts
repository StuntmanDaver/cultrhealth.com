import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  createNewOrder,
  updateOrderApproval,
  AsherNewOrderRequest,
  AsherMedicationName,
  AsherMedicationType,
  calculateBMI,
  formatPhoneNumber,
} from '@/lib/asher-med-api';
import { MEDICATION_OPTIONS } from '@/lib/config/asher-med';
import { getAsherMedIdFromProductId } from '@/lib/config/product-to-asher-mapping';
import { updatePortalPatientId } from '@/lib/portal-db';
import { formatMedicationsList, buildPartnerNote } from '@/lib/intake-utils';
import { addTagsToContact } from '@/lib/mailchimp';

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
    // Require authenticated session (skip on staging/dev for testing)
    const stagingSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const isStagingAuth = stagingSiteUrl.includes('staging') || process.env.NODE_ENV === 'development';
    if (!isStagingAuth) {
      const auth = await verifyAuth(request);
      if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
      }
    }

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
        return found;
      })
      .filter(Boolean);

    if (medications.length === 0) {
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
      wellnessQuestionnaire: (() => {
        const base = body.wellnessQuestionnaire || {};
        if (!body.goalsMotivation) return base;
        const g = body.goalsMotivation as Record<string, unknown>;
        return {
          ...base,
          goals_primary_result: g.primaryGoal,
          goals_why_seeking_help_now: g.whyNow,
          goals_top_symptoms: Array.isArray(g.topSymptoms) ? (g.topSymptoms as string[]).join(', ') : g.topSymptoms,
          goals_priority_problem_to_solve: g.priorityProblem,
          goals_urgency_1_to_10: g.urgency,
          goals_what_have_you_tried: g.previousAttempts,
          goals_how_did_you_hear_about_us: g.discoverySource,
          goals_what_made_you_trust_us: g.trustReason,
          goals_barriers_to_follow_through: Array.isArray(g.barriers) ? (g.barriers as string[]).join(', ') : g.barriers,
        };
      })(),
      glp1MedicationHistory: medications.some(m => m.isGLP1) && body.glp1History ? body.glp1History : undefined,
      currentMedicationDetails: body.currentMedications ? {
        which_medications_have_you_been_taking: formatMedicationsList(body.currentMedications),
      } : undefined,
      treatmentPreferences: {
        providerCustomSolution: body.treatmentPreferences?.customSolution ? 'yes_custom' : 'no_custom',
      },
      medicationTypeSelection: medications.some(m => m.isGLP1) ? 'GLP1' : 'NonGLP1',
    };

    // Staging bypass: mock Asher Med order creation on staging/dev
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const isStaging = siteUrl.includes('staging') || process.env.NODE_ENV === 'development';
    // Shared intake data payload for both staging and production DB updates
    const intakeFormData = {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      heightFeet: body.heightFeet,
      heightInches: body.heightInches,
      weightLbs: body.weightLbs,
      shippingAddress: body.shippingAddress,
      selectedMedications: selectedMedications,
      treatmentPreferences: body.treatmentPreferences || null,
      currentMedications: body.currentMedications || null,
      goalsMotivation: body.goalsMotivation || null,
    };

    if (isStaging) {
      // Safe mock ID that fits PostgreSQL INTEGER (max ~2.1 billion)
      const mockPatientId = Math.floor(Math.random() * 2000000000);

      // Still update DB if available
      if (process.env.POSTGRES_URL) {
        try {
          const { sql } = await import('@vercel/postgres');

          // Use UPSERT: update if exists (matched by stripe session), insert if not
          if (body.stripeSessionId) {
            const updated = await sql`
              UPDATE pending_intakes
              SET intake_status = 'completed', completed_at = NOW(), updated_at = NOW(),
                  intake_data = COALESCE(intake_data, '{}'::jsonb) || ${JSON.stringify({
                    ...intakeFormData,
                    asher_patient_id: mockPatientId,
                    submitted_at: new Date().toISOString(),
                    staging_bypass: true,
                    partnerNote: partnerNote || null,
                  })}::jsonb
              WHERE stripe_payment_intent_id = ${body.stripeSessionId}
                OR intake_data->>'session_id' = ${body.stripeSessionId}
              RETURNING id
            `;

            // If no row matched (webhook didn't create the record), insert directly
            if (updated.rowCount === 0) {
              await sql`
                INSERT INTO pending_intakes (
                  stripe_payment_intent_id, customer_email, plan_tier,
                  intake_status, intake_data, created_at, updated_at, completed_at
                ) VALUES (
                  ${body.stripeSessionId},
                  ${body.email.toLowerCase()},
                  ${body.planTier || 'unknown'},
                  'completed',
                  ${JSON.stringify({
                    session_id: body.stripeSessionId,
                    ...intakeFormData,
                    asher_patient_id: mockPatientId,
                    submitted_at: new Date().toISOString(),
                    staging_bypass: true,
                    partnerNote: partnerNote || null,
                  })}::jsonb,
                  NOW(), NOW(), NOW()
                )
              `;
            }
          } else {
            // No stripe session — insert directly with email as key
            await sql`
              INSERT INTO pending_intakes (
                customer_email, plan_tier, intake_status, intake_data,
                created_at, updated_at, completed_at
              ) VALUES (
                ${body.email.toLowerCase()},
                ${body.planTier || 'unknown'},
                'completed',
                ${JSON.stringify({
                  ...intakeFormData,
                  asher_patient_id: mockPatientId,
                  submitted_at: new Date().toISOString(),
                  staging_bypass: true,
                  partnerNote: partnerNote || null,
                })}::jsonb,
                NOW(), NOW(), NOW()
              )
            `;
          }

          // Also create asher_orders record on staging (so admin intakes JOIN works)
          await sql`
            INSERT INTO asher_orders (
              asher_order_id, asher_patient_id, customer_email, order_type,
              order_status, partner_note, medication_packages,
              stripe_payment_intent_id, created_at
            ) VALUES (
              ${mockPatientId}, ${mockPatientId},
              ${body.email.toLowerCase()}, 'new', 'pending',
              ${partnerNote},
              ${JSON.stringify(orderRequest.medicationPackages)},
              ${body.stripeSessionId || null}, NOW()
            )
          `;
        } catch (dbErr) {
          console.error('[intake/submit] Staging DB error (non-fatal):', dbErr instanceof Error ? dbErr.message : 'Unknown');
        }
      }

      if (body.phone) {
        try {
          const phoneE164 = formatPhoneNumber(body.phone);
          await updatePortalPatientId(phoneE164, mockPatientId);
        } catch {
          // Non-fatal
        }
      }

      // Tag Mailchimp contact as intake complete (non-blocking)
      if (body.email) {
        addTagsToContact(body.email, ['intake-complete']).catch((err) =>
          console.error('[intake/submit] Mailchimp tag error (non-fatal):', err)
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Intake form submitted successfully (staging)',
        patientId: mockPatientId,
      });
    }

    // Submit to Asher Med
    const result = await createNewOrder(orderRequest);
    const patientId = result.data?.id;

    // Send partner note to Asher Med via PATCH (non-fatal)
    // createNewOrder returns the patient ID, not the order ID.
    // We need to fetch orders for this patient to get the actual order ID.
    if (patientId && partnerNote) {
      try {
        const { getOrders } = await import('@/lib/asher-med-api');
        const ordersResponse = await getOrders({ patientId });
        // Most recent order for this patient is the one we just created
        const latestOrder = ordersResponse.data?.[0];
        if (latestOrder?.id) {
          await updateOrderApproval(latestOrder.id, {
            approvalStatus: 'PENDING',
            partnerNote,
          });
        }
      } catch {
        // Non-fatal: partner note failed to send
      }
    }

    // Update pending intake status in database
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');

        const completionData = JSON.stringify({
          ...intakeFormData,
          asher_patient_id: result.data?.id,
          submitted_at: new Date().toISOString(),
          partnerNote: partnerNote || null,
        });

        if (body.stripeSessionId) {
          const updated = await sql`
            UPDATE pending_intakes
            SET
              intake_status = 'completed',
              completed_at = NOW(),
              updated_at = NOW(),
              intake_data = COALESCE(intake_data, '{}'::jsonb) || ${completionData}::jsonb
            WHERE stripe_payment_intent_id = ${body.stripeSessionId}
              OR intake_data->>'session_id' = ${body.stripeSessionId}
            RETURNING id
          `;

          // If no row matched (webhook didn't create the record), insert directly
          if (updated.rowCount === 0) {
            await sql`
              INSERT INTO pending_intakes (
                stripe_payment_intent_id, customer_email, plan_tier,
                intake_status, intake_data, created_at, updated_at, completed_at
              ) VALUES (
                ${body.stripeSessionId},
                ${body.email.toLowerCase()},
                ${body.planTier || 'unknown'},
                'completed',
                ${JSON.stringify({ session_id: body.stripeSessionId, ...JSON.parse(completionData) })}::jsonb,
                NOW(), NOW(), NOW()
              )
            `;
          }
        } else {
          // No stripe session — insert directly
          await sql`
            INSERT INTO pending_intakes (
              customer_email, plan_tier, intake_status, intake_data,
              created_at, updated_at, completed_at
            ) VALUES (
              ${body.email.toLowerCase()},
              ${body.planTier || 'unknown'},
              'completed',
              ${completionData}::jsonb,
              NOW(), NOW(), NOW()
            )
          `;
        }

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

      } catch (dbError) {
        console.error('Failed to update database:', dbError instanceof Error ? dbError.message : 'Unknown error');
        // Don't fail the request - the order was created in Asher Med
      }
    }

    // Auto-link portal session with new Asher Med patient ID (AUTH-07)
    // If user came through portal login -> intake, their phone is in the portal_sessions table.
    // Link their new patient ID so next dashboard visit shows full data without re-login.
    if (result.data?.id && body.phone) {
      try {
        const phoneE164 = formatPhoneNumber(body.phone)
        await updatePortalPatientId(phoneE164, result.data.id)
      } catch {
        // Non-fatal: portal session link failed, user can still re-login to get linked
      }
    }

    // Log successful submission (no PHI)
    console.log('Intake form submitted to Asher Med:', {
      timestamp: new Date().toISOString(),
      medications: medications.map(m => m.name),
      medicationCount: medications.length,
    });

    // Tag Mailchimp contact as intake complete (non-blocking)
    if (body.email) {
      addTagsToContact(body.email, ['intake-complete']).catch((err) =>
        console.error('[intake/submit] Mailchimp tag error (non-fatal):', err)
      )
    }

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

