'use client';

import React from 'react';
import { useLocale } from '@/components/providers/locale-provider';

type AppCard = {
  initials: string;
  tone: 'g' | 'b' | 'r' | 'p' | 'm' | 'o' | 's' | 'w';
  name: string;
  desc: string;
  model: string;
};

const APPS: AppCard[] = [
  {
    initials: 'Gv',
    tone: 'g',
    name: 'Groove.ai',
    desc: 'AI copilot for sales. Real-time call coaching.',
    model: 'Claude Opus 4.7'
  },
  {
    initials: 'Bf',
    tone: 'b',
    name: 'BaseFrame',
    desc: 'Vibe-coding platform for non-technical founders.',
    model: 'GPT-5.4'
  },
  {
    initials: 'Rd',
    tone: 'r',
    name: 'Redcap',
    desc: 'Document intelligence for medical research.',
    model: 'Gemini 3.1 Pro'
  },
  {
    initials: 'Pt',
    tone: 'p',
    name: 'Portal',
    desc: 'Internal AI assistants for finance orgs.',
    model: 'Claude Sonnet 4.6'
  },
  {
    initials: 'Ml',
    tone: 'm',
    name: 'Modulo',
    desc: 'Open-source agent framework. 24k stars.',
    model: 'DeepSeek V3.2'
  },
  {
    initials: 'On',
    tone: 'o',
    name: 'Onset',
    desc: 'AI voice agents for healthcare intake.',
    model: 'GPT-5.4 · Haiku'
  },
  {
    initials: 'Sv',
    tone: 's',
    name: 'Subverse',
    desc: 'Character chat for game studios. 2M DAU.',
    model: 'Llama 4'
  },
  {
    initials: 'Wr',
    tone: 'w',
    name: 'Weave',
    desc: 'Knowledge graphs from your docs.',
    model: 'Gemini 3.1 Pro'
  }
];

const TONE: Record<AppCard['tone'], { bg: string; fg: string }> = {
  g: { bg: 'linear-gradient(135deg, #2d1f3d, #1a2c3d)', fg: '#c695ff' },
  b: { bg: 'linear-gradient(135deg, #0d3c2e, #1a2c3d)', fg: '#74e8c2' },
  r: { bg: 'linear-gradient(135deg, #3d2817, #402817)', fg: '#ffb38a' },
  p: { bg: 'linear-gradient(135deg, #2a2a2a, #1d1d22)', fg: '#e5e5e5' },
  m: { bg: 'linear-gradient(135deg, #1e3a5f, #2d1f3d)', fg: '#8ab4f8' },
  o: { bg: 'linear-gradient(135deg, #402817, #3d2817)', fg: '#ffb88a' },
  s: { bg: 'linear-gradient(135deg, #1a2c3d, #0d3c2e)', fg: '#5eb8ff' },
  w: { bg: 'linear-gradient(135deg, #3d1a2e, #2d1f3d)', fg: '#ff95c8' }
};

export function LandingApps() {
  const { t } = useLocale();
  const A = t.landing.apps;

  return (
    <section className="px-7 py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div className="max-w-[580px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-dim">
              <span
                className="mr-2.5 inline-block h-[4px] w-[4px] translate-y-[-2px] rounded-full bg-[hsl(var(--accent-ezl))] shadow-[0_0_8px_hsl(var(--accent-ezl))]"
                aria-hidden
              />
              {A.eyebrow}
            </div>
            <h2 className="mt-4 text-[clamp(34px,4vw,54px)] font-medium leading-none tracking-[-0.03em]">
              {A.title}
              <em className="font-serif font-normal italic text-muted-foreground">
                {A.titleEm}
              </em>
            </h2>
            <p className="mt-3.5 max-w-[500px] text-[16px] text-muted-foreground">
              {A.sub}
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 border-b border-border-strong pb-0.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
          >
            {A.seeAll} <span className="font-mono">→</span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-border bg-border md:grid-cols-4">
          {APPS.map((a) => {
            const tone = TONE[a.tone];
            return (
              <div
                key={a.name}
                className="flex cursor-pointer flex-col gap-3.5 bg-bg-elev p-6 transition-colors hover:bg-bg-hover"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-[9px] font-mono text-[15px] font-semibold"
                  style={{ background: tone.bg, color: tone.fg }}
                  aria-hidden
                >
                  {a.initials}
                </div>
                <div className="text-[14.5px] font-medium tracking-tight text-foreground">
                  {a.name}
                </div>
                <div className="text-[12.5px] leading-[1.5] text-text-dim">
                  {a.desc}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                  <span>{A.primary}</span>
                  <span className="text-foreground">{a.model}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
