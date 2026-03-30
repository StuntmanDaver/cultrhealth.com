import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface HeroCTA {
  label: string;
  href: string;
  variant?: 'primary' | 'ghost';
}

interface MarketingHeroProps {
  title: string | ReactNode;
  subtitle?: string;
  badge?: { icon: LucideIcon; label: string };
  proofLine?: string;
  ctas?: HeroCTA[];
  size?: 'default' | 'tall' | 'compact';
  children?: ReactNode;
  className?: string;
  backgroundImage?: string;
  align?: 'center' | 'left';
}

export function MarketingHero({
  title,
  subtitle,
  badge,
  proofLine,
  ctas,
  size = 'default',
  children,
  className,
  backgroundImage,
  align = 'center',
}: MarketingHeroProps) {
  const paddingMap = {
    compact: 'py-16 md:py-20',
    default: 'py-20 md:py-28',
    tall: 'py-28 md:py-36',
  };

  return (
    <section className={cn('relative px-6 text-white overflow-hidden', !backgroundImage && 'grad-dark-glow', paddingMap[size], className)}>
      {backgroundImage && (
        <>
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            className={cn('object-cover', align === 'left' ? 'object-right' : 'object-center')}
            sizes="100vw"
          />
          <div className={cn('absolute inset-0', align === 'left' ? 'bg-gradient-to-r from-brand-primary/90 via-brand-primary/70 to-brand-primary/40' : 'bg-brand-primary/65')} />
        </>
      )}
      <div className={cn('relative z-10', align === 'center' ? 'max-w-4xl mx-auto text-center' : 'max-w-5xl ml-auto mr-auto md:ml-[8%] md:mr-auto text-left')}>
        {badge && (
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <badge.icon className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">{badge.label}</span>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal direction="none" duration={800}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
            {title}
          </h1>
        </ScrollReveal>

        {subtitle && (
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className={cn('text-xl text-white/80 mb-6 max-w-2xl', align === 'center' && 'mx-auto')}>
              {subtitle}
            </p>
          </ScrollReveal>
        )}

        {proofLine && (
          <ScrollReveal delay={300} direction="none" duration={800}>
            <p className={cn('text-sm text-cultr-sage font-medium tracking-wide mb-8 max-w-xl', align === 'center' && 'mx-auto')}>
              {proofLine}
            </p>
          </ScrollReveal>
        )}

        {ctas && ctas.length > 0 && (
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className={cn('flex flex-col sm:flex-row gap-4', align === 'center' ? 'justify-center' : 'justify-start')}>
              {ctas.map((cta) => (
                <Link key={cta.label} href={cta.href}>
                  <Button
                    size="lg"
                    variant={cta.variant || 'primary'}
                    className={cta.variant === 'ghost' ? 'text-white hover:text-cultr-sage' : ''}
                  >
                    {cta.label}
                    {cta.variant === 'ghost' && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        )}

        {children}
      </div>
    </section>
  );
}
