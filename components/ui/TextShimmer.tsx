'use client';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Defined at module level — never recreated on re-render, so animations persist
const MotionSpan = motion.span;
const MotionP = motion.p;
const MotionH1 = motion.h1;
const MotionH2 = motion.h2;

const MOTION_TAGS = { span: MotionSpan, p: MotionP, h1: MotionH1, h2: MotionH2 } as const;
type MotionTag = keyof typeof MOTION_TAGS;

interface TextShimmerProps {
  children: string;
  as?: MotionTag;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as: tag = 'span',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = MOTION_TAGS[tag];

  const dynamicSpread = useMemo(() => children.length * spread, [children, spread]);

  return (
    <MotionComponent
      className={cn('relative inline-block bg-clip-text text-transparent', className)}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{ repeat: Infinity, duration, ease: 'linear' }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage: [
          // Shimmer layer: sage highlight that sweeps across
          `linear-gradient(90deg, transparent calc(50% - var(--spread)), #B7E4C7, transparent calc(50% + var(--spread)))`,
          // Base layer: solid forest green text color
          `linear-gradient(#2A4542, #2A4542)`,
        ].join(', '),
        backgroundSize: '250% 100%, auto',
        backgroundRepeat: 'no-repeat, repeat',
      } as React.CSSProperties}
    >
      {children}
    </MotionComponent>
  );
}
