'use client';

import { useState, useId } from 'react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItem[];
  variant?: 'bordered' | 'gap';
  allowMultiple?: boolean;
  defaultOpen?: number | number[] | null;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function FaqAccordion({ items = [], variant = 'bordered', allowMultiple = false, defaultOpen = null }: FaqAccordionProps) {
  const toIndexSet = (v: number | number[] | null | undefined): number[] => {
    if (v === null || v === undefined) return [];
    return Array.isArray(v) ? v : [v];
  };

  const [open, setOpen] = useState<number[]>(() => toIndexSet(defaultOpen));
  const baseId = useId();

  const toggle = (i: number) => {
    setOpen((cur) => {
      const isOpen = cur.includes(i);
      if (allowMultiple) return isOpen ? cur.filter((x) => x !== i) : [...cur, i];
      return isOpen ? [] : [i];
    });
  };

  return (
    <div className={['ct-faq', `ct-faq--${variant}`].join(' ')}>
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        const qId = `${baseId}-q-${i}`;
        const pId = `${baseId}-p-${i}`;
        return (
          <div className="ct-faq__item" data-open={String(isOpen)} key={i}>
            <button
              type="button"
              id={qId}
              className="ct-faq__q"
              aria-expanded={isOpen}
              aria-controls={pId}
              onClick={() => toggle(i)}
            >
              <span className="ct-faq__q-text">{item.question}</span>
              <span className="ct-faq__icon"><Chevron /></span>
            </button>
            <div className="ct-faq__panel" role="region" id={pId} aria-labelledby={qId}>
              <div className="ct-faq__panel-inner">
                <div className="ct-faq__a">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
