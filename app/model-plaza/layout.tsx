'use client';

import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { useSystemConfig } from '@/hooks/use-system-config';
import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle';
import LanguageToggle from '@/components/layout/language-toggle';
import { UserNav } from '@/components/layout/user-nav';

export default function ModelPlazaLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  const { systemName, docsAddress } = useSystemConfig();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <span className="text-lg font-bold">{systemName}</span>
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                href="/"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.modelPlaza.backHome}
              </Link>
              <a
                href={docsAddress}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.nav.docs}
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
