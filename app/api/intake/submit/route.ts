import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { calculateBMI } from '@/lib/utils/health';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { updatePortalEhrPatientId } from '@/lib/portal-db';
import { formatMedicationsList, buildPartnerNote } from '@/lib/intake-utils';
import { addTagsToContact } from '@/lib/mailchimp';

/**
 * POST /api/intake/submit
 *
 * Submits completed intake form and saves to local database.
 * // TODO: Reconnect to new pharmacy partner
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
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
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

    // Calculate physical measurements
    const heightFeet = parseInt(body.heightFeet, 10);
    const heightInches = parseInt(body.heightInches, 10);
    const weightLbs = parseFloat(body.weightLbs);
    const totalHeightInches = heightFeet * 12 + heightInches;
    const bmi = calculateBMI(totalHeightInches, weightLbs);

    // Build partner note from treatment preferences
    const partnerNote = buildPartnerNote(body);

    // Build medication packages for local storage
    const medicationPackages = selectedMedications.map((productId: string) => ({
      productId,
      name: productId,
      duration: 30,
      medicationType: 'Injection',
    }));

    // Build wellness questionnaire with goals
    const wellnessQuestionnaire = (() => {
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
    })();

    // Generate a local patient ID
    const localPatientId = Date.now();

    // Save intake to local database
    if (process.env.POSTGRES_URL && body.stripeSessionId) {
      try {
        const { sql } = await import('@vercel/postgres');

        await sql`
          UPDATE pending_intakes
          SET
            intake_status = 'completed',
            completed_at = NOW(),
            intake_data = intake_data || ${JSON.stringify({
              asher_patient_id: localPatientId,
              submitted_at: new Date().toISOString(),
              treatmentPreferences: body.treatmentPreferences || null,
              currentMedications: body.currentMedications || null,
              partnerNote: partnerNote || null,
              goalsMotivation: body.goalsMotivation || null,
              wellnessQuestionnaire,
              physicalMeasurements: {
                height: totalHeightInches,
                weight: weightLbs,
                bmi,
              },
              firstName: body.firstName,
              lastName: body.lastName,
              phone: body.phone,
              selectedMedications,
            })}::jsonb
          WHERE stripe_payment_intent_id = ${body.stripeSessionId}
            OR intake_data->>'session_id' = ${body.stripeSessionId}
        `;

        // Create asher_orders record (table still used for local order tracking)
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
            ${localPatientId},
            ${localPatientId},
            ${body.email.toLowerCase()},
            'new',
            'pending',
            ${partnerNote},
            ${JSON.stringify(medicationPackages)},
            ${body.stripeSessionId || null},
            NOW()
          )
        `;

      } catch (dbError) {
        console.error('Failed to update database:', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
    }

    // Auto-link portal session with patient ID
    if (body.phone) {
      try {
        const phoneE164 = formatPhoneNumber(body.phone);
        await updatePortalEhrPatientId(phoneE164, String(localPatientId));
      } catch {
        // Non-fatal: portal session link failed, user can still re-login to get linked
      }
    }

    // Log successful submission (no PHI)
    console.log('Intake form submitted:', {
      timestamp: new Date().toISOString(),
      medicationCount: selectedMedications.length,
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
      patientId: localPatientId,
    });
  } catch (error) {
    console.error('[intake/submit] Failed:', {
      message: error instanceof Error ? error.message : String(error),
    });

    // Still save intake to DB so it appears in admin dashboard
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');
        const body = await request.clone().json().catch(() => null);
        if (body?.email) {
          await sql`
            INSERT INTO pending_intakes (
              stripe_payment_intent_id, customer_email, plan_tier,
              intake_status, intake_data, created_at, updated_at
            ) VALUES (
              ${body.stripeSessionId || null},
              ${body.email.toLowerCase()},
              ${body.planTier || 'unknown'},
              'failed',
              ${JSON.stringify({
                session_id: body.stripeSessionId || null,
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone,
                selectedMedications: body.selectedMedications || [],
                submitted_at: new Date().toISOString(),
                error: error instanceof Error ? error.message : String(error),
              })}::jsonb,
              NOW(), NOW()
            )
            ON CONFLICT DO NOTHING
          `;
        }
      } catch {
        // Non-fatal: DB save failed too
      }
    }

    return NextResponse.json(
      { success: false, error: 'Unable to submit intake form. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

