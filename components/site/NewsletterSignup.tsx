import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function NewsletterSignup() {
  return (
    <section className="py-24 px-6 grad-light-glow">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
          Join the <span className="tracking-[0.08em]">CULTR</span> Health Creator Club
        </h2>
        <p className="text-cultr-textMuted mb-8">
          Earn commissions, get tracking links, coupon codes, and a dedicated creator dashboard.
        </p>

        <Link
          href="/creators"
          className="
            inline-flex items-center justify-center gap-2
            px-8 py-4 rounded-full
            grad-dark-glow text-white font-medium text-lg
            shadow-lux-lg
            hover:scale-[1.03]
            transition-all duration-300
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
