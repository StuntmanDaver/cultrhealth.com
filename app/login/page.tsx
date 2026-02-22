import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LINKS } from '@/lib/config/links';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ArrowRight, Shield, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Member Login',
  description: 'Access your CULTR Health member portal to view messages, labs, appointments, and manage your protocols.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-24 px-6 bg-cultr-forest">
        <div className="max-w-md w-full text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Member <span className="italic">Login</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-white/80 max-w-md mx-auto mb-10">
              Access your secure patient portal to view messages, labs, appointments, and manage your protocols.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} direction="up" duration={600}>
            <a href={LINKS.healthiePortal} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full mb-4">
                Go to Portal <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>

            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-8">
              <Shield className="w-4 h-4" />
              <span>HIPAA-compliant secure access</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={600} direction="none" duration={600}>
            <p className="text-sm text-white/60">
              New here?{' '}
              <Link href="/pricing" className="text-cultr-sage hover:text-white transition-colors font-medium">
                Join CULTR
              </Link>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 px-6 bg-white border-t border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-display font-bold text-cultr-text mb-2">Need help logging in?</h3>
          <p className="text-sm text-cultr-textMuted mb-4">
            If you&apos;re having trouble accessing your account, our support team is here to help.
          </p>
          <a href={`mailto:${LINKS.supportEmail}`} className="text-sm text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium">
            Contact Support →
          </a>
        </div>
      </section>
    </main>
  );
}
