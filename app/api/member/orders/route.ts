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
        updated_at as "updatedAt"
      FROM asher_orders
      WHERE lower(customer_email) = ${email}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Optionally fetch real-time status from Asher Med
    let asherOrders: Record<number, { status: string; updatedAt: string }> = {};

    if (process.env.ASHER_MED_API_KEY && result.rows.length > 0) {
      try {
        const { getOrders } = await import('@/lib/asher-med-api');
        const patientId = result.rows[0]?.patientId;

        if (patientId) {
          const asherResponse = await getOrders({ patientId: parseInt(patientId, 10) });
          if (asherResponse.data && asherResponse.data.length > 0) {
            // Map Asher Med orders by ID for quick lookup
            asherResponse.data.forEach((order) => {
              asherOrders[order.id] = {
                status: order.status,
                updatedAt: order.updatedAt,
              };
            });
          }
        }
      } catch (apiError) {
        console.log('Unable to fetch real-time order status from Asher Med:', apiError);
        // Continue with database data
      }
    }

    // Transform orders for frontend, merging with real-time data
    const orders = result.rows.map((row) => {
      const packages = row.medicationPackages as Array<{ name: string; medicationName?: string }> | null;
      const asherOrderId = row.orderNumber;

      // Use Asher Med status if available, otherwise use database status
      const realTimeData = asherOrderId && asherOrders[asherOrderId];
      const status = realTimeData?.status || row.status;
      const updatedAt = realTimeData?.updatedAt || row.updatedAt;

      return {
        id: row.id,
        orderNumber: asherOrderId || `ORD-${row.id}`,
        status: mapOrderStatus(status),
        medicationName: packages?.[0]?.name || packages?.[0]?.medicationName || 'Medication',
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
    approved: 'approved',
    waiting_room: 'waitingRoom',
    waitingroom: 'waitingRoom',
    prescribed: 'prescribed',
    shipped: 'shipped',
    completed: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
  };

  return statusMap[dbStatus?.toLowerCase() || ''] || 'pending';
}
