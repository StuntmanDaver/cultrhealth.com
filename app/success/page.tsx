import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LINKS } from '@/lib/config/links';
import { CheckCircle, Calendar, FileText, ArrowRight, Check, Clock, Download, Receipt } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welcome to CULTR — CULTR Health',
  description: 'Your CULTR Health membership is active. Complete your intake and book your first consultation.',
};

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    provider?: string;
    order_id?: string;
    pending?: string;
    type?: string;
    checkout_token?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const provider = params.provider || 'stripe';
  const orderId = params.order_id;
  const checkoutToken = params.checkout_token;
  let isPending = params.pending === 'true';
  const isProductPurchase = params.type === 'product';

  // Retrieve session details from Stripe if session_id is provided
  let customerEmail: string | null = null;
  let planName: string | null = null;
  let paymentIntentId: string | null = null;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover',
      });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email || null;
      planName = session.metadata?.plan_name || null;
      paymentIntentId = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || null;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
    }
  }

  // Affirm: authorize + capture charge server-side when checkout_token is present
  let affirmCaptureError = false;
  if (
    provider === 'affirm' &&
    checkoutToken &&
    process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY &&
    process.env.AFFIRM_PRIVATE_API_KEY
  ) {
    try {
      const { authorizeAffirmCharge, captureAffirmCharge } = await import(
        '@/lib/payments/affirm-api'
      );
      const charge = await authorizeAffirmCharge(checkoutToken);
      await captureAffirmCharge(charge.id, orderId || undefined);
      console.log('Affirm charge captured on success page:', {
        charge_id: charge.id,
        order_id: orderId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to capture Affirm charge:', error);
      affirmCaptureError = true;
      isPending = true;
    }
  }

  // Fetch LMN data for product purchases
  let lmnNumber: string | null = null;
  let lmnIssueDate: string | null = null;
  let lmnEligibleTotal: number | null = null;
  let orderNumber: string | null = null;

  if (isProductPurchase && process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres');

      // Find order by payment intent ID (already retrieved above)
      if (paymentIntentId) {
        const orderResult = await sql`
          SELECT order_number FROM orders 
          WHERE stripe_payment_intent_id = ${paymentIntentId}
          LIMIT 1
        `;
        if (orderResult.rows.length > 0) {
          orderNumber = orderResult.rows[0].order_number;
        }
      }

      // Find LMN by order number (if we found the order)
      if (orderNumber) {
        const lmnResult = await sql`
          SELECT lmn_number, issue_date, eligible_total 
          FROM lmn_records 
          WHERE order_number = ${orderNumber}
          LIMIT 1
        `;
        if (lmnResult.rows.length > 0) {
          lmnNumber = lmnResult.rows[0].lmn_number;
          lmnIssueDate = new Date(lmnResult.rows[0].issue_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          lmnEligibleTotal = Number(lmnResult.rows[0].eligible_total);
        }
      }

      // Fallback: find LMN by customer email (most recent)
      if (!lmnNumber && customerEmail) {
        const fallbackResult = await sql`
          SELECT lmn_number, issue_date, eligible_total 
          FROM lmn_records 
          WHERE lower(customer_email) = lower(${customerEmail})
          ORDER BY created_at DESC
          LIMIT 1
        `;
        if (fallbackResult.rows.length > 0) {
          // Only use if created within last 5 minutes (likely this order)
          const createdAt = new Date(fallbackResult.rows[0].issue_date);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (createdAt > fiveMinutesAgo) {
            lmnNumber = fallbackResult.rows[0].lmn_number;
            lmnIssueDate = createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            lmnEligibleTotal = Number(fallbackResult.rows[0].eligible_total);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch LMN:', error);
    }
  }

  // Provider-specific messaging
  const providerMessages: Record<string, { badge: string; note: string }> = {
    stripe: {
      badge: 'Payment confirmed',
      note: '',
    },
    klarna: {
      badge: isPending ? 'Payment pending review' : 'Klarna payment approved',
      note: isPending
        ? 'Klarna is reviewing your payment. You will receive a confirmation email shortly.'
        : 'Your Klarna payment has been processed. You will receive a confirmation from Klarna.',
    },
    affirm: {
      badge: affirmCaptureError ? 'Payment processing' : 'Affirm payment approved',
      note: affirmCaptureError
        ? 'We encountered an issue capturing your Affirm payment. Our team will follow up shortly to resolve this.'
        : 'Your Affirm payment plan is active. You will receive payment schedule details from Affirm.',
    },
  };

  const msg = providerMessages[provider] || providerMessages.stripe;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 bg-cultr-forest text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-cultr-sage/20 rounded-full flex items-center justify-center mb-8 mx-auto border border-cultr-sage/30">
            {isPending ? (
              <Clock className="w-10 h-10 text-cultr-sage" />
            ) : (
              <CheckCircle className="w-10 h-10 text-cultr-sage" />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            {isPending
              ? 'Payment Pending'
              : isProductPurchase
                ? 'Order Confirmed'
                : `You\u2019re in${customerEmail ? ', ' + customerEmail.split('@')[0] : ''}.`
            }
          </h1>

          {msg.badge && (
            <span className="inline-block text-xs font-bold tracking-widest uppercase bg-cultr-sage/20 text-cultr-sage px-3 py-1 rounded-full mb-4">
              {msg.badge}
            </span>
          )}

          <p className="text-xl text-white/80 max-w-xl mx-auto">
            {isProductPurchase
              ? 'Your product order has been placed. We will process and ship your items shortly.'
              : `Welcome to CULTR${planName ? ` ${planName}` : ''}. ${isPending ? 'Your membership will be activated once payment is confirmed.' : 'Your membership is active. Complete these two steps to start your journey.'}`
            }
          </p>

          {msg.note && (
            <p className="text-sm text-white/60 mt-4 max-w-lg mx-auto">
              {msg.note}
            </p>
          )}

          {orderId && (
            <p className="text-xs text-white/40 mt-4">
              Order ID: {orderId}
            </p>
          )}
        </div>
      </section>

      {/* Next Steps (not shown for product purchases) */}
      {!isProductPurchase && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <a href={LINKS.healthiePortal} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="h-full p-8 rounded-2xl bg-cultr-offwhite border border-cultr-sage hover:border-cultr-forest/50 transition-all flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-cultr-forest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-cultr-forest tracking-widest mb-2">STEP 1</span>
                  <h3 className="text-lg font-display font-bold text-cultr-text mb-2">Create Portal Account</h3>
                  <p className="text-sm text-cultr-textMuted mb-6 flex-1">Set up your secure access and complete your intake forms.</p>
                  <Button className="w-full">Create Account <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </a>

              <a href={LINKS.healthiePortal} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="h-full p-8 rounded-2xl bg-cultr-offwhite border border-cultr-sage hover:border-cultr-forest/50 transition-all flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-cultr-forest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-cultr-forest tracking-widest mb-2">STEP 2</span>
                  <h3 className="text-lg font-display font-bold text-cultr-text mb-2">Book Your Consult</h3>
                  <p className="text-sm text-cultr-textMuted mb-6 flex-1">Schedule your first telehealth visit with a licensed provider.</p>
                  <Button variant="secondary" className="w-full">Book Now <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </a>
            </div>

            {/* Timeline */}
            <div className="bg-cultr-mint rounded-2xl p-8 border border-cultr-sage">
              <h3 className="font-display font-bold text-cultr-forest mb-6">What happens next?</h3>
              <div className="space-y-6">
                {[
                  {
                    title: 'Complete Your Intake',
                    desc: 'Fill out your health history forms in the portal.',
                    active: true,
                  },
                  {
                    title: 'Meet Your Provider',
                    desc: 'Discuss your goals and review your health history.',
                    active: false,
                  },
                  {
                    title: 'Get Your Protocol',
                    desc: 'Receive your personalized treatment plan.',
                    active: false,
                  },
                  {
                    title: 'Start Your Journey',
                    desc: 'Begin your optimized health protocol.',
                    active: false,
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      step.active ? 'bg-cultr-forest' : 'bg-cultr-sage'
                    }`}>
                      {step.active ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-cultr-forest">{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${step.active ? 'text-cultr-forest' : 'text-cultr-text'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-cultr-textMuted">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Product purchase: LMN and next steps */}
      {isProductPurchase && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-2xl mx-auto">
            {/* HSA/FSA LMN Section */}
            {lmnNumber && (
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-display font-bold text-cultr-forest">
                        HSA/FSA Documentation Ready
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide">
                        Tax-Free
                      </span>
                    </div>
                    <p className="text-sm text-cultr-textMuted mb-4">
                      Your Letter of Medical Necessity has been generated. Use this document to get reimbursed from your HSA or FSA account.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-emerald-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-cultr-textMuted uppercase tracking-wide">LMN Reference</p>
                          <p className="font-mono text-sm text-cultr-forest font-medium">{lmnNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-cultr-textMuted uppercase tracking-wide">Eligible Amount</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {lmnEligibleTotal ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lmnEligibleTotal) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3 flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-800">LMN Sent to Your Email</p>
                          <p className="text-xs text-emerald-700 mt-1">
                            Check your inbox{customerEmail ? ` at ${customerEmail}` : ''} for the PDF attachment. 
                            You can also download it anytime from your member portal.
                          </p>
                        </div>
                      </div>
                      {lmnIssueDate && (
                        <p className="text-xs text-cultr-textMuted mt-2 text-right">
                          Issued {lmnIssueDate}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-cultr-textMuted mt-3">
                      Submit this letter to your HSA/FSA administrator for tax-free reimbursement. 
                      The document is also available in your <Link href="/library" className="text-emerald-600 hover:underline">member portal</Link>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What happens next */}
            <div className="text-center">
              <h3 className="text-xl font-display font-bold text-cultr-forest mb-4">
                What happens next?
              </h3>
              <p className="text-cultr-textMuted mb-6">
                Our team will process your order. You will receive a shipping confirmation email with tracking details.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/library/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cultr-forest text-white font-bold rounded-lg hover:bg-cultr-forest/90 transition-colors"
                >
                  Continue Shopping
                </Link>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cultr-offwhite text-cultr-forest font-bold rounded-lg hover:bg-cultr-sage/30 transition-colors border border-cultr-sage"
                >
                  <FileText className="w-4 h-4" />
                  View All Documents
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Support */}
      <section className="py-8 px-6 bg-cultr-offwhite border-t border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-cultr-textMuted">
            Need help?{' '}
            <a href={`mailto:${LINKS.supportEmail}`} className="text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
