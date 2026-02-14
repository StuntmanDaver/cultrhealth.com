import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function NewsletterSignup() {
  return (
    <section className="py-24 px-6 bg-cultr-offwhite">
      <div className="max-w-2xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
          Join the CULTR Health Creator Club
        </h2>
        <p className="text-cultr-textMuted mb-8">
          Earn commissions, get tracking links, coupon codes, and a dedicated creator dashboard.
        </p>

        <Link
          href="/creators"
          className="
            inline-flex items-center justify-center gap-2
            px-8 py-4 rounded-full
            bg-cultr-forest text-white font-medium text-lg
            hover:bg-cultr-forestDark
            transition-colors
            group
          "
        >
          Become a Creator
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
