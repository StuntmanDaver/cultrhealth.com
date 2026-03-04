import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/consult-history
 *
 * Fetches the authenticated member's consultation history.
 * Combines consult_requests table and order-derived consultations from asher_orders.
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
      return NextResponse.json({ success: true, history: [] });
    }

    const { sql } = await import('@vercel/postgres');

    const timeline: {
      id: string;
      type: string;
      date: string;
      description: string;
      status: string;
      reason?: string;
    }[] = [];

    // Fetch consult requests
    try {
      const requestsResult = await sql`
        SELECT id, preferred_date, preferred_time, reason, notes, status, created_at
        FROM consult_requests
        WHERE lower(customer_email) = ${email}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      for (const row of requestsResult.rows) {
        timeline.push({
          id: `request_${row.id}`,
          type: 'request',
          date: row.preferred_date || row.created_at,
          description: `Consultation request: ${row.reason || 'General'}`,
          status: row.status || 'pending',
          reason: row.reason,
        });
      }
    } catch {
      // consult_requests table may not exist yet
    }

    // Fetch order-derived consultations (each order implies provider review)
    try {
      const ordersResult = await sql`
        SELECT
          id,
          asher_order_id,
          order_status,
          medication_packages,
          created_at
        FROM asher_orders
        WHERE lower(customer_email) = ${email}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      for (const row of ordersResult.rows) {
        const packages = row.medication_packages as Array<{ name?: string; medicationName?: string }> | null;
        const medName = packages?.[0]?.name || packages?.[0]?.medicationName || 'Medication';

        timeline.push({
          id: `order_${row.id}`,
          type: 'order-review',
          date: row.created_at,
          description: `Provider review for ${medName}`,
          status: row.order_status === 'approved' || row.order_status === 'completed' || row.order_status === 'shipped' || row.order_status === 'prescribed'
            ? 'completed'
            : row.order_status === 'cancelled' || row.order_status === 'canceled'
              ? 'cancelled'
              : 'pending',
        });
      }
    } catch {
      // asher_orders table may not exist
    }

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, history: timeline });
  } catch (error) {
    console.error('Failed to fetch consult history:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch consultation history' },
      { status: 500 }
    );
  }
}
