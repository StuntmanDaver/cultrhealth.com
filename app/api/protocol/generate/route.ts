import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { generateProtocol, generateCombinedProtocol } from '@/lib/protocol-templates'
import { createCarePlan, createDocument, enrollInProgram, getPatientById } from '@/lib/healthie-api'

type ProtocolRequest = {
  templateId?: string
  symptomIds?: string[]
  patientHealthieId?: string
  parameters?: Record<string, string | number | boolean>
  courseMembershipId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !isProviderEmail(session.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ProtocolRequest
    const { templateId, symptomIds, patientHealthieId, parameters, courseMembershipId } = body

    if ((!templateId && !symptomIds?.length) || !patientHealthieId) {
      return NextResponse.json({ error: 'Template/Symptoms and patientHealthieId are required' }, { status: 400 })
    }

    const patient = await getPatientById(patientHealthieId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // ────────────────────────────────────────────────────────────────────────
    // BRANCH 1: TEMPLATE BASED (Original)
    // ────────────────────────────────────────────────────────────────────────
    if (templateId) {
      const generated = generateProtocol(templateId, parameters || {})
      if (!generated) {
        return NextResponse.json({ error: 'Invalid protocol template' }, { status: 400 })
      }

      const carePlan = await createCarePlan({
        name: generated.name,
        patientId: patient.id,
        isHidden: false,
      })

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

      await createDocument({
        title: `${generated.name} Summary`,
        content: summaryContent,
        patientId: patient.id,
        carePlanId: carePlan.id,
        description: 'Protocol summary and monitoring cadence.',
      })

      for (const doc of generated.documents) {
        await createDocument({
          title: doc.title,
          content: doc.content,
          patientId: patient.id,
          carePlanId: carePlan.id,
        })
      }

      if (courseMembershipId) {
        await enrollInProgram({ courseMembershipId })
      }

      // Log generation
      if (process.env.POSTGRES_URL) {
        const { sql } = await import('@vercel/postgres')
        await sql`
          INSERT INTO protocol_generations (
            provider_email,
            patient_healthie_id,
            template_id,
            parameters,
            healthie_care_plan_id,
            created_at
          ) VALUES (
            ${session.email},
            ${patient.id},
            ${generated.templateId},
            ${JSON.stringify(generated.parameters)},
            ${carePlan.id},
            NOW()
          )
        `
      }

      return NextResponse.json({
        success: true,
        carePlanId: carePlan.id,
      })
    }

    // ────────────────────────────────────────────────────────────────────────
    // BRANCH 2: SYMPTOM BASED (New)
    // ────────────────────────────────────────────────────────────────────────
    if (symptomIds?.length) {
      const combined = generateCombinedProtocol(symptomIds)
      if (!combined) {
        return NextResponse.json({ error: 'Invalid symptoms' }, { status: 400 })
      }

      const protocolName = `Custom Protocol: ${combined.symptoms.slice(0, 3).join(', ')}${combined.symptoms.length > 3 ? '...' : ''}`

      const carePlan = await createCarePlan({
        name: protocolName,
        patientId: patient.id,
        isHidden: false,
      })

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

      await createDocument({
        title: 'Custom Protocol Instructions',
        content: documentContent,
        patientId: patient.id,
        carePlanId: carePlan.id,
        description: 'Personalized protocol based on symptom stack.',
      })

      if (courseMembershipId) {
        await enrollInProgram({ courseMembershipId })
      }

      // Log generation
      if (process.env.POSTGRES_URL) {
        const { sql } = await import('@vercel/postgres')
        await sql`
          INSERT INTO protocol_generations (
            provider_email,
            patient_healthie_id,
            template_id,
            parameters,
            healthie_care_plan_id,
            created_at
          ) VALUES (
            ${session.email},
            ${patient.id},
            'custom-symptom-stack',
            ${JSON.stringify({ symptomIds })},
            ${carePlan.id},
            NOW()
          )
        `
      }

      return NextResponse.json({
        success: true,
        carePlanId: carePlan.id,
      })
    }

    return NextResponse.json({ error: 'Invalid request state' }, { status: 400 })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
