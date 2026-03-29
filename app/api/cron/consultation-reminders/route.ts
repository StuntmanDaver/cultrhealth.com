import { NextRequest, NextResponse } from 'next/server'
import { getConsultationsNeedingReminder, markReminderSent } from '@/lib/consultations-db'
import { sendConsultationReminder } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consultations = await getConsultationsNeedingReminder()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

    let sent = 0
    let failed = 0

    for (const consultation of consultations) {
      try {
        await sendConsultationReminder({
          patientName: consultation.customer_email.split('@')[0],
          patientEmail: consultation.customer_email,
          providerName: consultation.provider_email || 'Your provider',
          scheduledAt: new Date(consultation.scheduled_at!),
          joinUrl: `${siteUrl}/consultations/${consultation.id}`,
        })
        await markReminderSent(consultation.id)
        sent++
      } catch (err) {
        console.error(`Failed to send reminder for consultation ${consultation.id}:`, err)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      total: consultations.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Cron consultation-reminders error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
