import React from 'react';
import { cn } from '@/lib/utils';

export type Provider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'meta'
  | 'xai'
  | 'mistral'
  | 'qwen';

const LETTER: Record<Provider, string> = {
  anthropic: 'A',
  openai: 'O',
  google: 'G',
  deepseek: 'D',
  meta: 'M',
  xai: 'X',
  mistral: 'M',
  qwen: 'Q'
};

const COLORS: Record<Provider, { bg: string; fg: string }> = {
  anthropic: { bg: '#3d2817', fg: '#ffb38a' },
  openai: { bg: '#0d3c2e', fg: '#74e8c2' },
  google: { bg: '#1c2d4a', fg: '#8ab4f8' },
  deepseek: { bg: '#1a2c3d', fg: '#5eb8ff' },
  meta: { bg: '#1e3a5f', fg: '#8ab4f8' },
  xai: { bg: '#2a2a2a', fg: '#e5e5e5' },
  mistral: { bg: '#402817', fg: '#ffb88a' },
  qwen: { bg: '#2d1f3d', fg: '#c695ff' }
};

const SIZE_CLASS = {
  sm: 'h-6 w-6 rounded text-[10px]',
  md: 'h-7 w-7 rounded-md text-[11px]',
  lg: 'h-10 w-10 rounded-lg text-[13px]'
};

export function ProviderIcon({
  provider,
  size = 'md',
  className
}: {
  provider: Provider;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { bg, fg } = COLORS[provider];
  return (
    <div
      className={cn(
        'grid place-items-center font-mono font-bold',
        SIZE_CLASS[size],
        className
      )}
      style={{ background: bg, color: fg }}
      aria-hidden
    >
      {LETTER[provider]}
    </div>
  );
}

export function detectProvider(modelId: string): Provider | null {
  const m = modelId.toLowerCase();
  if (m.startsWith('claude')) return 'anthropic';
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3')) {
    return 'openai';
  }
  if (m.startsWith('gemini')) return 'google';
  if (m.startsWith('deepseek')) return 'deepseek';
  if (m.startsWith('llama')) return 'meta';
  if (m.startsWith('grok')) return 'xai';
  if (m.startsWith('mistral') || m.startsWith('mixtral')) return 'mistral';
  if (m.startsWith('qwen')) return 'qwen';
  return null;
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  deepseek: 'DeepSeek',
  meta: 'Meta',
  xai: 'xAI',
  mistral: 'Mistral',
  qwen: 'Qwen'
};
