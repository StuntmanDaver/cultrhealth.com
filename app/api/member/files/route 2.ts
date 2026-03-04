import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/files
 *
 * Fetches the authenticated member's uploaded documents from the database.
 * For each file, generates a preview URL via Asher Med's S3 presigned URLs.
 */
export async function GET(request: NextRequest) {
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

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ success: true, files: [] });
    }

    const { sql } = await import('@vercel/postgres');

    const result = await sql`
      SELECT
        id,
        s3_key,
        purpose,
        content_type,
        uploaded_at
      FROM asher_uploaded_files
      WHERE lower(customer_email) = ${email}
      ORDER BY uploaded_at DESC
    `;

    // Generate preview URLs for each file
    const files = await Promise.all(
      result.rows.map(async (row) => {
        let previewUrl: string | null = null;

        if (process.env.ASHER_MED_API_KEY && row.s3_key) {
          try {
            const { getPreviewUrl } = await import('@/lib/asher-med-api');
            const response = await getPreviewUrl(row.s3_key);
            previewUrl = response.data.previewUrl;
          } catch {
            // Preview URL unavailable — file still listed without view link
          }
        }

        return {
          id: row.id,
          purpose: row.purpose,
          contentType: row.content_type,
          previewUrl,
          uploadedAt: row.uploaded_at,
        };
      })
    );

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Failed to fetch member files:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
