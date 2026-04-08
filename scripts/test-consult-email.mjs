#!/usr/bin/env node
/**
 * One-off script to send a test consultation confirmation email.
 * Usage: node scripts/test-consult-email.mjs
 * Delete after testing.
 */
import { config } from 'dotenv';
import { Resend } from 'resend';

// Load .env.local first (higher priority), then .env
config({ path: '.env.local' });
config({ path: '.env' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://staging.cultrhealth.com';
const TO_EMAIL = 'david@cultrhealth.com';

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY not found in .env or .env.local');
  process.exit(1);
}

// ── Branded helpers (mirrored from lib/resend.ts) ──

const EMAIL_FONT_IMPORT = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" type="text/css"><!--[if mso]><style>* { font-family: Georgia, 'Times New Roman', serif !important; }</style><![endif]-->`;

function brandedEmailHeader(variant = 'dark') {
  const bg = variant === 'dark' ? '#2A4542' : '#FDFBF7';
  const textColor = variant === 'dark' ? '#FDFBF7' : '#2A4542';
  const accentGreen = '#B7E4C7';
  const logoSrc = variant === 'dark'
    ? `${SITE_URL}/images/email-logo-cream.png`
    : `${SITE_URL}/cultr-health-logo.png`;

  return `
    <div style="background: ${bg}; border-radius: 16px 16px 0 0; padding: 32px 24px 24px; text-align: center;">
      <div style="margin: 0 auto 16px; width: 48px;">
        <div style="height: 1px; background: ${accentGreen}; margin-bottom: 4px;"></div>
        <div style="height: 1.3px; background: ${accentGreen}; margin-bottom: 4px;"></div>
        <div style="height: 0.8px; background: ${accentGreen};"></div>
      </div>
      <div style="margin: 0 auto 12px;">
        <img src="${logoSrc}" alt="CULTR Health" width="160" height="50" style="display: block; margin: 0 auto; width: 160px; height: auto;" />
      </div>
      <p style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 400; color: ${textColor}; margin: 0 0 6px; letter-spacing: 0.3px;">
        Change the CULTR. <em style="font-style: italic;">rebrand</em> yourself.
      </p>
      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 9px; font-weight: 400; color: ${accentGreen}; margin: 0; letter-spacing: 1px;">
        cultrhealth.com
      </p>
    </div>`;
}

function brandedEmailFooter() {
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
    </div>`;
}

// ── Build the test email (customer version) ──

const preferredDate = 'Friday, April 3, 2026';
const preferredTime = 'Morning (8am-12pm)';
const reason = 'Follow-up';

const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 32px 24px;">
      <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; text-align: center; margin: 0 0 4px; color: #2A4542;">Consultation Request Received</h1>
      <p style="text-align: center; color: #7E8D8A; font-size: 13px; margin: 0 0 28px;">We're on it.</p>

      <p style="margin: 0 0 24px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        We've received your consultation request. Our care team will contact you within 24 hours to confirm your appointment.
      </p>

      <div style="background: #FDFBF7; border-radius: 12px; padding: 20px; border: 1px solid #D4DBD9; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A; width: 140px;">Preferred Date</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${preferredDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A;">Preferred Time</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${preferredTime}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #7E8D8A;">Reason</td>
            <td style="padding: 12px 0; color: #2A4542; font-weight: 500;">${reason}</td>
          </tr>
        </table>
      </div>

      <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #2A4542;">Status: Awaiting Confirmation</p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #3A5956;">You'll hear from us within 24 hours.</p>
      </div>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`;

// ── Send ──

const resend = new Resend(RESEND_API_KEY);

try {
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: '[TEST] Consultation Request Received — CULTR Health',
    html,
  });
  console.log('Email sent successfully:', result);
} catch (err) {
  console.error('Failed to send email:', err);
  process.exit(1);
}
