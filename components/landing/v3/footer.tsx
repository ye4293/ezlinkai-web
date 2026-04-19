'use client';

import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { useSystemConfig } from '@/hooks/use-system-config';

export function LandingFooter() {
  const { t } = useLocale();
  const { systemName, docsAddress } = useSystemConfig();
  const F = t.landing.footer;
  const brand = systemName?.trim() || 'EZLINK';
  const brandInitial = brand.charAt(0).toUpperCase() || 'E';
  const year = new Date().getFullYear();

  const product: Array<[string, string]> = [
    [F.links.models, '/model-plaza'],
    [F.links.pricing, '#'],
    [F.links.dashboard, '/dashboard'],
    [F.links.changelog, '#']
  ];
  const developers: Array<[string, string]> = [
    [F.links.documentation, docsAddress || '#'],
    [F.links.apiReference, '#'],
    [F.links.sdks, '#'],
    [F.links.status, '#']
  ];
  const company: Array<[string, string]> = [
    [F.links.enterprise, '#'],
    [F.links.security, '#'],
    [F.links.blog, '#'],
    [F.links.careers, '#']
  ];
  const legal: Array<[string, string]> = [
    [F.links.terms, '#'],
    [F.links.privacy, '#'],
    [F.links.sla, '#'],
    [F.links.dpa, '#']
  ];

  return (
    <footer className="border-t border-border px-7 pb-12 pt-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-16 grid grid-cols-2 gap-10 md:grid-cols-[2.5fr_1fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-[9px]">
              <span className="grid h-[22px] w-[22px] place-items-center rounded-[5px] bg-foreground font-mono text-[12px] font-bold text-background">
                {brandInitial}
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                {brand}
              </span>
            </div>
            <p className="mt-4 max-w-[320px] text-[13px] leading-[1.6] text-muted-foreground">
              {F.aboutDesc}
            </p>
          </div>
          <FooterCol title={F.sections.product} links={product} />
          <FooterCol title={F.sections.developers} links={developers} />
          <FooterCol title={F.sections.company} links={company} />
          <FooterCol title={F.sections.legal} links={legal} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7 font-mono text-[11.5px] tracking-wide text-text-dim">
          <span>
            © {year} {brand}. {F.copyright}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-[6px] w-[6px] rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              aria-hidden
            />
            {F.status}
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links
}: {
  title: string;
  links: Array<[string, string]>;
}) {
  return (
    <div>
      <h5 className="mb-4 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-dim">
        {title}
      </h5>
      <ul className="flex flex-col gap-3">
        {links.map(([label, href]) => {
          const external = href.startsWith('http');
          return (
            <li key={label}>
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
