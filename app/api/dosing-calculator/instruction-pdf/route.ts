import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calcPeptide } from '@/lib/peptide-calculator'
import {
  renderInstructionPdfBuffer,
  type InstructionPdfInput,
} from '@/lib/dosing-calculator/instruction-card-pdf'
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const BodySchema = z.object({
  therapyLabel: z.string().trim().max(80).optional().nullable(),
  therapyCompound: z.string().trim().max(120).optional().nullable(),
  vialMg: z.number().positive().max(10000),
  waterMl: z.number().positive().max(100),
  dose: z.number().positive().max(10000),
  doseUnit: z.enum(['mcg', 'mg']),
  syringeMl: z.number().positive().max(10).optional().nullable(),
  frequency: z
    .enum(['daily', 'every-other-day', 'twice-weekly', 'weekly', 'biweekly'])
    .optional()
    .nullable(),
  therapyLengthWeeks: z.number().int().positive().max(52).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const ip = await getClientIp()
  const limit = await apiLimiter.check(`dosing-pdf:${ip}`)
  if (!limit.success) {
    return rateLimitResponse(limit)
  }

  let payload: z.infer<typeof BodySchema>
  try {
    const json = await request.json()
    payload = BodySchema.parse(json)
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map((i) => i.message).join('; ') : 'Invalid request body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const result = calcPeptide({
    vialMg: payload.vialMg,
    waterMl: payload.waterMl,
    dose: payload.dose,
    doseUnit: payload.doseUnit,
    syringeMl: payload.syringeMl ?? undefined,
    frequency: payload.frequency ?? undefined,
    therapyLengthWeeks: payload.therapyLengthWeeks ?? undefined,
  })

  if (!result.isValid) {
    return NextResponse.json(
      { error: 'Inputs did not produce a valid calculation', warnings: result.warnings },
      { status: 400 }
    )
  }

  const pdfInput: InstructionPdfInput = {
    therapyLabel: payload.therapyLabel ?? null,
    therapyCompound: payload.therapyCompound ?? null,
    vialMg: payload.vialMg,
    waterMl: payload.waterMl,
    dose: payload.dose,
    doseUnit: payload.doseUnit,
    drawMl: result.drawMl,
    drawUnitsU100: result.drawUnitsU100,
    concentrationMgPerMl: result.concentrationMgPerMl,
    syringeMl: payload.syringeMl ?? null,
    warnings: result.warnings,
    totalMg: result.therapyTotals?.totalMg ?? null,
    totalVials: result.therapyTotals?.totalVials ?? null,
    daysPerVial: result.therapyTotals?.daysPerVial ?? null,
    generatedAt: new Date(),
  }

  try {
    const buffer = await renderInstructionPdfBuffer(pdfInput)
    const filename = `cultr-dosing-instructions${payload.therapyLabel ? '-' + slug(payload.therapyLabel) : ''}.pdf`
    const body = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('instruction-pdf render error', error)
    return NextResponse.json({ error: 'Failed to render PDF' }, { status: 500 })
  }
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
