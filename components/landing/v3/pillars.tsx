'use client';

import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';

export function LandingPillars() {
  const { t } = useLocale();
  const P = t.landing.pillars;

  return (
    <section className="px-7 py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-12 max-w-[580px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-dim">
            <span
              className="mr-2.5 inline-block h-[4px] w-[4px] translate-y-[-2px] rounded-full bg-[hsl(var(--accent-ezl))] shadow-[0_0_8px_hsl(var(--accent-ezl))]"
              aria-hidden
            />
            {P.eyebrow}
          </div>
          <h2 className="mt-4 text-[clamp(34px,4vw,54px)] font-medium leading-none tracking-[-0.03em]">
            {P.title}
            <em className="font-serif font-normal italic text-muted-foreground">
              {P.titleEm}
            </em>
          </h2>
          <p className="mt-3.5 max-w-[500px] text-[16px] text-muted-foreground">
            {P.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 border-t border-border md:grid-cols-3">
          <Pillar
            num={P.integration.num}
            title={P.integration.title}
            titleEm={P.integration.titleEm}
            desc={P.integration.desc}
            first
          >
            <IntegrationDiagram />
          </Pillar>
          <Pillar
            num={P.reliability.num}
            title={P.reliability.title}
            titleEm={P.reliability.titleEm}
            desc={P.reliability.desc}
          >
            <ReliabilityDiagram />
          </Pillar>
          <Pillar
            num={P.observability.num}
            title={P.observability.title}
            titleEm={P.observability.titleEm}
            desc={P.observability.desc}
            last
          >
            <ObservabilityDiagram />
          </Pillar>
        </div>
      </div>
    </section>
  );
}

function Pillar({
  num,
  title,
  titleEm,
  desc,
  first,
  last,
  children
}: {
  num: string;
  title: string;
  titleEm: string;
  desc: string;
  first?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-b border-border pb-12 pt-12 md:border-b-0 md:border-r md:last:border-r-0 ${
        first ? 'md:pr-9' : last ? 'md:pl-9' : 'md:px-9'
      }`}
    >
      <div className="mb-7 font-mono text-[11px] uppercase tracking-[0.15em] text-text-dim">
        {num}
      </div>
      <h3 className="mb-3.5 text-[22px] font-medium leading-[1.2] tracking-[-0.015em]">
        {title}
        <em className="font-serif font-normal italic text-muted-foreground">
          {titleEm}
        </em>
      </h3>
      <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
        {desc}
      </p>
      <div className="mt-8 flex h-[130px] items-center justify-center rounded-[10px] border border-border bg-bg-elev p-4">
        {children}
      </div>
    </div>
  );
}

function IntegrationDiagram() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 100"
      fill="none"
      aria-hidden
    >
      <text
        x="20"
        y="24"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="hsl(var(--text-dim))"
      >
        model:
      </text>
      <text
        x="20"
        y="44"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="hsl(var(--foreground))"
      >
        &quot;claude-opus-4-7&quot;
      </text>
      <line
        x1="20"
        y1="52"
        x2="240"
        y2="52"
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      <text
        x="20"
        y="72"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="hsl(var(--accent-ezl))"
      >
        &quot;gpt-5.4&quot;
      </text>
      <text
        x="20"
        y="92"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="hsl(var(--accent-ezl))"
      >
        &quot;gemini-3.1-pro-preview&quot;
      </text>
    </svg>
  );
}

function ReliabilityDiagram() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 100"
      fill="none"
      aria-hidden
    >
      <circle cx="30" cy="50" r="6" fill="hsl(var(--accent-ezl))" />
      <line
        x1="36"
        y1="50"
        x2="100"
        y2="50"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <rect
        x="100"
        y="30"
        width="60"
        height="40"
        rx="6"
        fill="none"
        stroke="hsl(var(--border-strong))"
      />
      <text
        x="130"
        y="54"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="hsl(var(--muted-foreground))"
      >
        GATEWAY
      </text>
      <line
        x1="160"
        y1="38"
        x2="220"
        y2="22"
        stroke="hsl(var(--text-dim))"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <line
        x1="160"
        y1="50"
        x2="220"
        y2="50"
        stroke="hsl(var(--accent-ezl))"
        strokeWidth="1"
      />
      <line
        x1="160"
        y1="62"
        x2="220"
        y2="78"
        stroke="hsl(var(--text-dim))"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle cx="225" cy="22" r="4" fill="hsl(var(--text-faint))" />
      <circle cx="225" cy="50" r="4" fill="hsl(var(--accent-ezl))" />
      <circle cx="225" cy="78" r="4" fill="hsl(var(--text-faint))" />
    </svg>
  );
}

function ObservabilityDiagram() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 100"
      fill="none"
      aria-hidden
    >
      <polyline
        points="10,80 40,55 70,62 100,35 130,45 160,20 190,30 220,18 250,25"
        stroke="hsl(var(--accent-ezl))"
        strokeWidth="1.5"
        fill="none"
      />
      <polyline
        points="10,80 40,55 70,62 100,35 130,45 160,20 190,30 220,18 250,25 250,92 10,92"
        fill="hsl(var(--accent-ezl) / 0.08)"
        stroke="none"
      />
      <line
        x1="10"
        y1="92"
        x2="250"
        y2="92"
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
    </svg>
  );
}
