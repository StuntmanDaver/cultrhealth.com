'use client';

import { cn } from '@/lib/utils';

export const GOAL_CATEGORIES = [
  { id: 'all', label: 'All Therapies' },
  { id: 'weight-management', label: 'Weight Management', tags: ['GLP-1', 'GLP-1/GIP/GCG'] },
  { id: 'recovery', label: 'Recovery & Repair', tags: ['Repair', 'Copper Peptide', 'Antioxidant'] },
  { id: 'performance', label: 'Performance & Growth', tags: ['Growth Hormone'] },
  { id: 'cognitive', label: 'Cognitive & Focus', tags: ['Neuropeptide'] },
  { id: 'longevity', label: 'Longevity & Baseline', tags: ['Longevity', 'Antioxidant'] },
  { id: 'aesthetics', label: 'Skin & Aesthetics', tags: ['Melanocortin', 'Copper Peptide'] },
] as const;

export type GoalCategoryId = (typeof GOAL_CATEGORIES)[number]['id'];

interface TherapyGoalFilterProps {
  activeCategory: GoalCategoryId;
  onCategoryChange: (id: GoalCategoryId) => void;
  className?: string;
}

export function TherapyGoalFilter({ activeCategory, onCategoryChange, className }: TherapyGoalFilterProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 justify-center', className)}>
      {GOAL_CATEGORIES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onCategoryChange(id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            activeCategory === id
              ? 'bg-cultr-forest text-white shadow-sm'
              : 'bg-white/80 text-cultr-forest hover:bg-cultr-sage/30 border border-cultr-sage/30',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Filter therapy products by goal category. Returns all if category is 'all'. */
export function filterByGoal(products: { tag?: string }[], categoryId: GoalCategoryId) {
  if (categoryId === 'all') return products;
  const category = GOAL_CATEGORIES.find((c) => c.id === categoryId);
  if (!category || !('tags' in category)) return products;
  return products.filter((p) => p.tag && (category.tags as readonly string[]).includes(p.tag));
}
