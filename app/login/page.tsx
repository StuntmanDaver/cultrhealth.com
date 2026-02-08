'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LINKS } from '@/lib/config/links';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ArrowRight, Shield, Lock, Search, Package, AlertCircle } from 'lucide-react';

interface PatientResult {
  found: boolean;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  orders?: Array<{
    orderId: string;
    status: string;
    medication: string;
    createdAt: string;
  }>;
}

export default function LoginPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PatientResult | null>(null);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/renewal/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: query.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.patient) {
        setResult({ found: true, patient: data.patient, orders: data.orders });
      } else {
        setResult({ found: false });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-24 px-6 bg-cultr-forest">
        <div className="max-w-md w-full text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Member Login
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-white/80 max-w-md mx-auto mb-10">
              Enter your phone number to check your order status and access your dashboard.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} direction="up" duration={600}>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="tel"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-cultr-sage focus:ring-1 focus:ring-cultr-sage transition-colors"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? 'Looking up...' : 'Check Status'}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-300 text-sm justify-center">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {result && result.found && (
              <div className="mt-6 bg-white/10 rounded-2xl p-6 text-left border border-white/20">
                <p className="text-white font-medium mb-4">
                  Welcome back, {result.patient?.firstName}!
                </p>
                {result.orders && result.orders.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {result.orders.slice(0, 3).map((order) => (
                      <div key={order.orderId} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                        <Package className="w-4 h-4 text-cultr-sage flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{order.medication}</p>
                          <p className="text-white/60 text-xs capitalize">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard">
                  <Button size="lg" className="w-full">
                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            {result && !result.found && (
              <div className="mt-6 bg-white/10 rounded-2xl p-6 text-center border border-white/20">
                <p className="text-white/80 text-sm mb-4">
                  We couldn&apos;t find an account with that phone number.
                </p>
                <Link href="/pricing">
                  <Button variant="ghost" className="text-cultr-sage hover:text-white">
                    Join CULTR <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mt-6">
              <Shield className="w-4 h-4" />
              <span>HIPAA-compliant secure access</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={600} direction="none" duration={600}>
            <p className="text-sm text-white/60 mt-6">
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
          <h3 className="font-display font-bold text-cultr-text mb-2">Need help?</h3>
          <p className="text-sm text-cultr-textMuted mb-4">
            If you&apos;re having trouble finding your account, our support team is here to help.
          </p>
          <a href={`mailto:${LINKS.supportEmail}`} className="text-sm text-cultr-forest hover:text-cultr-forestDark transition-colors font-medium">
            Contact Support →
          </a>
        </div>
      </section>
    </div>
  );
}
