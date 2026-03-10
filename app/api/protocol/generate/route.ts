import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { generateProtocol, generateCombinedProtocol } from '@/lib/protocol-templates'

type ProtocolRequest = {
  templateId?: string
  symptomIds?: string[]
  patientId?: string
  parameters?: Record<string, string | number | boolean>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !isProviderEmail(session.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ProtocolRequest
    const { templateId, symptomIds, patientId, parameters } = body

    if ((!templateId && !symptomIds?.length) || !patientId) {
      return NextResponse.json({ error: 'Template/Symptoms and patientId are required' }, { status: 400 })
    }

    // Verify patient exists in Asher Med
    const { getPatientById } = await import('@/lib/asher-med-api')
    const patient = await getPatientById(Number(patientId))
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // ────────────────────────────────────────────────────────────────────────
    // BRANCH 1: TEMPLATE BASED
    // ────────────────────────────────────────────────────────────────────────
    if (templateId) {
      const generated = generateProtocol(templateId, parameters || {})
      if (!generated) {
        return NextResponse.json({ error: 'Invalid protocol template' }, { status: 400 })
      }

      const summaryContent = [
        `Protocol: ${generated.name}`,
        `Summary: ${generated.summary}`,
        '',
        'Phases:',
        ...generated.phases.map(
          (phase) => `- ${phase.name} (Weeks ${phase.weekStart}-${phase.weekEnd}): ${phase.instructions}`
        ),
        '',
        'Monitoring:',
        ...generated.monitoringSchedule.map((item) => `- ${item.label}: ${item.cadence}`),
      ].join('\n')

      // Store protocol in local DB
      let protocolId: string | undefined
      if (process.env.POSTGRES_URL) {
        const { sql } = await import('@vercel/postgres')
        const result = await sql`
          INSERT INTO protocol_generations (
            provider_email,
            asher_patient_id,
            template_id,
            parameters,
            protocol_notes,
            created_at
          ) VALUES (
            ${session.email},
            ${patient.id},
            ${generated.templateId},
            ${JSON.stringify(generated.parameters)},
            ${summaryContent},
            NOW()
          )
          RETURNING id
        `
        protocolId = result.rows[0]?.id
      }

      return NextResponse.json({
        success: true,
        protocolId,
        protocolName: generated.name,
      })
    }

    // ────────────────────────────────────────────────────────────────────────
    // BRANCH 2: SYMPTOM BASED
    // ────────────────────────────────────────────────────────────────────────
    if (symptomIds?.length) {
      const combined = generateCombinedProtocol(symptomIds)
      if (!combined) {
        return NextResponse.json({ error: 'Invalid symptoms' }, { status: 400 })
      }

      const protocolName = `Custom Protocol: ${combined.symptoms.slice(0, 3).join(', ')}${combined.symptoms.length > 3 ? '...' : ''}`

      const documentContent = [
        `CUSTOM PROTOCOL FOR: ${combined.symptoms.join(', ')}`,
        '',
        'INTERVENTIONS',
        '----------------------------------------',
        ...combined.interventions.map((item) => {
          const typeLabel = item.type === 'peptide' ? '[PEPTIDE]' : '[SUPPLEMENT]'
          const details = item.details.map(d =>
            `  • ${d.dosageRange} (${d.timing})${d.notes ? ` - ${d.notes}` : ''}`
          ).join('\n')
          return `${typeLabel} ${item.name}\n${details}\n`
        }),
        '',
        'MONITORING PLAN',
        '----------------------------------------',
        ...combined.monitoring.map(m => `- ${m}`),
        '',
        'CONTRAINDICATIONS',
        '----------------------------------------',
        ...combined.contraindications.map(c => `! ${c}`),
      ].join('\n')

      // Store protocol in local DB
      let protocolId: string | undefined
      if (process.env.POSTGRES_URL) {
        const { sql } = await import('@vercel/postgres')
        const result = await sql`
          INSERT INTO protocol_generations (
            provider_email,
            asher_patient_id,
            template_id,
            parameters,
            protocol_notes,
            created_at
          ) VALUES (
            ${session.email},
            ${patient.id},
            'custom-symptom-stack',
            ${JSON.stringify({ symptomIds })},
            ${documentContent},
            NOW()
          )
          RETURNING id
        `
        protocolId = result.rows[0]?.id
      }

      return NextResponse.json({
        success: true,
        protocolId,
        protocolName,
      })
    }

    return NextResponse.json({ error: 'Invalid request state' }, { status: 400 })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
