'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Shared IntersectionObserver for all ScrollReveal components
// This dramatically reduces memory usage and improves performance
type ObserverCallback = (isIntersecting: boolean) => void;
const observerCallbacks = new Map<Element, ObserverCallback>();

let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;
  
  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const callback = observerCallbacks.get(entry.target);
        if (callback) {
          callback(entry.isIntersecting);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );
  
  return sharedObserver;
}

function observe(element: Element, callback: ObserverCallback): () => void {
  const observer = getSharedObserver();
  observerCallbacks.set(element, callback);
  observer.observe(element);
  
  return () => {
    observer.unobserve(element);
    observerCallbacks.delete(element);
  };
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 600,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  const handleIntersection = useCallback((isIntersecting: boolean) => {
    if (isIntersecting) {
      setIsVisible(true);
      hasAnimated.current = true;
    } else if (!once && !hasAnimated.current) {
      setIsVisible(false);
    }
  }, [once]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if already visible on mount (above the fold)
    const rect = el.getBoundingClientRect();
    if (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    ) {
      setIsVisible(true);
      hasAnimated.current = true;
      if (once) return;
    }

    const unobserve = observe(el, (isIntersecting) => {
      handleIntersection(isIntersecting);
      if (isIntersecting && once) {
        unobserve();
      }
    });

    return unobserve;
  }, [once, handleIntersection]);

  const transform = isVisible
    ? 'translate3d(0, 0, 0)'
    : direction === 'up'
      ? 'translate3d(0, 30px, 0)'
      : direction === 'down'
        ? 'translate3d(0, -30px, 0)'
        : direction === 'left'
          ? 'translate3d(30px, 0, 0)'
          : direction === 'right'
            ? 'translate3d(-30px, 0, 0)'
            : 'translate3d(0, 0, 0)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform,
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// Stagger container for multiple items
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 100,
  direction = 'up',
}: StaggerContainerProps) {
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <ScrollReveal key={index} delay={index * staggerDelay} direction={direction}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
