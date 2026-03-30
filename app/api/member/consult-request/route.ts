import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { escapeHtml, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT } from '@/lib/resend';

/**
 * POST /api/member/consult-request
 *
 * Creates a consultation request from the authenticated member.
 * Stores in database and sends notification emails.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('cultr_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const email = session.email?.toLowerCase();
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email in session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferredDate, preferredTime, reason, notes } = body;

    if (!preferredDate || !preferredTime || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: preferredDate, preferredTime, reason' },
        { status: 400 }
      );
    }

    let requestId: number | null = null;

    // Store in database
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');

        const result = await sql`
          INSERT INTO consult_requests (customer_email, preferred_date, preferred_time, reason, notes)
          VALUES (${email}, ${preferredDate}, ${preferredTime}, ${reason}, ${notes || null})
          RETURNING id
        `;

        requestId = result.rows[0]?.id;
      } catch (dbError) {
        console.error('Failed to store consult request:', dbError);
        // Continue to send email even if DB fails
      }
    }

    // Send notification email to founder/care team
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>';
        const founderEmail = process.env.FOUNDER_EMAIL;

        // Notify care team
        if (founderEmail) {
          await resend.emails.send({
            from: fromEmail,
            to: founderEmail,
            subject: `New Consult Request from ${email}`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 32px 24px;">
      <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; text-align: center; margin: 0 0 28px; color: #2A4542;">New Consultation Request</h1>
      <div style="background: #FDFBF7; border-radius: 12px; padding: 20px; border: 1px solid #D4DBD9; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A; width: 140px;">Member</td><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A;">Preferred Date</td><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${escapeHtml(preferredDate)}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A;">Preferred Time</td><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${escapeHtml(preferredTime)}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A;">Reason</td><td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${escapeHtml(reason)}</td></tr>
          ${notes ? `<tr><td style="padding: 12px 0; color: #7E8D8A;">Notes</td><td style="padding: 12px 0; color: #2A4542;">${escapeHtml(notes)}</td></tr>` : ''}
        </table>
      </div>
      <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #2A4542;">Action Required</p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #3A5956;">Contact the member within 24 hours to confirm appointment.</p>
      </div>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
          });
        }

        // Send confirmation to member
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Consultation Request Received — CULTR Health',
          html: `
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
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #7E8D8A;">Preferred Time</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #D4DBD9; color: #2A4542; font-weight: 500;">${escapeHtml(preferredTime)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #7E8D8A;">Reason</td>
            <td style="padding: 12px 0; color: #2A4542; font-weight: 500;">${escapeHtml(reason)}</td>
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
</html>`,
        });
      } catch (emailError) {
        console.error('Failed to send consult request emails:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Consultation request submitted successfully',
    });
  } catch (error) {
    console.error('Failed to create consult request:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit consultation request' },
      { status: 500 }
    );
  }
}
