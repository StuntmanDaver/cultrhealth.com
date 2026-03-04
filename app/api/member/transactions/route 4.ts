import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * GET /api/member/transactions
 *
 * Fetches the authenticated member's transaction history from Stripe invoices
 * and local orders table.
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
    const customerId = session.customerId;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email in session' },
        { status: 401 }
      );
    }

    const transactions: {
      id: string;
      type: string;
      description: string;
      amount: number;
      currency: string;
      status: string;
      date: string;
      invoiceUrl?: string;
      receiptUrl?: string;
    }[] = [];

    // Fetch Stripe invoices if configured
    if (process.env.STRIPE_SECRET_KEY && customerId && customerId !== 'dev_customer') {
      try {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2026-01-28.clover',
        });

        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: 50,
        });

        for (const invoice of invoices.data) {
          transactions.push({
            id: invoice.id,
            type: 'subscription',
            description: invoice.lines.data[0]?.description || 'CULTR Membership',
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: invoice.status === 'paid' ? 'paid' : invoice.status === 'open' ? 'pending' : 'failed',
            date: new Date((invoice.created || 0) * 1000).toISOString(),
            invoiceUrl: invoice.hosted_invoice_url || undefined,
            receiptUrl: invoice.invoice_pdf || undefined,
          });
        }
      } catch (stripeError) {
        console.log('Unable to fetch Stripe invoices:', stripeError);
      }
    }

    // Fetch local orders
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');

        const result = await sql`
          SELECT
            id,
            order_number,
            total_amount,
            currency,
            payment_status,
            created_at
          FROM orders
          WHERE lower(customer_email) = ${email}
          ORDER BY created_at DESC
          LIMIT 50
        `;

        for (const row of result.rows) {
          // Avoid duplicates with Stripe invoices
          const existingIds = new Set(transactions.map(t => t.id));
          const orderId = `order_${row.id}`;
          if (!existingIds.has(orderId)) {
            transactions.push({
              id: orderId,
              type: 'product',
              description: `Order ${row.order_number || row.id}`,
              amount: parseFloat(row.total_amount || '0'),
              currency: (row.currency || 'USD').toUpperCase(),
              status: row.payment_status === 'paid' ? 'paid' : row.payment_status === 'pending' ? 'pending' : 'failed',
              date: row.created_at,
            });
          }
        }
      } catch (dbError) {
        console.log('Unable to fetch local orders:', dbError);
      }
    }

    // Sort all transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Failed to fetch member transactions:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
