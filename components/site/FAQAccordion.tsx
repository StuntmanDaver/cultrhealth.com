'use client'

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Stable per-mount id prefix so panel/button aria-* attributes are unique
  // when multiple accordions render on the same page.
  const idPrefix = useId();

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${idPrefix}-faq-panel-${index}`;
        const buttonId = `${idPrefix}-faq-button-${index}`;
        return (
          <div key={index} className="glass-card rounded-2xl overflow-hidden">
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-white/40"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="font-display font-medium text-cultr-text pr-8">{item.question}</span>
              <ChevronDown className={`w-5 h-5 text-cultr-forest transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* Always render the answer so it ships in static HTML — Google's
             * FAQPage rich-result eligibility requires answer text to be
             * present in the source. Collapsed state hides it via max-height
             * + aria-hidden, not conditional rendering. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <div className="p-6 pt-0 text-cultr-textMuted text-sm leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
