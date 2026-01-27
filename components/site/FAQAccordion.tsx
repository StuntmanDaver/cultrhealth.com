'use client'

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border border-cultr-sage rounded-lg bg-cultr-mint overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-cultr-sage/30"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-display font-medium text-cultr-text pr-8">{item.question}</span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-cultr-forest" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cultr-textMuted" />
            )}
          </button>
          {openIndex === index && (
            <div className="p-6 pt-0 text-cultr-textMuted text-sm leading-relaxed border-t border-cultr-sage mt-2">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
