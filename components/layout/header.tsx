'use client';

import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle';
import LanguageToggle from '@/components/layout/language-toggle';
import { cn } from '@/lib/utils';
import { MobileSidebar } from './mobile-sidebar';
import { UserNav } from './user-nav';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { usePathname } from 'next/navigation';
import { Home, Store, FileText } from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';

export default function Header() {
  const { t } = useLocale();
  const pathname = usePathname();
  const { docsAddress } = useSystemConfig();

  const navLinks = [
    { key: 'home' as const, href: '/', icon: Home },
    {
      key: 'marketplace' as const,
      href: '/model-plaza',
      icon: Store
    },
    {
      key: 'docs' as const,
      href: docsAddress,
      icon: FileText,
      external: true
    }
  ];

  return (
    <header className="sticky inset-x-0 top-0 z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-14 items-center justify-between px-4">
        {/* Left: mobile menu + nav links */}
        <div className="flex items-center gap-4">
          <div className={cn('block lg:!hidden')}>
            <MobileSidebar />
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = !link.external && pathname === link.href;
              const Icon = link.icon;
              const label = t.nav[link.key];

              const linkClass = cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              );

              if (link.external) {
                return (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                );
              }

              return (
                <Link key={link.key} href={link.href} className={linkClass}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: language + user + theme */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <UserNav />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
