export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getPatientById, updatePatient } from '@/lib/asher-med-api'
import { US_STATES } from '@/lib/config/asher-med'
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
// GET — Read patient profile from Asher Med
// --------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // Case C user: no Asher Med patient linked yet
  if (!auth.asherPatientId) {
    return NextResponse.json({ success: true, profile: null })
  }

  try {
    const patient = await getPatientById(auth.asherPatientId)

    const profile = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phoneNumber,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: {
        address1: patient.address1 || '',
        address2: patient.address2 || null,
        city: patient.city || '',
        state: patient.stateAbbreviation || '',
        zipCode: patient.zipcode || '',
      },
      measurements: {
        height: patient.height ?? null,
        weight: patient.weight ?? null,
        bmi: patient.bmi ?? null,
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
// PUT — Update shipping address, sync to Asher Med
// --------------------------------------------------

export async function PUT(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.asherPatientId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const parsed = addressSchema.parse(body.address)

    await updatePatient(auth.asherPatientId, {
      address1: parsed.address1,
      address2: parsed.address2 || null,
      city: parsed.city,
      stateAbbreviation: parsed.state,
      zipcode: parsed.zipCode,
      country: 'US',
    })

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
