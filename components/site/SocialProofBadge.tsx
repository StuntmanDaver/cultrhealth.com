import { Star, Users } from 'lucide-react';
import { TRUST_METRICS } from '@/lib/config/social-proof';
import { cn } from '@/lib/utils';

interface SocialProofBadgeProps {
  variant?: 'inline' | 'pill';
  className?: string;
}

export function SocialProofBadge({ variant = 'pill', className }: SocialProofBadgeProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-4 text-sm text-cultr-textMuted', className)}>
        <span className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium text-cultr-forest">{TRUST_METRICS.avgRating}</span>
          <span>({TRUST_METRICS.reviewCount}+ reviews)</span>
        </span>
        <span className="hidden sm:inline text-cultr-sage">|</span>
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-cultr-forest" />
          <span>{TRUST_METRICS.memberCount} customers</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm',
      className,
    )}>
      <span className="flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        <span className="font-medium">{TRUST_METRICS.avgRating}</span>
      </span>
      <span className="w-px h-3.5 bg-current opacity-30" />
      <span>{TRUST_METRICS.memberCount} customers</span>
      <span className="w-px h-3.5 bg-current opacity-30" />
      <span>{TRUST_METRICS.reviewCount}+ reviews</span>
    </div>
  );
}
