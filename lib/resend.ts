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

// HTML-escape user-supplied values to prevent injection in email templates
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Get configured from email
export function getFromEmail(): string {
  const email = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  if (email.includes('<')) return email
  return `CULTR <${email}>`
}

// Get public site URL for email assets — localhost is unreachable from email clients
function getEmailSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!envUrl || envUrl.includes('localhost')) return 'https://staging.cultrhealth.com'
  return envUrl
}

// ===========================================
// BRANDED EMAIL COMPONENTS
// ===========================================

/**
 * Google Fonts import for email — must be in <head> for email clients that support it.
 * Gmail, Apple Mail, iOS Mail, Outlook (Mac) all support @import in <style> blocks.
 */
export const EMAIL_FONT_IMPORT = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" type="text/css"><!--[if mso]><style>* { font-family: Georgia, 'Times New Roman', serif !important; }</style><![endif]-->`

/**
 * Branded email header block — matches staging site navbar layout.
 * CULTR stacked above HEALTH, tagline below, green accent lines.
 * @param variant 'dark' (forest bg, cream text) or 'light' (cream bg, forest text)
 */
export function brandedEmailHeader(variant: 'dark' | 'light' = 'dark'): string {
  const bg = variant === 'dark' ? '#2A4542' : '#FDFBF7'
  const textColor = variant === 'dark' ? '#FDFBF7' : '#2A4542'
  const accentGreen = '#B7E4C7'
  const siteUrl = getEmailSiteUrl()
  // Official logo: public/cultr-health-logo.png (forest green on transparent)
  // Cream variant: public/images/email-logo-cream.png (generated via scripts/generate-cream-logo.mjs)
  // Dark header → cream version so logo is visible on dark bg
  // Light header → official green logo on cream bg
  const logoSrc = variant === 'dark'
    ? `${siteUrl}/images/email-logo-cream.png`
    : `${siteUrl}/cultr-health-logo.png`

  return `
    <div style="background: ${bg}; border-radius: 16px 16px 0 0; padding: 32px 24px 24px; text-align: center;">
      <!-- Three accent lines -->
      <div style="margin: 0 auto 16px; width: 48px;">
        <div style="height: 1px; background: ${accentGreen}; margin-bottom: 4px;"></div>
        <div style="height: 1.3px; background: ${accentGreen}; margin-bottom: 4px;"></div>
        <div style="height: 0.8px; background: ${accentGreen};"></div>
      </div>
      <!-- CULTR HEALTH logo (image — renders Playfair Display in all email clients) -->
      <div style="margin: 0 auto 12px;">
        <img src="${logoSrc}" alt="CULTR Health" width="160" height="50" style="display: block; margin: 0 auto; width: 160px; height: auto;" />
      </div>
      <!-- Tagline -->
      <p style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 400; color: ${textColor}; margin: 0 0 6px; letter-spacing: 0.3px;">
        Change the CULTR. <em style="font-style: italic;">rebrand</em> yourself.
      </p>
      <!-- URL (plain text, not a link) -->
      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 9px; font-weight: 400; color: ${accentGreen}; margin: 0; letter-spacing: 1px;">
        cultrhealth.com
      </p>
    </div>`
}

/**
 * Branded email footer with green accent lines and support link.
 */
export function brandedEmailFooter(): string {
  return `
    <div style="margin-top: 32px; padding: 24px; text-align: center; background: #2A4542; border-radius: 0 0 16px 16px;">
      <div style="margin: 0 auto 12px; width: 48px;">
        <div style="height: 1px; background: #B7E4C7; margin-bottom: 4px;"></div>
        <div style="height: 1.3px; background: #B7E4C7; margin-bottom: 4px;"></div>
        <div style="height: 0.8px; background: #B7E4C7;"></div>
      </div>
      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: rgba(253,251,247,0.6); font-size: 11px; margin: 0 0 8px;">
        CULTR Health &mdash; Personalized Longevity Medicine
      </p>
      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: rgba(253,251,247,0.4); font-size: 10px; margin: 0;">
        Questions? Contact <a href="mailto:support@cultrhealth.com" style="color: #B7E4C7; text-decoration: none;">support@cultrhealth.com</a>
      </p>
    </div>`
}

// ===========================================
// EMAIL BASE TEMPLATE
// ===========================================

