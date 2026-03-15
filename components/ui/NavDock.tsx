'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface NavDockItemProps {
  href: string;
  label: string;
  hasDropdown?: boolean;
  isActive: boolean;
  scrolled: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
}

function NavDockItem({ href, label, hasDropdown, isActive, scrolled, mouseX }: NavDockItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scale = useSpring(
    useTransform(distance, [-120, 0, 120], [1, 1.2, 1]),
    { mass: 0.1, stiffness: 180, damping: 18 }
  );

  return (
    <Link
      ref={ref}
      href={href}
      className={`
        inline-flex items-center font-body font-medium
        rounded-lg whitespace-nowrap tracking-[0.01em]
        transition-colors duration-200 ease-out hover:bg-brand-primary/[0.07]
        ${isActive ? 'text-brand-primary bg-brand-primary/[0.08]' : 'text-brand-primary'}
        ${scrolled ? 'text-[13px] py-1.5 px-3' : 'text-sm py-[7px] px-[15px]'}
      `}
    >
      <motion.span
        style={{ scale, transformOrigin: 'bottom center', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {label}
        {hasDropdown && (
          <ChevronDown className="w-[13px] h-[13px] opacity-45" />
        )}
      </motion.span>
    </Link>
  );
}

interface NavDockProps {
  links: { href: string; label: string; hasDropdown?: boolean }[];
  isActive: (href: string) => boolean;
  scrolled: boolean;
  className?: string;
}

export function NavDock({ links, isActive, scrolled, className }: NavDockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div
      className={`flex items-center gap-0.5 ${className ?? ''}`}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {links.map((link) => (
        <NavDockItem
          key={link.href}
          href={link.href}
          label={link.label}
          hasDropdown={link.hasDropdown}
          isActive={isActive(link.href)}
          scrolled={scrolled}
          mouseX={mouseX}
        />
      ))}
    </div>
  );
}
