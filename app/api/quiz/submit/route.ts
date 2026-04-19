import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { z } from 'zod'
import { createWaitlistEntry } from '@/lib/db'
import { sendFounderNotification } from '@/lib/resend'

const postSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  recommendedTier: z.enum(['club', 'core', 'catalyst', 'concierge']),
  recommendedTherapy: z.string().nullable().optional(),
})

const patchSchema = z.object({
  sessionId: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  recommendedTier: z.string().optional(),
  primaryGoal: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = postSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { sessionId, answers, recommendedTier, recommendedTherapy } = parsed.data

    await sql`
      INSERT INTO quiz_responses (session_id, answers, recommended_tier, recommended_therapy)
      VALUES (${sessionId}, ${JSON.stringify(answers)}::jsonb, ${recommendedTier}, ${recommendedTherapy ?? null})
    `

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json({ error: 'Failed to save quiz response' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { sessionId, firstName, lastName, email, phone, recommendedTier, primaryGoal } = parsed.data

    if (firstName || email) {
      await sql`
        UPDATE quiz_responses
        SET
          clicked_join = true,
          lead_first_name = COALESCE(${firstName ?? null}, lead_first_name),
          lead_last_name  = COALESCE(${lastName ?? null},  lead_last_name),
          lead_email      = COALESCE(${email ?? null},     lead_email),
          lead_phone      = COALESCE(${phone ?? null},     lead_phone),
          lead_captured_at = CASE WHEN ${email ?? null}::text IS NOT NULL THEN NOW() ELSE lead_captured_at END
        WHERE session_id = ${sessionId}
      `

      // Mirror the lead into the waitlist table so it surfaces in the admin
      // Marketing dashboard (Waitlist tab) and triggers a founder notification.
      if (email && firstName) {
        const fullName = `${firstName}${lastName ? ' ' + lastName : ''}`.trim()
        const source = recommendedTier ? `quiz:${recommendedTier}` : 'quiz'
        try {
          const entry = await createWaitlistEntry({
            name: fullName,
            email,
            phone: phone ?? 'Not Provided',
            treatment_reason: primaryGoal ?? '',
            source,
          })
          if (process.env.RESEND_API_KEY) {
            sendFounderNotification(
              {
                waitlist_id: entry.id,
                name: fullName,
                email,
                phone: phone ?? 'Not Provided',
                social_handle: '',
                treatment_reason: primaryGoal ?? '',
                timestamp: new Date(),
              },
              { to: 'admin@cultrhealth.com' }
            ).catch(() => { /* non-fatal */ })
          }
        } catch (waitlistError) {
          // Quiz lead was still saved on quiz_responses — don't fail the request.
          console.error('Quiz→waitlist mirror failed:', waitlistError)
        }
      }
    } else {
      await sql`
        UPDATE quiz_responses SET clicked_join = true WHERE session_id = ${sessionId}
      `
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Quiz join tracking error:', error)
    return NextResponse.json({ error: 'Failed to track join click' }, { status: 500 })
  }
}
