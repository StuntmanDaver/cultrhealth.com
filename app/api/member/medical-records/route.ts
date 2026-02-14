import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/medical-records
 *
 * Fetches a sanitized summary of the authenticated member's medical records.
 * Sources: pending_intakes table (intake form data) + Asher Med patient data.
 * HIPAA: Never exposes consent signatures, internal IDs, or raw clinical notes.
 */
export async function GET(request: NextRequest) {
  try {
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

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ success: true, records: null });
    }

    const { sql } = await import('@vercel/postgres');

    // Get the most recent completed intake data
    const intakeResult = await sql`
      SELECT
        intake_data,
        created_at
      FROM pending_intakes
      WHERE lower(customer_email) = ${email}
        AND intake_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (intakeResult.rows.length === 0) {
      return NextResponse.json({ success: true, records: null });
    }

    const intakeData = intakeResult.rows[0].intake_data as Record<string, unknown> | null;

    if (!intakeData) {
      return NextResponse.json({ success: true, records: null });
    }

    // Extract sanitized fields — no consent signatures, internal IDs, or clinical notes
    const personalInfo = intakeData.personalInformation as Record<string, unknown> | undefined;
    const physicalMeasurements = intakeData.physicalMeasurements as Record<string, unknown> | undefined;
    const medicationPackages = intakeData.medicationPackages as Array<{ name?: string; medicationType?: string; duration?: number }> | undefined;
    const treatmentPreferences = intakeData.treatmentPreferences as Record<string, unknown> | undefined;

    const records: {
      personal: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        gender?: string;
      };
      measurements: {
        height?: number;
        weight?: number;
        bmi?: number;
        bodyFat?: number;
      };
      medications: Array<{ name: string; type?: string; duration?: number }>;
      treatmentPreferences: Record<string, unknown>;
      lastUpdated: string;
    } = {
      personal: {
        firstName: personalInfo?.firstName as string | undefined,
        lastName: personalInfo?.lastName as string | undefined,
        dateOfBirth: personalInfo?.dateOfBirth as string | undefined,
        gender: personalInfo?.gender as string | undefined,
      },
      measurements: {
        height: physicalMeasurements?.height as number | undefined,
        weight: physicalMeasurements?.weight as number | undefined,
        bmi: physicalMeasurements?.bmi as number | undefined,
        bodyFat: physicalMeasurements?.currentBodyFat as number | undefined,
      },
      medications: (medicationPackages || []).map((pkg) => ({
        name: pkg.name || 'Unknown',
        type: pkg.medicationType,
        duration: pkg.duration,
      })),
      treatmentPreferences: {
        providerCustomSolution: treatmentPreferences?.providerCustomSolution,
        muscleLossPrevention: treatmentPreferences?.providerCustomSolutionMuscleLoss,
      },
      lastUpdated: intakeResult.rows[0].created_at,
    };

    // Enrich with Asher Med patient data if available
    const asherPatientId = intakeData.asher_patient_id as number | undefined;
    if (process.env.ASHER_MED_API_KEY && asherPatientId) {
      try {
        const { getPatientById } = await import('@/lib/asher-med-api');
        const patient = await getPatientById(asherPatientId);

        if (patient) {
          // Use Asher Med as source of truth for current measurements
          records.personal.firstName = patient.firstName || records.personal.firstName;
          records.personal.lastName = patient.lastName || records.personal.lastName;
          records.personal.dateOfBirth = patient.dateOfBirth || records.personal.dateOfBirth;
          records.personal.gender = patient.gender || records.personal.gender;

          if (patient.height) records.measurements.height = patient.height;
          if (patient.weight) records.measurements.weight = patient.weight;
          if (patient.bmi) records.measurements.bmi = patient.bmi;
          if (patient.currentBodyFat) records.measurements.bodyFat = patient.currentBodyFat;
        }
      } catch {
        // Asher Med unavailable — use intake data
      }
    }

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Failed to fetch medical records:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}