export function baseEmailTemplate(content: string, footerText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${EMAIL_FONT_IMPORT}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    ${brandedEmailHeader('light')}

    <div style="padding: 24px;">
    ${content}
    </div>

    ${brandedEmailFooter()}
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

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePhone = escapeHtml(phone)
  const safeSocial = social_handle ? escapeHtml(social_handle) : '—'
  const safeReason = treatment_reason ? escapeHtml(treatment_reason) : '—'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.1em; margin-bottom: 30px; color: #2A4542;">
      New Waitlist Signup
    </h1>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68; width: 140px;">Name</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7;">
            <a href="mailto:${safeEmail}" style="color: #2A4542; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7;">
            <a href="tel:${safePhone}" style="color: #2A4542; text-decoration: none;">${safePhone}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Social Handle</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${safeSocial}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68; vertical-align: top;">Treatment Reason</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${safeReason}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Timestamp</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${timestamp.toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #5A6B68;">Waitlist ID</td>
          <td style="padding: 12px 0; color: #5A6B68; font-family: monospace; font-size: 12px;">${escapeHtml(waitlist_id)}</td>
        </tr>
      </table>
    </div>

    <p style="color: #5A6B68; font-size: 12px; margin-top: 30px;">
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
      subject: `New CULTR Waitlist Signup: ${safeName}`,
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
  dashboardUrl: string
  stripePortalUrl?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  const { name, email, planName, dashboardUrl, stripePortalUrl } = data
  const firstName = name.split(' ')[0]

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Welcome to CULTR, ${firstName}.
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Your <strong style="color: #2A4542;">${planName}</strong> membership is now active. 
      You're one step closer to optimized health and longevity.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: 600; color: #2A4542; margin: 0 0 16px 0;">
        Your Next Steps
      </h2>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; width: 24px; height: 24px; background: #B7E4C7; color: #2A4542; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">1</span>
        <span style="color: #2A4542;">Complete your intake forms (required before consultation)</span>
      </div>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; width: 24px; height: 24px; background: #B7E4C7; color: #2A4542; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">2</span>
        <span style="color: #2A4542;">Book your initial consultation with a provider</span>
      </div>
      
      <div>
        <span style="display: inline-block; width: 24px; height: 24px; background: #B7E4C7; color: #2A4542; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">3</span>
        <span style="color: #2A4542;">Upload any recent lab work (if available)</span>
      </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Go to Your Dashboard
      </a>
    </div>
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7;">
      <p style="color: #5A6B68; font-size: 14px; margin: 0;">
        <strong style="color: #2A4542;">Need help?</strong> Our care team is here for you. 
        Simply reply to this email or message us through the member dashboard.
      </p>
    </div>
    
    ${stripePortalUrl ? `
    <p style="color: #5A6B68; font-size: 12px; margin-top: 24px; text-align: center;">
      <a href="${stripePortalUrl}" style="color: #5A6B68; text-decoration: underline;">Manage billing &amp; subscription</a>
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

    console.log('Welcome email sent:', { planName })
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
  dashboardUrl: string
  isVideo: boolean
  meetingLink?: string
}

export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<EmailResult> {
  const { name, email, appointmentType, appointmentDate, providerName, dashboardUrl, isVideo, meetingLink } = data
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
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Appointment Confirmed
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, your appointment has been scheduled.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68; width: 120px;">Type</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; font-weight: 500;">${appointmentType}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; font-weight: 500;">${formattedTime}</td>
        </tr>
        ${providerName ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Provider</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${providerName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; color: #5A6B68;">Format</td>
          <td style="padding: 12px 0; color: #2A4542;">${isVideo ? '📹 Video Visit' : '📍 In-Person'}</td>
        </tr>
      </table>
    </div>
    
    ${isVideo && meetingLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${meetingLink}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Join Video Visit
      </a>
      <p style="color: #5A6B68; font-size: 12px; margin-top: 12px;">
        Link will be active 10 minutes before your appointment
      </p>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View in Dashboard
      </a>
    </div>
    `}
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7;">
      <p style="color: #2A4542; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        Before Your Appointment
      </p>
      <ul style="color: #5A6B68; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Complete all intake forms in the member dashboard</li>
        <li style="margin-bottom: 6px;">Have your ID ready for verification</li>
        <li style="margin-bottom: 6px;">Prepare a list of current medications</li>
        ${isVideo ? '<li>Test your camera and microphone</li>' : '<li>Arrive 10 minutes early</li>'}
      </ul>
    </div>
    
    <p style="color: #5A6B68; font-size: 13px; margin-top: 24px; text-align: center;">
      Need to reschedule? <a href="${dashboardUrl}" style="color: #2A4542; text-decoration: none;">Manage your appointment</a> in the member dashboard.
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

    console.log('Booking confirmation sent:', { appointmentDate })
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
  dashboardUrl: string
  isVideo: boolean
  meetingLink?: string
  hoursUntil: number  // 24, 2, etc.
}

