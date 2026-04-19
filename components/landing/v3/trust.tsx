'use client';

import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';

export function LandingTrust() {
  const { t } = useLocale();
  const Tr = t.landing.trust;

  const items = [Tr.compliance, Tr.availability, Tr.support, Tr.deployment];

  return (
    <section className="px-7 pb-24 pt-0 md:pb-[120px]">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div className="max-w-[580px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-dim">
              <span
                className="mr-2.5 inline-block h-[4px] w-[4px] translate-y-[-2px] rounded-full bg-[hsl(var(--accent-ezl))] shadow-[0_0_8px_hsl(var(--accent-ezl))]"
                aria-hidden
              />
              {Tr.eyebrow}
            </div>
            <h2 className="mt-4 text-[clamp(34px,4vw,54px)] font-medium leading-none tracking-[-0.03em]">
              {Tr.title}
              <em className="font-serif font-normal italic text-muted-foreground">
                {Tr.titleEm}
              </em>
            </h2>
            <p className="mt-3.5 max-w-[500px] text-[16px] text-muted-foreground">
              {Tr.sub}
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 border-b border-border-strong pb-0.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
          >
            {Tr.talkToSales} <span className="font-mono">→</span>
          </a>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-[14px] border border-border bg-bg-elev md:grid-cols-4">
          {items.map((it, i) => (
            <div
              key={i}
              className={`border-border p-7 ${
                i < items.length - 1 ? 'md:border-r' : ''
              } ${i < items.length / 2 ? 'border-b md:border-b-0' : ''}`}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
                {it.label}
              </div>
              <div className="mt-1.5 text-[17px] font-medium tracking-tight text-foreground">
                {it.value}
              </div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">
                {it.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
