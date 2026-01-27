import Button from '@/components/ui/Button';
import Link from 'next/link';

export function CTASection({ 
  title = "Ready to start your journey?", 
  subtitle = "Join CULTR today and unlock your full potential.",
  ctaText = "View Packages",
  ctaLink = "/pricing"
}) {
  return (
    <section className="py-24 px-6 bg-cultr-forest">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">{title}</h2>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">{subtitle}</p>
        <Link href={ctaLink}>
          <Button variant="secondary" size="lg">{ctaText}</Button>
        </Link>
      </div>
    </section>
  );
}
