import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { startCronRun } from '@/lib/cron-logger';
import { createNowInvoice } from '@/lib/payments/nowpayments-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const run = await startCronRun('nowpayments-invoices');

  try {
    // Find paid NP orders that need renewal invoices
    const { rows: orders } = await sql`
      SELECT order_number, customer_email, total_amount, notes
      FROM orders
      WHERE payment_provider = 'nowpayments'
        AND status = 'paid'
    `;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://staging.cultrhealth.com';
    let processed = 0;
    let skipped = 0;

    for (const order of orders) {
      try {
        const notes = order.notes ? JSON.parse(order.notes) : {};
        const nextBilling = notes.next_billing_date ? new Date(notes.next_billing_date) : null;

        if (!nextBilling) {
          skipped++;
          continue;
        }

        // Only send invoice if billing date is within 3 days
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 3600 * 1000);
        if (nextBilling > threeDaysFromNow) {
          skipped++;
          continue;
        }

        // Skip if we already sent an invoice for this billing cycle
        const billingMonth = `${nextBilling.getFullYear()}-${String(nextBilling.getMonth() + 1).padStart(2, '0')}`;
        if (notes.invoice_sent_date === billingMonth) {
          skipped++;
          continue;
        }

        // Create NOWPayments invoice
        const invoice = await createNowInvoice({
          price_amount: Number(order.total_amount),
          price_currency: 'usd',
          pay_currency: 'btc',
          order_id: order.order_number,
          order_description: `CULTR Health renewal - ${notes.plan_slug || 'membership'}`,
          ipn_callback_url: `${siteUrl}/api/webhook/nowpayments`,
          success_url: `${siteUrl}/success`,
          cancel_url: siteUrl,
        });

        // Send renewal email
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.FROM_EMAIL || 'admin@cultrhealth.com',
            to: order.customer_email,
            subject: 'Your CULTR Health Bitcoin invoice is ready',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2A4542;">Your Monthly Invoice</h2>
                <p>Your CULTR Health membership renewal invoice is ready.</p>
                <p><strong>Amount:</strong> $${Number(order.total_amount).toFixed(2)} USD</p>
                <p><strong>Due:</strong> ${nextBilling.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p style="margin: 24px 0;">
                  <a href="${invoice.invoice_url}" style="background: #2A4542; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">
                    Pay with Bitcoin
                  </a>
                </p>
                <p style="color: #666; font-size: 12px;">If you have questions, contact support@cultrhealth.com</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('NOWPayments invoice email failed:', emailError);
        }

        // Update notes with invoice sent date
        const updatedNotes = {
          ...notes,
          invoice_sent_date: billingMonth,
          next_billing_date: new Date(nextBilling.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
        };
        await sql`
          UPDATE orders
          SET notes = ${JSON.stringify(updatedNotes)}, updated_at = NOW()
          WHERE order_number = ${order.order_number}
        `;

        processed++;
      } catch (orderError) {
        console.error(`NOWPayments invoice error for ${order.order_number}:`, orderError);
        skipped++;
      }
    }

    const result = { processed, skipped, total: orders.length };
    await run.success(result);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('NOWPayments invoices cron error:', error);
    await run.error(error);
    return NextResponse.json({ error: 'Failed to process invoices' }, { status: 500 });
  }
}
