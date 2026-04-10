import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/orders
 *
 * Fetches the authenticated member's orders from the database.
 * Orders are stored in asher_orders table after intake submission.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify session from cookie
    const sessionCookie = request.cookies.get('cultr_session_v2');

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

    // Fetch orders from database
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({
        success: true,
        orders: [],
      });
    }

    const { sql } = await import('@vercel/postgres');

    const result = await sql`
      SELECT
        id,
        asher_order_id as "orderNumber",
        asher_patient_id as "patientId",
        order_status as status,
        medication_packages as "medicationPackages",
        created_at as "createdAt",
        updated_at as "updatedAt",
        'asher' as "source"
      FROM asher_orders
      WHERE lower(customer_email) = ${email}
      
      UNION ALL
      
      SELECT
        id,
        order_number as "orderNumber",
        NULL as "patientId",
        status as status,
        items as "medicationPackages",
        created_at as "createdAt",
        updated_at as "updatedAt",
        'club' as "source"
      FROM club_orders
      WHERE lower(member_email) = ${email}
      
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

    // TODO: Reconnect to new pharmacy partner for real-time order status
    const asherOrders: Record<string, { status: string; updatedAt: string }> = {};

    // Transform orders for frontend
    const orders = result.rows.map((row) => {
      const isClub = row.source === 'club';
      let packages = row.medicationPackages;
      
      if (typeof packages === 'string') {
        try {
          packages = JSON.parse(packages);
        } catch {
          packages = null;
        }
      }

      const asherOrderId = row.orderNumber;

      // Use Asher Med status if available, otherwise use database status
      const realTimeData = !isClub && asherOrderId && asherOrders[asherOrderId];
      const status = realTimeData?.status || row.status;
      const updatedAt = realTimeData?.updatedAt || row.updatedAt;

      return {
        id: row.id,
        orderNumber: asherOrderId || (isClub ? `CLB-${row.id}` : `ORD-${row.id}`),
        status: mapOrderStatus(status),
        medicationName: Array.isArray(packages) && packages.length > 0 
          ? (packages[0]?.name || packages[0]?.medicationName || 'Medication') 
          : 'Medication',
        createdAt: row.createdAt,
        updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Failed to fetch member orders:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * Map database status to frontend status
 */
function mapOrderStatus(dbStatus: string | null): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    pending_approval: 'pending',
    approved: 'approved',
    waiting_room: 'waitingRoom',
    waitingroom: 'waitingRoom',
    prescribed: 'prescribed',
    invoice_sent: 'approved',
    paid: 'processing',
    shipped: 'shipped',
    fulfilled: 'completed',
    completed: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    dismissed: 'cancelled',
    rejected: 'denied',
  };

  return statusMap[dbStatus?.toLowerCase() || ''] || 'pending';
}
