import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { calculateBMI } from '@/lib/utils/health';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { updatePortalEhrPatientId } from '@/lib/portal-db';
import { buildPartnerNote } from '@/lib/intake-utils';
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
 * - Consent signatures (boolean flags from Typeform UI)
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null = null;

  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    body = await request.json();
    const normalizedAuthEmail = auth.email.toLowerCase().trim();
    const normalizedBodyEmail = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';

    if (normalizedBodyEmail && normalizedBodyEmail !== normalizedAuthEmail) {
      return NextResponse.json(
        { success: false, error: 'Submitted email must match the authenticated session.' },
        { status: 403 }
      );
    }

    const shippingAddress =
      body.shippingAddress && typeof body.shippingAddress === 'object' && !Array.isArray(body.shippingAddress)
        ? (body.shippingAddress as Record<string, unknown>)
        : null;

    const normalizedShippingAddress = shippingAddress
      ? {
          address1: String(shippingAddress.address1 || '').trim(),
          address2: String(shippingAddress.address2 || '').trim(),
          city: String(shippingAddress.city || '').trim(),
          state: String(shippingAddress.state || '').trim().toUpperCase(),
          zipCode: String(shippingAddress.zipCode || '').trim(),
        }
      : null;

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
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (
      !normalizedShippingAddress ||
      !normalizedShippingAddress.address1 ||
      !normalizedShippingAddress.city ||
      !normalizedShippingAddress.state ||
      !normalizedShippingAddress.zipCode
    ) {
      missingFields.push('shippingAddress');
    }
    if (body.emailConsent === undefined || body.emailConsent === null) missingFields.push('emailConsent');
    if (body.marketingConsent === undefined || body.marketingConsent === null) missingFields.push('marketingConsent');
    if (body.telehealthConsent === undefined || body.telehealthConsent === null) missingFields.push('telehealthConsent');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    const firstName = String(body.firstName);
    const lastName = String(body.lastName);
    const phone = String(body.phone);
    const dateOfBirth = String(body.dateOfBirth);
    const gender = String(body.gender);

    // Validate medication selection (support both old and new format)
    const selectedMedications = Array.isArray(body.selectedMedications)
      ? body.selectedMedications.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : typeof body.selectedMedication === 'string' && body.selectedMedication
        ? [body.selectedMedication]
        : [];

    if (selectedMedications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one medication must be selected' },
        { status: 400 }
      );
    }

    // Calculate physical measurements
    const heightFeet = parseInt(String(body.heightFeet), 10);
    const heightInches = parseInt(String(body.heightInches), 10);
    const weightLbs = parseFloat(String(body.weightLbs));
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
      const base =
        body.wellnessQuestionnaire &&
        typeof body.wellnessQuestionnaire === 'object' &&
        !Array.isArray(body.wellnessQuestionnaire)
          ? (body.wellnessQuestionnaire as Record<string, unknown>)
          : {};
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

    const personalInformation = {
      firstName,
      lastName,
      email: normalizedBodyEmail,
      phone,
      dateOfBirth,
      gender,
    };

    // Generate a local patient ID (use seconds to avoid 32-bit integer overflow in DB)
    const localPatientId = Math.floor(Date.now() / 1000);
    let resolvedStripeSessionId =
      typeof body.stripeSessionId === 'string' && body.stripeSessionId.trim()
        ? body.stripeSessionId.trim()
        : null;
    let pendingIntakeId: number | null = null;

    const intakeDataPayload = {
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
      consents: {
        emailConsent: body.emailConsent,
        marketingConsent: body.marketingConsent,
        telehealthConsent: body.telehealthConsent,
      },
      personalInformation,
      email: normalizedBodyEmail,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      shippingAddress: normalizedShippingAddress,
      selectedMedications,
      medicationPackages,
    };

    // Save intake to local database
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');

        if (!resolvedStripeSessionId) {
          const pendingIntakeResult = await sql`
            SELECT id, stripe_payment_intent_id, intake_data->>'session_id' AS session_id
            FROM pending_intakes
            WHERE lower(customer_email) = ${normalizedAuthEmail}
              AND intake_status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
          `;

          if (pendingIntakeResult.rows[0]) {
            pendingIntakeId = Number(pendingIntakeResult.rows[0].id);
            resolvedStripeSessionId =
              pendingIntakeResult.rows[0].stripe_payment_intent_id ||
              pendingIntakeResult.rows[0].session_id ||
              null;
          }
        }

        if (pendingIntakeId) {
          await sql`
            UPDATE pending_intakes
            SET
              intake_status = 'completed',
              completed_at = NOW(),
              intake_data = intake_data || ${JSON.stringify(intakeDataPayload)}::jsonb
            WHERE id = ${pendingIntakeId}
          `;
        } else if (resolvedStripeSessionId) {
          await sql`
            UPDATE pending_intakes
            SET
              intake_status = 'completed',
              completed_at = NOW(),
              intake_data = intake_data || ${JSON.stringify(intakeDataPayload)}::jsonb
            WHERE stripe_payment_intent_id = ${resolvedStripeSessionId}
              OR intake_data->>'session_id' = ${resolvedStripeSessionId}
          `;
        }

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
            ${normalizedBodyEmail},
            'new',
            'pending',
            ${partnerNote},
            ${JSON.stringify(medicationPackages)},
            ${resolvedStripeSessionId},
            NOW()
          )
        `;

        await sql`
          INSERT INTO member_onboarding (email, step, intake_completed)
          VALUES (${normalizedBodyEmail}, 'schedule', TRUE)
          ON CONFLICT (email) DO UPDATE
          SET
            intake_completed = TRUE,
            step = CASE
              WHEN member_onboarding.appointment_scheduled THEN member_onboarding.step
              WHEN member_onboarding.step IN ('intake', 'welcome', 'blood-test') THEN 'schedule'
              ELSE member_onboarding.step
            END,
            updated_at = NOW()
        `;

      } catch (dbError) {
        console.error('Failed to update database:', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
    }

    // Auto-link portal session with patient ID
    if (phone) {
      try {
        const phoneE164 = formatPhoneNumber(phone);
        await updatePortalEhrPatientId(phoneE164, String(localPatientId));
      } catch {
        // Non-fatal: portal session link failed, user can still re-login to get linked
      }
    }

    // Log successful submission (no PHI)
    console.log('Intake form submitted:', {
      timestamp: new Date().toISOString(),
      medicationCount: selectedMedications.length,
      hasEmailConsent: body.emailConsent,
      hasMarketingConsent: body.marketingConsent,
      hasTelehealthConsent: body.telehealthConsent,
    });

    // Tag Mailchimp contact as intake complete (non-blocking)
    if (normalizedBodyEmail) {
      addTagsToContact(normalizedBodyEmail, ['intake-complete']).catch((err) =>
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
        if (body?.email) {
          const failedStripeSessionId =
            typeof body.stripeSessionId === 'string' && body.stripeSessionId.trim()
              ? body.stripeSessionId.trim()
              : null;
          const failedPlanTier =
            typeof body.planTier === 'string' && body.planTier.trim()
              ? body.planTier.trim()
              : 'unknown';
          const failedSelectedMedications = Array.isArray(body.selectedMedications)
            ? body.selectedMedications.filter((value): value is string => typeof value === 'string')
            : [];

          await sql`
            INSERT INTO pending_intakes (
              stripe_payment_intent_id, customer_email, plan_tier,
              intake_status, intake_data, created_at, updated_at
            ) VALUES (
              ${failedStripeSessionId},
              ${String(body.email).toLowerCase()},
              ${failedPlanTier},
              'failed',
              ${JSON.stringify({
                session_id: failedStripeSessionId,
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone,
                selectedMedications: failedSelectedMedications,
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
