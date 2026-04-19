'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { useSystemConfig } from '@/hooks/use-system-config';

export function LandingFinalCta() {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { docsAddress } = useSystemConfig();
  const F = t.landing.finalCta;
  const ctaHref = session ? '/dashboard' : '/sign-in';

  return (
    <section className="relative overflow-hidden border-t border-border px-7 py-40 text-center md:py-[180px]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2"
        aria-hidden
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_50%_50%_at_center,hsl(var(--accent-ezl)/0.12),transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-[1000px]">
        <h2 className="text-[clamp(52px,7vw,104px)] font-medium leading-[0.95] tracking-[-0.04em]">
          {F.titleLine1}
          <em className="font-serif font-normal italic text-muted-foreground">
            {F.titleEm}
          </em>
          <br />
          {F.titleLine2}
        </h2>
        <p className="mt-7 text-[18px] text-muted-foreground">{F.sub}</p>
        <div className="mt-11 flex flex-wrap justify-center gap-2.5">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-[7px] bg-[hsl(var(--accent-ezl))] px-[22px] py-[13px] text-[14.5px] font-semibold text-[#140800] shadow-[0_0_0_1px_hsl(var(--accent-ezl)),0_8px_30px_-8px_hsl(var(--accent-ezl)/0.5)] transition-transform hover:-translate-y-px hover:brightness-110"
          >
            {F.createAccount}
          </Link>
          <a
            href={docsAddress || '#'}
            target={docsAddress ? '_blank' : undefined}
            rel={docsAddress ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center rounded-[7px] border border-border-strong px-[22px] py-[13px] text-[14.5px] font-medium text-foreground transition-colors hover:border-muted-foreground hover:bg-bg-hover"
          >
            {F.readDocs}
          </a>
        </div>
      </div>
    </section>
  );
}
