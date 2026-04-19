'use client';

import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';

const PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'DeepSeek',
  'Meta',
  'xAI',
  'Mistral',
  'Qwen',
  'Cohere',
  'Perplexity',
  '01.AI',
  'Moonshot'
];

export function LandingMarquee() {
  const { t } = useLocale();
  return (
    <div className="relative overflow-hidden border-y border-border bg-bg-elev py-10">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[100px] bg-gradient-to-r from-bg-elev to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[100px] bg-gradient-to-l from-bg-elev to-transparent"
        aria-hidden
      />

      <div className="mb-5 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-text-dim">
        {t.landing.marquee.label}
      </div>

      <div className="flex w-max animate-marquee-slow gap-[60px]">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 gap-[60px]">
            {PROVIDERS.map((p) => (
              <span
                key={`${group}-${p}`}
                className="whitespace-nowrap font-serif text-[28px] italic tracking-tight text-text-dim"
              >
                {p}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