export async function sendAppointmentReminder(data: AppointmentReminderData): Promise<EmailResult> {
  const { name, email, appointmentType, appointmentDate, providerName, dashboardUrl, isVideo, meetingLink, hoursUntil } = data
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
    <div style="background: #2A4542; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="color: #FDFBF7; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
        Appointment ${urgencyText}
      </p>
    </div>
    
    <h1 style="font-size: 24px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center;">
      Hi ${firstName}, just a reminder
    </h1>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="color: #2A4542; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">
        ${appointmentType}
      </p>
      <p style="color: #2A4542; font-size: 32px; font-weight: 300; margin: 0 0 8px 0;">
        ${formattedTime}
      </p>
      <p style="color: #5A6B68; font-size: 14px; margin: 0;">
        ${formattedDate}
      </p>
      ${providerName ? `<p style="color: #5A6B68; font-size: 13px; margin: 12px 0 0 0;">with ${providerName}</p>` : ''}
    </div>
    
    ${isVideo && meetingLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${meetingLink}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Join Video Visit
      </a>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Appointment
      </a>
    </div>
    `}
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 16px; border: 1px solid #B7E4C7; text-align: center;">
      <p style="color: #5A6B68; font-size: 13px; margin: 0;">
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

    console.log('Appointment reminder sent:', { hoursUntil })
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
  dashboardUrl: string
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
    dashboardUrl,
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
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Thanks for your visit, ${firstName}.
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Here's a summary following your <strong style="color: #2A4542;">${appointmentType}</strong> on ${formattedDate}${providerName ? ` with ${providerName}` : ''}.
    </p>
    
    ${nextSteps.length > 0 ? `
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: 600; color: #2A4542; margin: 0 0 16px 0;">
        Your Next Steps
      </h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${nextSteps.map(step => `
          <li style="color: #2A4542; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
            ${step}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${customNotes ? `
    <div style="background-color: #FDFBF7; border: 1px solid #B7E4C7; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 3px solid #2A4542;">
      <p style="color: #5A6B68; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
        Provider Notes
      </p>
      <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0;">
        ${customNotes}
      </p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View Visit Summary
      </a>
    </div>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #2A4542; font-size: 14px; font-weight: 500; margin: 0 0 12px 0;">
        Quick Actions
      </p>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0;">
            <a href="${dashboardUrl}" style="color: #2A4542; text-decoration: none; font-size: 14px;">
              → Message your care team
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <a href="${dashboardUrl}" style="color: #2A4542; text-decoration: none; font-size: 14px;">
              → Book follow-up appointment
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <a href="${dashboardUrl}" style="color: #2A4542; text-decoration: none; font-size: 14px;">
              → View lab results
            </a>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7;">
      <p style="color: #5A6B68; font-size: 13px; margin: 0; line-height: 1.6;">
        <strong style="color: #2A4542;">Questions?</strong> Message us anytime through the member dashboard. 
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

    console.log('Post-visit follow-up sent:', { appointmentType })
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
      <td style="padding: 10px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${item.name}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">${item.sku}</td>
    </tr>
  `).join('')

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 700px; margin: 0 auto;">
    <div style="background: #2A4542; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0; color: #FDFBF7;">
        New Quote Request
      </h1>
    </div>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68; width: 140px;">Member Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7;">
            <a href="mailto:${email}" style="color: #2A4542; text-decoration: none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Membership Tier</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; text-transform: capitalize;">${tier || 'None'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Total Items</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${totalItems} items (${uniqueProducts} unique)</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #5A6B68;">Timestamp</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${timestamp.toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #5A6B68;">Quote ID</td>
          <td style="padding: 12px 0; color: #5A6B68; font-family: monospace; font-size: 12px;">${quoteId}</td>
        </tr>
      </table>
    </div>
    
    <h2 style="font-size: 18px; font-weight: 300; color: #2A4542; margin: 24px 0 16px 0;">
      Requested Products
    </h2>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 16px; margin-bottom: 20px; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; min-width: 400px;">
        <thead>
          <tr>
            <th style="padding: 10px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: left; font-weight: 500;">Product</th>
            <th style="padding: 10px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: center; font-weight: 500;">Qty</th>
            <th style="padding: 10px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: left; font-weight: 500;">SKU</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>
    
    ${notes ? `
    <div style="background-color: #FDFBF7; border: 1px solid #B7E4C7; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 3px solid #2A4542;">
      <p style="color: #5A6B68; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
        Customer Notes
      </p>
      <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
        ${notes}
      </p>
    </div>
    ` : ''}
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 16px; border: 1px solid #B7E4C7;">
      <p style="color: #5A6B68; font-size: 13px; margin: 0;">
        <strong style="color: #2A4542;">Action Required:</strong> Review this quote request and send pricing to the member within 24-48 hours.
      </p>
    </div>
    
    <p style="color: #5A6B68; font-size: 12px; margin-top: 30px; text-align: center;">
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

    console.log('Quote request notification sent:', { quoteId, totalItems })
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
      <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${item.name}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; text-align: right;">${formatCurrency(item.price)}</td>
    </tr>
  `).join('')

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Order Confirmed
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, thank you for your order. Your products are being prepared for shipment.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <span style="color: #5A6B68;">Order Number</span>
        <span style="color: #2A4542; font-family: monospace;">${orderNumber}</span>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="padding: 8px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: left; font-weight: 500;">Product</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: center; font-weight: 500;">Qty</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: right; font-weight: 500;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 0 0 0; color: #2A4542; font-weight: 600; text-align: right;">Total:</td>
            <td style="padding: 16px 0 0 0; color: #2A4542; font-weight: 600; text-align: right; font-size: 18px;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7;">
      <p style="color: #2A4542; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        What's Next?
      </p>
      <ul style="color: #5A6B68; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">You'll receive a shipping confirmation with tracking details</li>
        <li style="margin-bottom: 6px;">Products typically ship within 1-2 business days</li>
        <li>Your LMN is also available in your member portal</li>
      </ul>
    </div>
    
    <p style="color: #5A6B68; font-size: 13px; margin-top: 24px; text-align: center;">
      Questions about your order? <a href="mailto:support@cultrhealth.com" style="color: #2A4542; text-decoration: none;">Contact Support</a>
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Order Confirmed: ${orderNumber}`,
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

    console.log('Order confirmation with LMN sent:', { orderNumber, lmnNumber })
    return { success: true }
  } catch (err) {
    console.error('Failed to send order confirmation with LMN:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// ORDER CONFIRMATION EMAIL (Without LMN)
// ===========================================

interface OrderConfirmationEmailData {
  email: string
  name?: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  currency?: string
  paymentMethod?: string
  invoicePdf?: Buffer
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<EmailResult> {
  const {
    email,
    name,
    orderNumber,
    items,
    totalAmount,
    currency = 'USD',
    paymentMethod = 'Credit Card',
    invoicePdf,
  } = data

  const firstName = name?.split(' ')[0] || 'there'

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Build items rows
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542;">${item.name}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #B7E4C7; color: #2A4542; text-align: right;">${formatCurrency(item.price)}</td>
    </tr>
  `).join('')

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Order Confirmed
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, thank you for your order. Your products are being prepared for shipment.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <span style="color: #5A6B68; display: inline-block; width: 120px;">Order Number</span>
        <span style="color: #2A4542; font-family: monospace;">${orderNumber}</span>
      </div>
      <div style="margin-bottom: 16px;">
        <span style="color: #5A6B68; display: inline-block; width: 120px;">Payment</span>
        <span style="color: #2A4542;">${paymentMethod}</span>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="padding: 8px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: left; font-weight: 500;">Product</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: center; font-weight: 500;">Qty</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #B7E4C7; color: #5A6B68; text-align: right; font-weight: 500;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 0 0 0; color: #2A4542; font-weight: 600; text-align: right;">Total:</td>
            <td style="padding: 16px 0 0 0; color: #2A4542; font-weight: 600; text-align: right; font-size: 18px;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7;">
      <p style="color: #2A4542; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        What's Next?
      </p>
      <ul style="color: #5A6B68; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">You'll receive a shipping confirmation with tracking details</li>
        <li style="margin-bottom: 6px;">Products typically ship within 1-2 business days</li>
        <li>Track your order status in your member portal</li>
      </ul>
    </div>
    
    <p style="color: #5A6B68; font-size: 13px; margin-top: 24px; text-align: center;">
      Questions about your order? <a href="mailto:support@cultrhealth.com" style="color: #2A4542; text-decoration: none;">Contact Support</a>
    </p>
  `

  try {
    const client = getResendClient()

    const emailOptions: {
      from: string
      to: string
      subject: string
      html: string
      attachments?: { filename: string; content: string }[]
    } = {
      from: getFromEmail(),
      to: email,
      subject: `Order Confirmed: ${orderNumber}`,
      html: baseEmailTemplate(content, 'Thank you for choosing CULTR Health.'),
    }

    // Attach invoice PDF if provided
    if (invoicePdf) {
      emailOptions.attachments = [
        {
          filename: `CULTR-Invoice-${orderNumber}.pdf`,
          content: invoicePdf.toString('base64'),
        },
      ]
      emailOptions.subject = `Order Confirmed: ${orderNumber} — Invoice Attached`
    }

    const { error } = await client.emails.send(emailOptions)

    if (error) {
      console.error('Order confirmation email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Order confirmation sent:', { orderNumber })
    return { success: true }
  } catch (err) {
    console.error('Failed to send order confirmation:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// SHIPPING NOTIFICATION EMAIL
// ===========================================

interface ShippingNotificationData {
  email: string
  name?: string
  orderNumber: string
  carrier: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDelivery?: Date
  items?: { name: string; quantity: number }[]
}

export async function sendShippingNotificationEmail(data: ShippingNotificationData): Promise<EmailResult> {
  const {
    email,
    name,
    orderNumber,
    carrier,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    items,
  } = data

  const firstName = name?.split(' ')[0] || 'there'

  // Format estimated delivery date
  const formattedDelivery = estimatedDelivery
    ? estimatedDelivery.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    : null

  // Build items list if provided
  const itemsList = items && items.length > 0
    ? items.map(item => `
        <li style="color: #2A4542; margin-bottom: 6px;">
          ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}
        </li>
      `).join('')
    : ''

  const content = `
    <div style="background: #2A4542; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="color: #FDFBF7; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
        📦 Your Order Has Shipped
      </p>
    </div>
    
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      On its way, ${firstName}!
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Great news — your order has shipped and is headed your way.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <span style="color: #5A6B68; display: inline-block; width: 140px;">Order Number</span>
        <span style="color: #2A4542; font-family: monospace;">${orderNumber}</span>
      </div>
      <div style="margin-bottom: 16px;">
        <span style="color: #5A6B68; display: inline-block; width: 140px;">Carrier</span>
        <span style="color: #2A4542;">${carrier}</span>
      </div>
      <div style="margin-bottom: ${formattedDelivery ? '16px' : '0'};">
        <span style="color: #5A6B68; display: inline-block; width: 140px;">Tracking Number</span>
        <span style="color: #2A4542; font-family: monospace;">${trackingNumber}</span>
      </div>
      ${formattedDelivery ? `
      <div>
        <span style="color: #5A6B68; display: inline-block; width: 140px;">Est. Delivery</span>
        <span style="color: #2A4542; font-weight: 500;">${formattedDelivery}</span>
      </div>
      ` : ''}
    </div>
    
    ${trackingUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${trackingUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Track Your Package
      </a>
    </div>
    ` : ''}
    
    ${itemsList ? `
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7; margin-bottom: 24px;">
      <p style="color: #5A6B68; font-size: 12px; text-transform: uppercase; margin: 0 0 12px 0;">
        Items in this shipment
      </p>
      <ul style="margin: 0; padding-left: 20px;">
        ${itemsList}
      </ul>
    </div>
    ` : ''}
    
    <div style="background-color: #FDFBF7; border-radius: 8px; padding: 20px; border: 1px solid #B7E4C7;">
      <p style="color: #5A6B68; font-size: 13px; margin: 0; line-height: 1.6;">
        <strong style="color: #2A4542;">Delivery Tips:</strong> Ensure someone is available to receive temperature-sensitive products. 
        Contact us immediately if there are any issues with your delivery.
      </p>
    </div>
    
    <p style="color: #5A6B68; font-size: 13px; margin-top: 24px; text-align: center;">
      Questions about your shipment? <a href="mailto:support@cultrhealth.com" style="color: #2A4542; text-decoration: none;">Contact Support</a>
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Your Order Has Shipped: ${orderNumber}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Shipping notification email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Shipping notification sent:', { orderNumber, carrier, trackingNumber })
    return { success: true }
  } catch (err) {
    console.error('Failed to send shipping notification:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// CANCELLATION EMAIL
// ===========================================

interface CancellationEmailData {
  name: string
  email: string
  planName: string
  effectiveDate: Date
}

export async function sendCancellationEmail(data: CancellationEmailData): Promise<EmailResult> {
  const { name, email, planName, effectiveDate } = data
  const firstName = name.split(' ')[0]
  const formattedDate = effectiveDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Subscription Cancelled
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, your <strong style="color: #2A4542;">${planName}</strong> subscription has been cancelled and will end on ${formattedDate}.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin: 0;">
        You will continue to have access to your member benefits until the end of your current billing period. 
        Your member dashboard will remain accessible for your medical records.
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="/pricing" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Reactivate Subscription
      </a>
    </div>
    
    <p style="color: #5A6B68; font-size: 13px; text-align: center;">
      We're sorry to see you go. If you have any feedback on how we can improve, please let us know.
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Subscription Cancellation: ${planName}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Cancellation email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send cancellation email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// PAYMENT FAILED EMAIL
// ===========================================

interface PaymentFailedEmailData {
  name: string
  email: string
  amount: number
  currency: string
  billingPortalUrl: string
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<EmailResult> {
  const { name, email, amount, currency, billingPortalUrl } = data
  const firstName = name.split(' ')[0]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Payment Failed
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, we were unable to process your recent payment of <strong style="color: #2A4542;">${formatCurrency(amount)}</strong>.
    </p>
    
    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px; border-left: 3px solid #ff4444;">
      <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0;">
        To avoid any interruption to your membership and care, please update your payment method. 
        Stripe will automatically retry the payment in a few days.
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${billingPortalUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Update Payment Method
      </a>
    </div>
    
    <p style="color: #5A6B68; font-size: 13px; text-align: center;">
      If you've already updated your payment information, please ignore this email.
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Action Required: Payment Failed`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Payment failed email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send payment failed email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// FRAUD HELD ADMIN NOTIFICATION
// ===========================================

interface FraudHeldNotificationData {
  transactionId: string
  merchantRefId?: string
  provider: string
}

export async function sendFraudHeldAdminNotification(data: FraudHeldNotificationData): Promise<EmailResult> {
  const adminEmail = process.env.FOUNDER_EMAIL
  if (!adminEmail) {
    console.error('FOUNDER_EMAIL not configured - cannot send fraud alert')
    return { success: false, error: 'Admin email not configured' }
  }

  const { transactionId, merchantRefId, provider } = data

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Payment Held for Fraud Review
    </h1>

    <div style="background-color: #F5F0E8; border-radius: 8px; padding: 24px; margin-bottom: 24px; border-left: 3px solid #ff8800;">
      <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        A payment has been flagged and held for manual fraud review.
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #5A6B68; width: 140px;">Provider</td>
          <td style="padding: 8px 0; color: #2A4542;">${provider}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #5A6B68;">Transaction ID</td>
          <td style="padding: 8px 0; color: #2A4542; font-family: monospace; font-size: 13px;">${transactionId}</td>
        </tr>
        ${merchantRefId ? `<tr>
          <td style="padding: 8px 0; color: #5A6B68;">Order Reference</td>
          <td style="padding: 8px 0; color: #2A4542; font-family: monospace; font-size: 13px;">${merchantRefId}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 8px 0; color: #5A6B68;">Time</td>
          <td style="padding: 8px 0; color: #2A4542;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</td>
        </tr>
      </table>
    </div>

    <p style="color: #5A6B68; font-size: 13px;">
      Please review this transaction in the ${provider} dashboard and approve or decline it.
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: adminEmail,
      subject: `[ACTION REQUIRED] Payment Held for Fraud Review - ${transactionId}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Fraud notification email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send fraud notification:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// SUBSCRIPTION EXPIRING NOTIFICATION
// ===========================================

interface SubscriptionExpiringEmailData {
  name: string
  email: string
}

export async function sendSubscriptionExpiringEmail(data: SubscriptionExpiringEmailData): Promise<EmailResult> {
  const { name, email } = data
  const firstName = name.split(' ')[0]
  const siteUrl = getEmailSiteUrl()

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px;">
      Your Subscription is Expiring Soon
    </h1>

    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${firstName}, your CULTR Health subscription is expiring soon. To continue receiving your treatments without interruption, please renew your membership.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/renewal" style="display: inline-block; background: #2A4542; color: #FDFBF7; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Renew Subscription
      </a>
    </div>

    <p style="color: #5A6B68; font-size: 13px; text-align: center;">
      If you have any questions, contact us at support@cultrhealth.com.
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Your CULTR Health Subscription is Expiring Soon`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Subscription expiring email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send subscription expiring email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ===========================================
// CONSULTATION LIFECYCLE EMAILS
// ===========================================

interface ConsultationConfirmationData {
  patientName: string
  patientEmail: string
  providerName: string
  consultationType: string
  scheduledAt: Date
  joinUrl: string
  cancelUrl: string
}

export async function sendConsultationConfirmationToPatient(
  data: ConsultationConfirmationData
): Promise<EmailResult> {
  const {
    patientName,
    patientEmail,
    providerName,
    consultationType,
    scheduledAt,
    joinUrl,
    cancelUrl,
  } = data

  const safePatientName = escapeHtml(patientName)
  const safeProviderName = escapeHtml(providerName)
  const safeConsultationType = escapeHtml(consultationType)
  const firstName = safePatientName.split(' ')[0]

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  const formattedDate = scheduledAt.toLocaleDateString('en-US', dateOptions)
  const formattedTime = scheduledAt.toLocaleTimeString('en-US', timeOptions)

  const content = `
    <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 500; color: #2A4542; margin-bottom: 16px;">
      Your Consultation is Confirmed
    </h1>

    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2A4542; margin-bottom: 24px;">
      Hi ${firstName}, you're all set. Here are the details for your upcoming consultation.
    </p>

    <div style="background-color: #F5F0E8; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px; width: 130px;">Type</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px; font-weight: 500;">${safeConsultationType}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Date</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Time</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px; font-weight: 500;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Provider</td>
          <td style="padding: 10px 0; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${safeProviderName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${joinUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 36px; text-decoration: none; border-radius: 50px;">
        Join Consultation
      </a>
    </div>

    <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #5A6B68; line-height: 1.6; text-align: center; margin-bottom: 16px;">
      Your link will be active 10 minutes before the scheduled time. We recommend joining a few minutes early to test your connection.
    </p>

    <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #5A6B68; text-align: center; margin: 0;">
      Need to cancel? <a href="${cancelUrl}" style="color: #2A4542; text-decoration: underline;">Cancel this consultation</a>
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: patientEmail,
      subject: `Consultation Confirmed — ${formattedDate} at ${formattedTime}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Consultation confirmation email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Consultation confirmation email sent')
    return { success: true }
  } catch (err) {
    console.error('Failed to send consultation confirmation email:', err)
    return { success: false, error: String(err) }
  }
}

interface ConsultationProviderNotificationData {
  providerName: string
  providerEmail: string
  patientName: string
  patientEmail: string
  consultationType: string
  scheduledAt: Date
  dailyRoomUrl: string
  reason?: string
}

export async function sendConsultationNotificationToProvider(
  data: ConsultationProviderNotificationData
): Promise<EmailResult> {
  const {
    providerName,
    providerEmail,
    patientName,
    patientEmail,
    consultationType,
    scheduledAt,
    dailyRoomUrl,
    reason,
  } = data

  const safeProviderName = escapeHtml(providerName)
  const safePatientName = escapeHtml(patientName)
  const safePatientEmail = escapeHtml(patientEmail)
  const safeConsultationType = escapeHtml(consultationType)
  const safeReason = reason ? escapeHtml(reason) : null
  const firstName = safeProviderName.split(' ')[0]

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  const formattedDate = scheduledAt.toLocaleDateString('en-US', dateOptions)
  const formattedTime = scheduledAt.toLocaleTimeString('en-US', timeOptions)

  const content = `
    <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 500; color: #2A4542; margin-bottom: 16px;">
      New Consultation Scheduled
    </h1>

    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2A4542; margin-bottom: 24px;">
      Hi ${firstName}, a new consultation has been booked and is waiting for you.
    </p>

    <div style="background-color: #F5F0E8; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px; width: 130px;">Patient</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px; font-weight: 500;">${safePatientName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Patient Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${safePatientEmail}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Type</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${safeConsultationType}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Date</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; ${safeReason ? 'border-bottom: 1px solid #D8E8D8;' : ''} font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Time</td>
          <td style="padding: 10px 0; ${safeReason ? 'border-bottom: 1px solid #D8E8D8;' : ''} font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px; font-weight: 500;">${formattedTime}</td>
        </tr>
        ${safeReason ? `
        <tr>
          <td style="padding: 10px 0; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px; vertical-align: top;">Reason</td>
          <td style="padding: 10px 0; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px; line-height: 1.5;">${safeReason}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${dailyRoomUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 36px; text-decoration: none; border-radius: 50px;">
        Join Video Room
      </a>
    </div>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: providerEmail,
      subject: `Consultation: ${safePatientName} — ${formattedDate}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Consultation provider notification email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Consultation notification email sent')
    return { success: true }
  } catch (err) {
    console.error('Failed to send consultation notification to provider:', err)
    return { success: false, error: String(err) }
  }
}

interface ConsultationReminderData {
  patientName: string
  patientEmail: string
  providerName: string
  scheduledAt: Date
  joinUrl: string
}

export async function sendConsultationReminder(
  data: ConsultationReminderData
): Promise<EmailResult> {
  const { patientName, patientEmail, providerName, scheduledAt, joinUrl } = data

  const safePatientName = escapeHtml(patientName)
  const safeProviderName = escapeHtml(providerName)
  const firstName = safePatientName.split(' ')[0]

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  const formattedTime = scheduledAt.toLocaleTimeString('en-US', timeOptions)

  const content = `
    <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 500; color: #2A4542; margin-bottom: 16px;">
      Your Consultation Starts Soon
    </h1>

    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2A4542; margin-bottom: 24px;">
      Hi ${firstName}, your consultation with ${safeProviderName} starts at ${formattedTime} — that's in about 1 hour.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${joinUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 36px; text-decoration: none; border-radius: 50px;">
        Join Consultation
      </a>
    </div>

    <div style="background-color: #F5F0E8; border-radius: 10px; padding: 20px; margin-top: 8px;">
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; font-weight: 500; margin: 0 0 8px 0;">
        Quick Tip
      </p>
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A6B68; line-height: 1.6; margin: 0;">
        Take a moment now to test your camera and microphone so the session goes smoothly. You can join the room up to 10 minutes before your scheduled time.
      </p>
    </div>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: patientEmail,
      subject: `Reminder: Consultation at ${formattedTime}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Consultation reminder email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Consultation reminder email sent')
    return { success: true }
  } catch (err) {
    console.error('Failed to send consultation reminder email:', err)
    return { success: false, error: String(err) }
  }
}

interface ConsultationCompletedData {
  patientName: string
  patientEmail: string
  providerName: string
  durationMins: number
  notesUrl: string
  bookFollowUpUrl: string
}

export async function sendConsultationCompleted(
  data: ConsultationCompletedData
): Promise<EmailResult> {
  const { patientName, patientEmail, providerName, durationMins, notesUrl, bookFollowUpUrl } = data

  const safePatientName = escapeHtml(patientName)
  const safeProviderName = escapeHtml(providerName)
  const firstName = safePatientName.split(' ')[0]

  const content = `
    <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 500; color: #2A4542; margin-bottom: 16px;">
      Consultation Complete
    </h1>

    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2A4542; margin-bottom: 24px;">
      Hi ${firstName}, thank you for attending your ${durationMins}-minute consultation with ${safeProviderName}.
    </p>

    <div style="background-color: #F5F0E8; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A6B68; line-height: 1.6; margin: 0;">
        Your provider's notes and any recommended protocols will be available in your member portal shortly. You'll receive a notification once they've been published.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${notesUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 36px; text-decoration: none; border-radius: 50px;">
        View Notes
      </a>
    </div>

    <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #5A6B68; text-align: center; margin: 0;">
      Ready to continue your optimization journey?
      <a href="${bookFollowUpUrl}" style="color: #2A4542; font-weight: 500; text-decoration: underline;">Book a follow-up consultation</a>
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: patientEmail,
      subject: 'Your CULTR Consultation — Summary',
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Consultation completed email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Consultation completed email sent')
    return { success: true }
  } catch (err) {
    console.error('Failed to send consultation completed email:', err)
    return { success: false, error: String(err) }
  }
}

interface RecordingReadyData {
  consultationId: number
  patientName: string
  providerName: string
  adminUrl: string
}

export async function sendRecordingReadyNotification(
  data: RecordingReadyData
): Promise<EmailResult> {
  const { consultationId, patientName, providerName, adminUrl } = data

  const safePatientName = escapeHtml(patientName)
  const safeProviderName = escapeHtml(providerName)
  const toEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'

  const content = `
    <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 500; color: #2A4542; margin-bottom: 16px;">
      Recording Ready
    </h1>

    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2A4542; margin-bottom: 24px;">
      A consultation recording has been processed and is ready for review.
    </p>

    <div style="background-color: #F5F0E8; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px; width: 160px;">Consultation ID</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px; font-weight: 500; font-family: monospace;">#${consultationId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Patient</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D8E8D8; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${safePatientName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-family: 'Inter', sans-serif; color: #5A6B68; font-size: 14px;">Provider</td>
          <td style="padding: 10px 0; font-family: 'Inter', sans-serif; color: #2A4542; font-size: 14px;">${safeProviderName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${adminUrl}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 36px; text-decoration: none; border-radius: 50px;">
        View Recording
      </a>
    </div>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: toEmail,
      subject: `Recording Ready — Consultation #${consultationId}`,
      html: baseEmailTemplate(content),
    })

    if (error) {
      console.error('Recording ready notification email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Recording ready notification sent:', { consultationId })
    return { success: true }
  } catch (err) {
    console.error('Failed to send recording ready notification:', err)
    return { success: false, error: String(err) }
  }
}

interface SiphoxKitFulfillmentEmailData {
  name: string
  email: string
  address: {
    street1: string
    city: string
    state: string
    zip: string
  }
}

interface SiphoxFailureAlertData {
  customerEmail: string
  planTier: string
  siphoxOrderId?: string | null
  lastError: string
  retryCount: number
}

interface SiphoxRefundAlertData {
  customerName?: string
  customerEmail?: string
  planTier: string
  siphoxOrderId?: string | null
  kitStatus: string
  refundAmount: number
  suggestedAction: string
}

export async function sendKitFulfillmentEmail(
  data: SiphoxKitFulfillmentEmailData
): Promise<EmailResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
  const safeName = escapeHtml(data.name)
  const safeAddress = escapeHtml(
    `${data.address.street1}, ${data.address.city}, ${data.address.state} ${data.address.zip}`
  )

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 20px;">Your blood test kit is on its way</h1>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin: 0 0 14px;">Hi ${safeName}, your SiPhox blood test kit has been ordered.</p>
    <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0 0 14px; padding: 12px; background: #2A4542; border-radius: 8px;">${safeAddress}</p>
    <p style="margin: 0;"><a href="${siteUrl}/dashboard" style="color: #B7E4C7; text-decoration: underline;">Open dashboard</a></p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: data.email,
      subject: 'Your blood test kit is on its way',
      html: baseEmailTemplate(content),
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function sendResultsReadyEmail(data: {
  name: string
  email: string
  summary: {
    totalBiomarkers: number
    optimalCount: number
    needsAttentionCount: number
  }
}): Promise<EmailResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
  const safeName = escapeHtml(data.name)

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 20px;">Your blood test results are ready</h1>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin: 0 0 14px;">Hi ${safeName}, your latest biomarker report has been processed.</p>
    <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0 0 14px;">
      Total: <strong>${data.summary.totalBiomarkers}</strong> · Optimal: <strong>${data.summary.optimalCount}</strong> · Attention: <strong>${data.summary.needsAttentionCount}</strong>
    </p>
    <p style="margin: 0;"><a href="${siteUrl}/dashboard" style="color: #B7E4C7; text-decoration: underline;">View dashboard</a></p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: data.email,
      subject: 'Your blood test results are ready',
      html: baseEmailTemplate(content),
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function sendSiphoxFailureAlert(
  data: SiphoxFailureAlertData
): Promise<EmailResult> {
  const supportEmail = process.env.FROM_EMAIL || 'admin@cultrhealth.com'
  const safeEmail = escapeHtml(data.customerEmail)
  const safePlanTier = escapeHtml(data.planTier)
  const safeOrderId = escapeHtml(data.siphoxOrderId || 'unknown')
  const safeError = escapeHtml(data.lastError)

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 20px;">SiPhox kit order failed</h1>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin: 0 0 14px;">A SiPhox order failed after retries and needs manual review.</p>
    <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0;">
      Customer: ${safeEmail}<br/>
      Plan: ${safePlanTier}<br/>
      Order: ${safeOrderId}<br/>
      Retries: ${data.retryCount}<br/>
      Error: ${safeError}
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: supportEmail,
      subject: `[ACTION REQUIRED] SiPhox order failed - ${safeEmail}`,
      html: baseEmailTemplate(content),
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function sendSiphoxRefundAlert(
  data: SiphoxRefundAlertData
): Promise<EmailResult> {
  const supportEmail = process.env.FROM_EMAIL || 'admin@cultrhealth.com'
  const safeCustomerName = escapeHtml(data.customerName || 'N/A')
  const safeCustomerEmail = escapeHtml(data.customerEmail || 'N/A')
  const safePlanTier = escapeHtml(data.planTier)
  const safeOrderId = escapeHtml(data.siphoxOrderId || 'unknown')
  const safeKitStatus = escapeHtml(data.kitStatus)
  const safeAction = escapeHtml(data.suggestedAction)

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 20px;">Refund with SiPhox order</h1>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin: 0 0 14px;">A refund was processed for a member with a SiPhox order.</p>
    <p style="color: #2A4542; font-size: 14px; line-height: 1.6; margin: 0;">
      Name: ${safeCustomerName}<br/>
      Email: ${safeCustomerEmail}<br/>
      Plan: ${safePlanTier}<br/>
      SiPhox Order: ${safeOrderId}<br/>
      Status: ${safeKitStatus}<br/>
      Refund: $${data.refundAmount.toFixed(2)}<br/>
      Suggested action: ${safeAction}
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: supportEmail,
      subject: `[ACTION REQUIRED] SiPhox refund review - ${safeCustomerEmail}`,
      html: baseEmailTemplate(content),
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function sendLowCreditAlert(
  balance: number,
  threshold: number
): Promise<EmailResult> {
  const adminEmail = process.env.FOUNDER_EMAIL
  if (!adminEmail) {
    return { success: false, error: 'Admin email not configured' }
  }

  const content = `
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 20px;">SiPhox credits running low</h1>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin: 0;">
      Current balance: <strong>${balance}</strong> credits<br/>
      Alert threshold: <strong>${threshold}</strong> credits
    </p>
  `

  try {
    const client = getResendClient()
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: adminEmail,
      subject: `[ACTION REQUIRED] SiPhox credit balance low (${balance})`,
      html: baseEmailTemplate(content),
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
