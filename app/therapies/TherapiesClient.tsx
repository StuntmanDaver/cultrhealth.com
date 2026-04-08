'use client';

import { useState } from 'react';
import { TherapyGoalFilter, filterByGoal, type GoalCategoryId } from '@/components/site/TherapyGoalFilter';
import TherapiesGrid from '@/components/site/TherapiesGrid';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import type { TherapyProduct } from '@/lib/config/therapies';

interface TherapiesClientProps {
  products: TherapyProduct[];
}

export default function TherapiesClient({ products }: TherapiesClientProps) {
  const [activeCategory, setActiveCategory] = useState<GoalCategoryId>('all');
  const filtered = filterByGoal(products, activeCategory);

  return (
    <>
      <ScrollReveal className="mb-8">
        <TherapyGoalFilter
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </ScrollReveal>

      {filtered.length === 0 ? (
        <p className="text-center text-cultr-textMuted py-12">No therapies match this filter.</p>
      ) : (
        <TherapiesGrid products={filtered as TherapyProduct[]} />
      )}
    </>
  );
}
