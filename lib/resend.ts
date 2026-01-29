import { Resend } from 'resend'

// ===========================================
// RESEND EMAIL CLIENT
// ===========================================

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return resend
}

// Common email result type
interface EmailResult {
  success: boolean
  error?: string
}

// Get configured from email
function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
}

// ===========================================
// EMAIL BASE TEMPLATE
// ===========================================

function baseEmailTemplate(content: string, footerText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-size: 28px; font-weight: 300; letter-spacing: 0.3em; color: #fff;">CULTR</span>
    </div>
    
    ${content}
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #222;">
      <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
        ${footerText || 'CULTR Health — Personalized Longevity Medicine'}
      </p>
      <p style="color: #444; font-size: 11px; text-align: center; margin-top: 12px;">
        Questions? Reply to this email or contact support@cultrhealth.com
      </p>
    </div>
  </div>
</body>
</html>
`
}

// ===========================================
// TYPE DEFINITIONS
// ===========================================

interface FounderNotificationData {
  waitlist_id: string
  name: string
  email: string
  phone: string
  social_handle?: string
  treatment_reason?: string
  timestamp: Date
}

export async function sendFounderNotification(data: FounderNotificationData): Promise<{ success: boolean; error?: string }> {
  const founderEmail = process.env.FOUNDER_EMAIL
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

  if (!founderEmail) {
    console.error('FOUNDER_EMAIL environment variable is not set')
    return { success: false, error: 'Founder email not configured' }
  }

  const { waitlist_id, name, email, phone, social_handle, treatment_reason, timestamp } = data

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.1em; margin-bottom: 30px; color: #fff;">
      New Waitlist Signup
    </h1>
    
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; width: 140px;">Name</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222;">
            <a href="mailto:${email}" style="color: #c9a962; text-decoration: none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222;">
            <a href="tel:${phone}" style="color: #c9a962; text-decoration: none;">${phone}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Social Handle</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${social_handle || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; vertical-align: top;">Treatment Reason</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${treatment_reason || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Timestamp</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${timestamp.toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #888;">Waitlist ID</td>
          <td style="padding: 12px 0; color: #666; font-family: monospace; font-size: 12px;">${waitlist_id}</td>
        </tr>
      </table>
    </div>

    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This notification was sent from the CULTR waitlist system.
    </p>
  </div>
</body>
</html>
`

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: fromEmail,
      to: founderEmail,
      subject: `New CULTR Waitlist Signup: ${name}`,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send founder notification:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// WELCOME EMAIL (New Members)
// ===========================================

interface WelcomeEmailData {
  name: string
  email: string
  planName: string
  healthiePortalUrl: string
  stripePortalUrl?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  const { name, email, planName, healthiePortalUrl, stripePortalUrl } = data
  const firstName = name.split(' ')[0]

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #fff; margin-bottom: 24px;">
      Welcome to CULTR, ${firstName}.
    </h1>
    
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Your <strong style="color: #c9a962;">${planName}</strong> membership is now active. 
      You're one step closer to optimized health and longevity.
    </p>
    
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 16px 0;">
        Your Next Steps
      </h2>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; width: 24px; height: 24px; background: #c9a962; color: #000; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">1</span>
        <span style="color: #fff;">Complete your intake forms (required before consultation)</span>
      </div>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; width: 24px; height: 24px; background: #c9a962; color: #000; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">2</span>
        <span style="color: #fff;">Book your initial consultation with a provider</span>
      </div>
      
      <div>
        <span style="display: inline-block; width: 24px; height: 24px; background: #c9a962; color: #000; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">3</span>
        <span style="color: #fff;">Upload any recent lab work (if available)</span>
      </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${healthiePortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Access Patient Portal
      </a>
    </div>
    
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; border: 1px solid #222;">
      <p style="color: #888; font-size: 14px; margin: 0;">
        <strong style="color: #fff;">Need help?</strong> Our care team is here for you. 
        Simply reply to this email or message us through the patient portal.
      </p>
    </div>
    
    ${stripePortalUrl ? `
    <p style="color: #666; font-size: 12px; margin-top: 24px; text-align: center;">
      <a href="${stripePortalUrl}" style="color: #666; text-decoration: underline;">Manage billing &amp; subscription</a>
    </p>
    ` : ''}
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Welcome to CULTR — Let's Get Started`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Welcome email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Welcome email sent:', { email, planName })
    return { success: true }
  } catch (err) {
    console.error('Failed to send welcome email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// BOOKING CONFIRMATION EMAIL
// ===========================================

interface BookingConfirmationData {
  name: string
  email: string
  appointmentType: string
  appointmentDate: Date
  providerName?: string
  healthiePortalUrl: string
  isVideo: boolean
  meetingLink?: string
}

export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<EmailResult> {
  const { name, email, appointmentType, appointmentDate, providerName, healthiePortalUrl, isVideo, meetingLink } = data
  const firstName = name.split(' ')[0]
  
  // Format date nicely
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short'
  }
  const formattedDate = appointmentDate.toLocaleDateString('en-US', dateOptions)
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', timeOptions)

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #fff; margin-bottom: 24px;">
      Appointment Confirmed
    </h1>
    
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, your appointment has been scheduled.
    </p>
    
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; width: 120px;">Type</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff; font-weight: 500;">${appointmentType}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #c9a962; font-weight: 500;">${formattedTime}</td>
        </tr>
        ${providerName ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Provider</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${providerName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; color: #888;">Format</td>
          <td style="padding: 12px 0; color: #fff;">${isVideo ? '📹 Video Visit' : '📍 In-Person'}</td>
        </tr>
      </table>
    </div>
    
    ${isVideo && meetingLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Join Video Visit
      </a>
      <p style="color: #666; font-size: 12px; margin-top: 12px;">
        Link will be active 10 minutes before your appointment
      </p>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${healthiePortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View in Patient Portal
      </a>
    </div>
    `}
    
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; border: 1px solid #222;">
      <p style="color: #fff; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        Before Your Appointment
      </p>
      <ul style="color: #888; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Complete all intake forms in the patient portal</li>
        <li style="margin-bottom: 6px;">Have your ID ready for verification</li>
        <li style="margin-bottom: 6px;">Prepare a list of current medications</li>
        ${isVideo ? '<li>Test your camera and microphone</li>' : '<li>Arrive 10 minutes early</li>'}
      </ul>
    </div>
    
    <p style="color: #666; font-size: 13px; margin-top: 24px; text-align: center;">
      Need to reschedule? <a href="${healthiePortalUrl}" style="color: #c9a962; text-decoration: none;">Manage your appointment</a> in the patient portal.
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Appointment Confirmed: ${appointmentType} on ${formattedDate}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Booking confirmation error:', error)
      return { success: false, error: error.message }
    }

    console.log('Booking confirmation sent:', { email, appointmentDate })
    return { success: true }
  } catch (err) {
    console.error('Failed to send booking confirmation:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// APPOINTMENT REMINDER EMAIL
// ===========================================

interface AppointmentReminderData {
  name: string
  email: string
  appointmentType: string
  appointmentDate: Date
  providerName?: string
  healthiePortalUrl: string
  isVideo: boolean
  meetingLink?: string
  hoursUntil: number  // 24, 2, etc.
}

export async function sendAppointmentReminder(data: AppointmentReminderData): Promise<EmailResult> {
  const { name, email, appointmentType, appointmentDate, providerName, healthiePortalUrl, isVideo, meetingLink, hoursUntil } = data
  const firstName = name.split(' ')[0]
  
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short'
  }
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', timeOptions)
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const urgencyText = hoursUntil <= 2 
    ? `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`
    : hoursUntil < 24 
      ? `in ${hoursUntil} hours`
      : 'tomorrow'

  const content = `
    <div style="background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="color: #000; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
        Appointment ${urgencyText}
      </p>
    </div>
    
    <h1 style="font-size: 24px; font-weight: 300; color: #fff; margin-bottom: 24px; text-align: center;">
      Hi ${firstName}, just a reminder
    </h1>
    
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="color: #c9a962; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">
        ${appointmentType}
      </p>
      <p style="color: #fff; font-size: 32px; font-weight: 300; margin: 0 0 8px 0;">
        ${formattedTime}
      </p>
      <p style="color: #888; font-size: 14px; margin: 0;">
        ${formattedDate}
      </p>
      ${providerName ? `<p style="color: #666; font-size: 13px; margin: 12px 0 0 0;">with ${providerName}</p>` : ''}
    </div>
    
    ${isVideo && meetingLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); color: #000; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Join Video Visit
      </a>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${healthiePortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); color: #000; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Appointment
      </a>
    </div>
    `}
    
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 16px; border: 1px solid #222; text-align: center;">
      <p style="color: #888; font-size: 13px; margin: 0;">
        Can't make it? Please reschedule at least 24 hours in advance to avoid a cancellation fee.
      </p>
    </div>
  `

  const subjectPrefix = hoursUntil <= 2 ? '⏰ ' : ''
  
  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `${subjectPrefix}Reminder: ${appointmentType} ${urgencyText}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Appointment reminder error:', error)
      return { success: false, error: error.message }
    }

    console.log('Appointment reminder sent:', { email, hoursUntil })
    return { success: true }
  } catch (err) {
    console.error('Failed to send appointment reminder:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// POST-VISIT FOLLOW-UP EMAIL
// ===========================================

interface PostVisitFollowUpData {
  name: string
  email: string
  appointmentType: string
  appointmentDate: Date
  providerName?: string
  healthiePortalUrl: string
  prescriptionsSent?: boolean
  labsOrdered?: boolean
  followUpWeeks?: number
  customNotes?: string
}

export async function sendPostVisitFollowUp(data: PostVisitFollowUpData): Promise<EmailResult> {
  const { 
    name, 
    email, 
    appointmentType, 
    appointmentDate, 
    providerName, 
    healthiePortalUrl,
    prescriptionsSent,
    labsOrdered,
    followUpWeeks,
    customNotes
  } = data
  const firstName = name.split(' ')[0]
  
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  })

  // Build next steps list
  const nextSteps: string[] = []
  if (prescriptionsSent) {
    nextSteps.push('Your prescriptions have been sent to the pharmacy')
  }
  if (labsOrdered) {
    nextSteps.push('Lab orders have been placed — you\'ll receive details separately')
  }
  if (followUpWeeks) {
    nextSteps.push(`Schedule your follow-up visit in ${followUpWeeks} week${followUpWeeks > 1 ? 's' : ''}`)
  }

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #fff; margin-bottom: 24px;">
      Thanks for your visit, ${firstName}.
    </h1>
    
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Here's a summary following your <strong style="color: #fff;">${appointmentType}</strong> on ${formattedDate}${providerName ? ` with ${providerName}` : ''}.
    </p>
    
    ${nextSteps.length > 0 ? `
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: 600; color: #c9a962; margin: 0 0 16px 0;">
        Your Next Steps
      </h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${nextSteps.map(step => `
          <li style="color: #fff; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
            ${step}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${customNotes ? `
    <div style="background-color: #0f1a0f; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 3px solid #c9a962;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
        Provider Notes
      </p>
      <p style="color: #fff; font-size: 14px; line-height: 1.6; margin: 0;">
        ${customNotes}
      </p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${healthiePortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View Visit Summary
      </a>
    </div>
    
    <div style="background-color: #111; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #fff; font-size: 14px; font-weight: 500; margin: 0 0 12px 0;">
        Quick Actions
      </p>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0;">
            <a href="${healthiePortalUrl}" style="color: #c9a962; text-decoration: none; font-size: 14px;">
              → Message your care team
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <a href="${healthiePortalUrl}" style="color: #c9a962; text-decoration: none; font-size: 14px;">
              → Book follow-up appointment
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <a href="${healthiePortalUrl}" style="color: #c9a962; text-decoration: none; font-size: 14px;">
              → View lab results
            </a>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; border: 1px solid #222;">
      <p style="color: #888; font-size: 13px; margin: 0; line-height: 1.6;">
        <strong style="color: #fff;">Questions?</strong> Message us anytime through the patient portal. 
        For urgent medical concerns, please call 911 or visit your nearest emergency room.
      </p>
    </div>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Your Visit Summary — ${appointmentType}`,
      html: baseEmailTemplate(content, 'Thank you for trusting CULTR with your care.'),
    })

    if (error) {
      console.error('Post-visit follow-up error:', error)
      return { success: false, error: error.message }
    }

    console.log('Post-visit follow-up sent:', { email, appointmentType })
    return { success: true }
  } catch (err) {
    console.error('Failed to send post-visit follow-up:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// QUOTE REQUEST NOTIFICATION EMAIL
// ===========================================

export interface QuoteRequestItem {
  sku: string
  name: string
  quantity: number
  doseMg: number
  volumeMl: number
  category: string
}

interface QuoteRequestNotificationData {
  quoteId: string
  email: string
  tier: string | null
  items: QuoteRequestItem[]
  notes?: string
  timestamp: Date
}

export async function sendQuoteRequestNotification(data: QuoteRequestNotificationData): Promise<EmailResult> {
  const founderEmail = process.env.FOUNDER_EMAIL
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

  if (!founderEmail) {
    console.error('FOUNDER_EMAIL environment variable is not set')
    return { success: false, error: 'Founder email not configured' }
  }

  const { quoteId, email, tier, items, notes, timestamp } = data
  
  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueProducts = items.length

  // Build items table rows
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #fff;">${item.name}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #fff; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #888;">${item.sku}</td>
    </tr>
  `).join('')

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 700px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #c9a962 0%, #a08030 100%); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0; color: #000;">
        New Quote Request
      </h1>
    </div>
    
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; width: 140px;">Member Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222;">
            <a href="mailto:${email}" style="color: #c9a962; text-decoration: none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Membership Tier</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff; text-transform: capitalize;">${tier || 'None'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Total Items</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${totalItems} items (${uniqueProducts} unique)</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Timestamp</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${timestamp.toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #888;">Quote ID</td>
          <td style="padding: 12px 0; color: #666; font-family: monospace; font-size: 12px;">${quoteId}</td>
        </tr>
      </table>
    </div>
    
    <h2 style="font-size: 18px; font-weight: 300; color: #fff; margin: 24px 0 16px 0;">
      Requested Products
    </h2>
    
    <div style="background-color: #111; border-radius: 8px; padding: 16px; margin-bottom: 20px; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; min-width: 400px;">
        <thead>
          <tr>
            <th style="padding: 10px 0; border-bottom: 2px solid #333; color: #888; text-align: left; font-weight: 500;">Product</th>
            <th style="padding: 10px 0; border-bottom: 2px solid #333; color: #888; text-align: center; font-weight: 500;">Qty</th>
            <th style="padding: 10px 0; border-bottom: 2px solid #333; color: #888; text-align: left; font-weight: 500;">SKU</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>
    
    ${notes ? `
    <div style="background-color: #0f1a0f; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 3px solid #c9a962;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
        Customer Notes
      </p>
      <p style="color: #fff; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
        ${notes}
      </p>
    </div>
    ` : ''}
    
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 16px; border: 1px solid #222;">
      <p style="color: #888; font-size: 13px; margin: 0;">
        <strong style="color: #c9a962;">Action Required:</strong> Review this quote request and send pricing to the member within 24-48 hours.
      </p>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
      This notification was sent from the CULTR Shop quote system.
    </p>
  </div>
</body>
</html>
`

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: fromEmail,
      to: founderEmail,
      subject: `New Quote Request: ${totalItems} items from ${email}`,
      html: htmlContent,
    })

    if (error) {
      console.error('Quote notification error:', error)
      return { success: false, error: error.message }
    }

    console.log('Quote request notification sent:', { quoteId, email, totalItems })
    return { success: true }
  } catch (err) {
    console.error('Failed to send quote notification:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// ORDER CONFIRMATION WITH LMN EMAIL
// ===========================================

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderConfirmationWithLMNData {
  email: string
  name?: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  currency: string
  lmnNumber: string
  lmnPdfBuffer: Buffer
}

export async function sendOrderConfirmationWithLMN(data: OrderConfirmationWithLMNData): Promise<EmailResult> {
  const {
    email,
    name,
    orderNumber,
    items,
    totalAmount,
    currency,
    lmnNumber,
    lmnPdfBuffer,
  } = data

  const firstName = name?.split(' ')[0] || 'there'
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  // Build items rows
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${item.name}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #c9a962; text-align: right;">${formatCurrency(item.price)}</td>
    </tr>
  `).join('')

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #fff; margin-bottom: 24px;">
      Order Confirmed
    </h1>
    
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, thank you for your order. Your products are being prepared for shipment.
    </p>
    
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <span style="color: #888;">Order Number</span>
        <span style="color: #fff; font-family: monospace;">${orderNumber}</span>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="padding: 8px 0; border-bottom: 2px solid #333; color: #888; text-align: left; font-weight: 500;">Product</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #333; color: #888; text-align: center; font-weight: 500;">Qty</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #333; color: #888; text-align: right; font-weight: 500;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 0 0 0; color: #fff; font-weight: 600; text-align: right;">Total:</td>
            <td style="padding: 16px 0 0 0; color: #c9a962; font-weight: 600; text-align: right; font-size: 18px;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <!-- HSA/FSA Section -->
    <div style="background: linear-gradient(135deg, #1a3d1a 0%, #0f2a0f 100%); border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #2d5a2d;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="display: inline-block; background: #c9a962; color: #000; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          HSA/FSA Eligible
        </span>
      </div>
      
      <h3 style="color: #fff; font-size: 16px; margin: 0 0 12px 0;">
        Letter of Medical Necessity Included
      </h3>
      
      <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Your order qualifies for HSA/FSA reimbursement. We've attached a Letter of Medical Necessity (LMN) 
        to this email. Submit this document to your HSA/FSA administrator for tax-free reimbursement.
      </p>
      
      <div style="background-color: rgba(0,0,0,0.3); border-radius: 6px; padding: 12px; display: flex; align-items: center; gap: 12px;">
        <span style="color: #c9a962;">📄</span>
        <div>
          <p style="color: #fff; font-size: 14px; margin: 0;">CULTR-LMN-${lmnNumber}.pdf</p>
          <p style="color: #888; font-size: 12px; margin: 4px 0 0 0;">Attached to this email</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; border: 1px solid #222;">
      <p style="color: #fff; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        What's Next?
      </p>
      <ul style="color: #888; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">You'll receive a shipping confirmation with tracking details</li>
        <li style="margin-bottom: 6px;">Products typically ship within 1-2 business days</li>
        <li>Your LMN is also available in your member portal</li>
      </ul>
    </div>
    
    <p style="color: #666; font-size: 13px; margin-top: 24px; text-align: center;">
      Questions about your order? <a href="mailto:support@cultrhealth.com" style="color: #c9a962; text-decoration: none;">Contact Support</a>
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Order Confirmed: ${orderNumber} — HSA/FSA Letter Attached`,
      html: baseEmailTemplate(content, 'Thank you for choosing CULTR Health.'),
      attachments: [
        {
          filename: `CULTR-LMN-${lmnNumber}.pdf`,
          content: lmnPdfBuffer.toString('base64'),
        },
      ],
    })

    if (error) {
      console.error('Order confirmation email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Order confirmation with LMN sent:', { email, orderNumber, lmnNumber })
    return { success: true }
  } catch (err) {
    console.error('Failed to send order confirmation with LMN:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
