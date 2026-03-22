'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Tag } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import type { TherapyProduct } from '@/lib/config/therapies';
import { BUNDLE_DISCOUNT_RATE } from '@/lib/config/join-therapies';

interface TherapiesGridProps {
  products: TherapyProduct[];
}

export default function TherapiesGrid({ products }: TherapiesGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, i) => {
        const isExpanded = expandedId === product.id;

        return (
          <ScrollReveal key={product.id} delay={i * 60} direction="up">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : product.id)}
              className="glass-card rounded-2xl border-gradient glow-card w-full text-left transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="overflow-hidden rounded-t-2xl bg-white/50">
                <div className="group relative w-full aspect-square flex items-center justify-center p-6">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={280}
                    height={280}
                    quality={85}
                    className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Name + Tag */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-base font-display font-bold text-cultr-forest">
                    {product.name}
                  </h3>
                  {product.tag && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-cultr-forest bg-mint/60 px-2 py-0.5 rounded-full">
                      {product.tag}
                    </span>
                  )}
                </div>

                {/* Bundle badge */}
                {product.bundleWith && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cultr-forest bg-sage/40 px-2.5 py-1 rounded-full">
                      <Tag className="w-3 h-3" />
                      Bundle &amp; save {Math.round(BUNDLE_DISCOUNT_RATE * 100)}%
                    </span>
                  </div>
                )}

                {/* Spec + Rx badge */}
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-cultr-forest/60 font-medium">
                    {product.spec}
                  </p>
                  <span className="text-[10px] font-semibold text-cultr-forest/50 border border-cultr-forest/20 rounded-full px-2 py-0.5">
                    Prescription only
                  </span>
                </div>

                {/* Short description */}
                <p className="text-xs text-cultr-textMuted leading-relaxed">
                  {product.shortDescription}
                </p>

                {/* Expand indicator */}
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-cultr-sage/20">
                  <ChevronDown
                    className={`w-4 h-4 text-cultr-forest/40 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Expanded content */}
                <div
                  className={`grid transition-all duration-300 ${
                    isExpanded
                      ? 'grid-rows-[1fr] opacity-100 mt-3'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs text-cultr-textMuted leading-relaxed mb-4">
                      {product.longDescription}
                    </p>
                    <Link href="/quiz">
                      <Button size="sm" className="w-full">
                        Take the Quiz <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </button>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
