export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { US_STATES } from '@/lib/config/us-states'
import { sql } from '@vercel/postgres'
import { z } from 'zod'

// Valid US state abbreviations for validation
const validStateCodes = US_STATES.map((s) => s.code)

const addressSchema = z.object({
  address1: z.string().min(1, 'Street address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z
    .string()
    .length(2, 'State must be a 2-letter abbreviation')
    .refine((val) => (validStateCodes as string[]).includes(val), {
      message: 'Invalid US state abbreviation',
    }),
  zipCode: z
    .string()
    .regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
})

// --------------------------------------------------
// GET — Read patient profile from local DB
// --------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // No patient linked yet
  if (!auth.ehrPatientId) {
    return NextResponse.json({ success: true, profile: null })
  }

  try {
    // Look up profile from local portal_sessions + pending_intakes
    const sessionResult = await sql`
      SELECT first_name, last_name, phone_e164
      FROM portal_sessions
      WHERE ehr_patient_id = ${auth.ehrPatientId}
      LIMIT 1
    `

    // Get intake data for fuller profile
    const intakeResult = await sql`
      SELECT intake_data
      FROM pending_intakes
      WHERE intake_data->>'asher_patient_id' = ${String(auth.ehrPatientId)}
        AND intake_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `

    const session = sessionResult.rows[0]
    const intakeData = intakeResult.rows[0]?.intake_data as Record<string, unknown> | null

    if (!session && !intakeData) {
      return NextResponse.json({ success: true, profile: null })
    }

    const shippingAddress = intakeData?.shippingAddress as Record<string, string> | undefined

    const profile = {
      firstName: (intakeData?.firstName as string) || session?.first_name || '',
      lastName: (intakeData?.lastName as string) || session?.last_name || '',
      email: (intakeData?.email as string) || '',
      phone: (intakeData?.phone as string) || session?.phone_e164 || '',
      dateOfBirth: (intakeData?.dateOfBirth as string) || '',
      gender: (intakeData?.gender as string) || '',
      address: {
        address1: shippingAddress?.address1 || '',
        address2: shippingAddress?.address2 || null,
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        zipCode: shippingAddress?.zipCode || '',
      },
      measurements: {
        height: (intakeData?.physicalMeasurements as Record<string, number> | undefined)?.height ?? null,
        weight: (intakeData?.physicalMeasurements as Record<string, number> | undefined)?.weight ?? null,
        bmi: (intakeData?.physicalMeasurements as Record<string, number> | undefined)?.bmi ?? null,
      },
    }

    return NextResponse.json({ success: true, profile })
  } catch (err) {
    console.error('Profile GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Unable to load profile' },
      { status: 502 }
    )
  }
}

// --------------------------------------------------
// PUT — Update shipping address in local DB
// // TODO: Reconnect to new pharmacy partner
// --------------------------------------------------

export async function PUT(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.ehrPatientId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const parsed = addressSchema.parse(body.address)

    // Update the most recent completed intake with new address
    await sql`
      UPDATE pending_intakes
      SET intake_data = intake_data || ${JSON.stringify({
        shippingAddress: {
          address1: parsed.address1,
          address2: parsed.address2 || '',
          city: parsed.city,
          state: parsed.state,
          zipCode: parsed.zipCode,
        },
      })}::jsonb,
      updated_at = NOW()
      WHERE intake_data->>'asher_patient_id' = ${String(auth.ehrPatientId)}
        AND intake_status = 'completed'
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid address data',
          details: err.errors.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    console.error('Profile PUT error:', err)
    return NextResponse.json(
      { success: false, error: 'Unable to update address' },
      { status: 502 }
    )
  }
}
