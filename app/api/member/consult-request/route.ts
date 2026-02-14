import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

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
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-size: 28px; font-weight: 300; letter-spacing: 0.3em; color: #fff;">CULTR</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; color: #fff; margin-bottom: 24px;">New Consultation Request</h1>
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; width: 140px;">Member</td><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${email}</td></tr>
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Preferred Date</td><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${preferredDate}</td></tr>
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Preferred Time</td><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${preferredTime}</td></tr>
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Reason</td><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${reason}</td></tr>
        ${notes ? `<tr><td style="padding: 12px 0; color: #888;">Notes</td><td style="padding: 12px 0; color: #fff;">${notes}</td></tr>` : ''}
      </table>
    </div>
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 16px; border: 1px solid #222;">
      <p style="color: #888; font-size: 13px; margin: 0;"><strong style="color: #c9a962;">Action Required:</strong> Contact the member within 24 hours to confirm appointment.</p>
    </div>
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
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-size: 28px; font-weight: 300; letter-spacing: 0.3em; color: #fff;">CULTR</span>
    </div>
    <h1 style="font-size: 28px; font-weight: 300; color: #fff; margin-bottom: 24px;">Consultation Request Received</h1>
    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      We've received your consultation request. Our care team will contact you within 24 hours to confirm your appointment.
    </p>
    <div style="background-color: #111; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888; width: 140px;">Preferred Date</td><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</td></tr>
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #888;">Preferred Time</td><td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff;">${preferredTime}</td></tr>
        <tr><td style="padding: 12px 0; color: #888;">Reason</td><td style="padding: 12px 0; color: #fff;">${reason}</td></tr>
      </table>
    </div>
    <div style="background-color: #0a0a0a; border-radius: 8px; padding: 20px; border: 1px solid #222;">
      <p style="color: #888; font-size: 13px; margin: 0;">Questions? Reply to this email or contact <a href="mailto:support@cultrhealth.com" style="color: #c9a962; text-decoration: none;">support@cultrhealth.com</a></p>
    </div>
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #222;">
      <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">CULTR Health — Personalized Longevity Medicine</p>
    </div>
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
