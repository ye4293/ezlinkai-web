'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { useSystemConfig } from '@/hooks/use-system-config';
import { Playground } from './playground';

export function LandingHero() {
  const { t, lang } = useLocale();
  const { data: session } = useSession();
  const { docsAddress } = useSystemConfig();
  const H = t.landing.hero;
  const ctaHref = session ? '/dashboard' : '/sign-in';
  const isZh = lang === 'zh';

  return (
    <section className="relative overflow-hidden px-7 py-20 md:py-[80px]">
      {/* Decorative blurs */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-100px] -z-10 h-[700px] w-[1400px] -translate-x-1/2"
        aria-hidden
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_60%_50%_at_30%_30%,hsl(var(--accent-ezl)/0.09),transparent_60%),radial-gradient(ellipse_40%_40%_at_80%_60%,rgba(147,197,253,0.06),transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-[900px] text-center">
        <a
          href="#"
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-bg-elev px-1.5 py-1.5 pr-3.5 font-mono text-[11.5px] transition-colors hover:border-border-strong"
        >
          <span className="rounded-full bg-accent-ezl-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[hsl(var(--accent-ezl))]">
            {H.badgeTag}
          </span>
          <span className="text-muted-foreground">
            <strong className="font-medium text-foreground">
              {H.badgeText}
            </strong>
          </span>
          <span className="text-text-dim" aria-hidden>
            →
          </span>
        </a>

        <h1
          className={
            isZh
              ? 'text-[clamp(40px,6vw,84px)] font-medium leading-[1.1] tracking-[-0.02em]'
              : 'text-[clamp(56px,8.5vw,120px)] font-medium leading-[0.92] tracking-[-0.045em]'
          }
        >
          {H.titleLine1}
          <br />
          {isZh ? (
            <span className="font-medium text-muted-foreground">
              {H.titleLine2Em}
            </span>
          ) : (
            <em className="font-serif font-normal italic tracking-[-0.015em] text-muted-foreground">
              {H.titleLine2Em}
            </em>
          )}
        </h1>

        <p className="mx-auto mt-7 max-w-[560px] text-[18px] leading-[1.55] text-muted-foreground">
          {H.lede}
        </p>
      </div>

      <div className="mt-12">
        <Playground />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2.5">
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-[hsl(var(--accent-ezl))] px-[22px] py-[13px] text-[14.5px] font-semibold text-[#140800] shadow-[0_0_0_1px_hsl(var(--accent-ezl)),0_8px_30px_-8px_hsl(var(--accent-ezl)/0.5)] transition-transform hover:-translate-y-px hover:brightness-110"
        >
          {H.createAccount}
        </Link>
        {docsAddress ? (
          <a
            href={docsAddress}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-[7px] border border-border-strong px-[22px] py-[13px] text-[14.5px] font-medium text-foreground transition-colors hover:border-muted-foreground hover:bg-bg-hover"
          >
            {H.readDocs}
          </a>
        ) : (
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-[7px] border border-border-strong px-[22px] py-[13px] text-[14.5px] font-medium text-foreground transition-colors hover:border-muted-foreground hover:bg-bg-hover"
          >
            {H.readDocs}
          </a>
        )}
      </div>

      <p className="mt-4 text-center font-mono text-[11.5px] tracking-wider text-text-dim">
        {H.subtle}
      </p>
    </section>
  );
}
