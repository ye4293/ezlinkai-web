'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { useSystemConfig } from '@/hooks/use-system-config';
import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle';
import LanguageToggle from '@/components/layout/language-toggle';

export function LandingNav() {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { systemName, docsAddress } = useSystemConfig();
  const L = t.landing.nav;

  const isAuthed = !!session;
  const ctaHref = isAuthed ? '/dashboard' : '/sign-in';
  const ctaLabel = isAuthed ? L.dashboard : L.startBuilding;
  const brand = systemName?.trim() || 'EZLINK';
  const brandInitial = brand.charAt(0).toUpperCase() || 'E';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-[58px] max-w-[1240px] items-center justify-between px-7">
        <Link href="/" className="flex items-center gap-[9px]">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[5px] bg-foreground font-mono text-[12px] font-bold text-background">
            {brandInitial}
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            {brand}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/model-plaza"
            className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {L.models}
          </Link>
          <a
            href="#"
            className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {L.pricing}
          </a>
          {docsAddress ? (
            <a
              href={docsAddress}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {L.docs}
            </a>
          ) : (
            <a
              href="#"
              className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {L.docs}
            </a>
          )}
          <a
            href="#"
            className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {L.changelog}
          </a>
          <a
            href="#"
            className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {L.enterprise}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {!isAuthed && (
            <Link
              href="/sign-in"
              className="hidden px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              {L.signIn}
            </Link>
          )}
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-[7px] bg-foreground px-[14px] py-2 text-[13.5px] font-medium text-background transition-transform hover:-translate-y-px hover:bg-foreground/90"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
