'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  detectProvider,
  PROVIDER_LABEL,
  ProviderIcon,
  type Provider
} from './provider-icon';

interface ModelRow {
  id: string;
  provider: Provider;
  providerLabel: string;
  subtitle: string;
}

// Static fallback — used when anonymous or API fails
const STATIC_MODELS: ModelRow[] = [
  {
    id: 'claude-opus-4-7',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    subtitle: 'Anthropic · reasoning + agentic'
  },
  {
    id: 'gpt-5.4',
    provider: 'openai',
    providerLabel: 'OpenAI',
    subtitle: 'OpenAI · flagship multimodal'
  },
  {
    id: 'deepseek-v3.2',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    subtitle: 'DeepSeek · open reasoning'
  },
  {
    id: 'gemini-3.1-pro-preview',
    provider: 'google',
    providerLabel: 'Google',
    subtitle: 'Google · 2M context, vision'
  },
  {
    id: 'grok-4',
    provider: 'xai',
    providerLabel: 'xAI',
    subtitle: 'xAI · real-time web access'
  }
];

// Rough popularity ordering for real model IDs
const POPULARITY: (string | RegExp)[] = [
  /^claude-opus-4/,
  /^gpt-5/,
  /^claude-sonnet-4/,
  /^gemini-3/,
  /^deepseek-v3/,
  /^grok-4/,
  /^claude/,
  /^gpt-4/,
  /^gemini/,
  /^deepseek/,
  /^llama/,
  /^qwen/,
  /^mistral/,
  /^grok/
];

function rank(id: string): number {
  for (let i = 0; i < POPULARITY.length; i++) {
    const p = POPULARITY[i];
    if (p instanceof RegExp ? p.test(id) : id === p) return i;
  }
  return 999;
}

function transformModels(raw: unknown): ModelRow[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const rows: ModelRow[] = [];
  for (const item of raw) {
    let id: string | undefined;
    if (typeof item === 'string') id = item;
    else if (item && typeof item === 'object') {
      id = (item as { id?: string; name?: string }).id ?? (item as any).name;
    }
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const provider = detectProvider(id);
    if (!provider) continue;
    rows.push({
      id,
      provider,
      providerLabel: PROVIDER_LABEL[provider],
      subtitle: PROVIDER_LABEL[provider]
    });
  }
  rows.sort((a, b) => rank(a.id) - rank(b.id));
  return rows.slice(0, 5);
}

export function LandingModelsCompact() {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const M = t.landing.models;

  const [rows, setRows] = useState<ModelRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable boolean — `session` object identity changes on every re-render
  const isAuthed = !!session;

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthed) {
      setRows(STATIC_MODELS);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/channel/models', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        const list = transformModels(json?.data);
        if (!cancelled) {
          setRows(list.length > 0 ? list : STATIC_MODELS);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRows(STATIC_MODELS);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, status]);

  return (
    <section className="px-7 pb-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div className="max-w-[580px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-dim">
              <span
                className="mr-2.5 inline-block h-[4px] w-[4px] translate-y-[-2px] rounded-full bg-[hsl(var(--accent-ezl))] shadow-[0_0_8px_hsl(var(--accent-ezl))]"
                aria-hidden
              />
              {M.eyebrow}
            </div>
            <h2 className="mt-4 text-[clamp(34px,4vw,54px)] font-medium leading-none tracking-[-0.03em]">
              {M.title}
              <em className="font-serif font-normal italic text-muted-foreground">
                {M.titleEm}
              </em>
            </h2>
          </div>
          <a
            href="/model-plaza"
            className="inline-flex items-center gap-1.5 border-b border-border-strong pb-0.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
          >
            {M.viewAll} <span className="font-mono">→</span>
          </a>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border bg-bg-elev">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0"
                >
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-4 max-w-xs flex-1" />
                </div>
              ))
            : rows?.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-bg-hover md:grid-cols-[34px_1fr_60px] md:gap-[18px] md:px-5"
                >
                  <ProviderIcon provider={m.provider} size="md" />
                  <div className="text-[14px] font-medium text-foreground">
                    {m.id}
                    <small className="ml-2 font-normal text-text-dim">
                      {m.providerLabel}
                    </small>
                  </div>
                  <div
                    className="text-right font-mono text-text-dim"
                    aria-hidden
                  >
                    →
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
