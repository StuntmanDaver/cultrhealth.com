import { FDA_STATUSES, type FDAStatus } from '@/lib/config/compliance';
import { cn } from '@/lib/utils';

const statusColors: Record<FDAStatus, string> = {
  'fda-approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'fda-approved-compounded': 'bg-blue-50 text-blue-800 border-blue-200',
  'not-fda-approved': 'bg-amber-50 text-amber-800 border-amber-200',
  investigational: 'bg-red-50 text-red-800 border-red-200',
};

interface FDAStatusBadgeProps {
  therapyId: string;
  showDisclaimer?: boolean;
  className?: string;
}

export function FDAStatusBadge({ therapyId, showDisclaimer = false, className }: FDAStatusBadgeProps) {
  const info = FDA_STATUSES[therapyId];
  if (!info) return null;

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border',
          statusColors[info.status]
        )}
      >
        {info.label}
      </span>
      {showDisclaimer && (
        <p className="text-[10px] text-gray-500 leading-tight max-w-xs">
          {info.disclaimer}
        </p>
      )}
    </div>
  );
}
