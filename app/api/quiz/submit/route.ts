import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { z } from 'zod'

const postSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  recommendedTier: z.enum(['club', 'core', 'catalyst', 'concierge']),
  recommendedTherapy: z.string().nullable().optional(),
})

const patchSchema = z.object({
  sessionId: z.string().min(1),
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

    const { sessionId } = parsed.data

    await sql`
      UPDATE quiz_responses SET clicked_join = true WHERE session_id = ${sessionId}
    `

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Quiz join tracking error:', error)
    return NextResponse.json({ error: 'Failed to track join click' }, { status: 500 })
  }
}
