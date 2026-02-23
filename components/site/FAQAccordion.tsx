'use client'

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="glass-card rounded-2xl overflow-hidden transition-all duration-300">
          <button
            className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-white/40"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-display font-medium text-cultr-text pr-8">{item.question}</span>
            <ChevronDown className={`w-5 h-5 text-cultr-forest transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
          </button>
          {openIndex === index && (
            <div className="p-6 pt-0 text-cultr-textMuted text-sm leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
