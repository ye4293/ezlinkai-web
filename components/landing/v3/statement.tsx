'use client';

import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';

export function LandingStatement() {
  const { t } = useLocale();
  const S = t.landing.statement;
  return (
    <section className="px-7 py-40 text-center md:py-[160px]">
      <div className="mx-auto max-w-[1000px]">
        <h2 className="text-[clamp(44px,6vw,88px)] font-normal leading-none tracking-[-0.035em]">
          <strong className="font-medium text-foreground">
            {S.line1Strong}
          </strong>{' '}
          <em className="font-serif font-normal italic text-muted-foreground">
            {S.line1Em}
          </em>
          <br />
          <em className="font-serif font-normal italic text-muted-foreground">
            {S.line2Em}
          </em>
        </h2>
        <p className="mx-auto mt-10 max-w-[560px] text-[17px] text-muted-foreground">
          {S.sub}
        </p>
      </div>
    </section>
  );
}
