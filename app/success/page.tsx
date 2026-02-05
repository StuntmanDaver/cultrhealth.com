import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LINKS } from '@/lib/config/links';
import { CheckCircle, Calendar, FileText, ArrowRight, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welcome to CULTR — CULTR Health',
  description: 'Your CULTR Health membership is active. Complete your intake and book your first consultation.',
};

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  // Optional: Retrieve session details from Stripe if session_id is provided
  let customerEmail: string | null = null;
  let planName: string | null = null;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover',
      });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email || null;
      planName = session.metadata?.plan_name || null;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 bg-cultr-forest text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-cultr-sage/20 rounded-full flex items-center justify-center mb-8 mx-auto border border-cultr-sage/30">
            <CheckCircle className="w-10 h-10 text-cultr-sage" />
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            You&apos;re in{customerEmail ? ', ' + customerEmail.split('@')[0] : ''}.
          </h1>
          <p className="text-xl text-white/80 max-w-xl mx-auto">
            Welcome to CULTR{planName ? ` ${planName}` : ''}. Your membership is active. Complete these two steps to start your journey.
          </p>
        </div>
      </section>

      {/* Next Steps */}
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
