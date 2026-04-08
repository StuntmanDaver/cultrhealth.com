'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TypeformStepProps {
  stepNumber?: number;
  title: string | ReactNode;
  description?: string | ReactNode;
  children: ReactNode;
  onNext?: () => void;
  canAdvance?: boolean;
  nextButtonText?: string;
  className?: string;
}

export function TypeformStep({
  stepNumber,
  title,
  description,
  children,
  onNext,
  canAdvance = true,
  nextButtonText = 'OK',
  className
}: TypeformStepProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canAdvance && onNext) {
        // Prevent enter from triggering if user is in a textarea
        if (document.activeElement?.tagName === 'TEXTAREA') return;
        
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAdvance, onNext]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("w-full max-w-2xl mx-auto py-12 px-6 flex flex-col justify-center min-h-[60vh]", className)}
    >
      <div className="mb-8">
        {stepNumber !== undefined && (
          <div className="flex items-center mb-4 text-brand-primary text-sm font-bold">
            <span className="bg-brand-primary w-6 h-6 flex items-center justify-center rounded text-brand-cream mr-3">
              {stepNumber}
            </span>
            <span className="text-xl text-brand-primary/40 font-light">→</span>
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-primary leading-tight">
          {title}
        </h2>
        {description && (
          <div className="mt-4 text-lg text-brand-primary/70">
            {description}
          </div>
        )}
      </div>

      <div className="mb-8 w-full max-w-xl">
        {children}
      </div>

      {onNext && (
        <div className="flex items-center gap-4 mt-auto pt-4">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className={cn(
              "px-8 py-3 rounded-full font-bold text-lg transition-all duration-200 shadow-sm flex items-center gap-2",
              canAdvance 
                ? "bg-brand-primary text-white hover:bg-forest-light hover:shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0" 
                : "bg-brand-primary/10 text-brand-primary/40 cursor-not-allowed"
            )}
          >
            {nextButtonText}
            {canAdvance && (
              <span className="text-sm font-normal opacity-60 ml-2 hidden sm:inline-block">Press Enter ↵</span>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

interface TypeformRadioProps {
  label: string | ReactNode;
  selected: boolean;
  onClick: () => void;
  letter?: string;
  className?: string;
}

export function TypeformRadio({ label, selected, onClick, letter, className }: TypeformRadioProps) {
  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-center p-4 mb-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent",
        selected 
          ? "border-brand-primary bg-brand-primary/10" 
          : "border-transparent bg-white hover:bg-brand-primary/5",
        className
      )}
    >
      {letter && (
        <div className={cn(
          "w-7 h-7 flex items-center justify-center rounded text-sm font-bold mr-4 transition-colors shrink-0",
          selected 
            ? "bg-brand-primary text-white" 
            : "bg-white border border-brand-primary/20 text-brand-primary group-hover:border-brand-primary/40"
        )}>
          {letter}
        </div>
      )}
      <span className={cn(
        "text-lg leading-relaxed",
        selected ? "text-brand-primary font-medium" : "text-brand-primary/80"
      )}>
        {label}
      </span>
    </div>
  );
}

interface TypeformInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TypeformInput({ label, error, className, ...props }: TypeformInputProps) {
  return (
    <div className="mb-6 w-full">
      {label && <label className="block text-brand-primary font-medium mb-2">{label}</label>}
      <input
        className={cn(
          "w-full text-xl p-0 py-2 bg-transparent border-0 border-b-2 border-brand-primary/20 focus:ring-0 focus:border-brand-primary transition-colors text-brand-primary placeholder:text-brand-primary/30",
          error && "border-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

interface TypeformTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TypeformTextarea({ label, error, className, ...props }: TypeformTextareaProps) {
  return (
    <div className="mb-6 w-full">
      {label && <label className="block text-brand-primary font-medium mb-2">{label}</label>}
      <textarea
        className={cn(
          "w-full text-lg p-4 bg-brand-primary/5 rounded-lg border-2 border-transparent focus:ring-0 focus:border-brand-primary transition-colors text-brand-primary placeholder:text-brand-primary/30 min-h-[120px] resize-y",
          error && "border-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
