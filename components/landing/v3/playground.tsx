'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useSystemConfig } from '@/hooks/use-system-config';

// --- Types ---
const SDKS = ['openai', 'claude', 'gemini'] as const;
type Sdk = (typeof SDKS)[number];

const LANGS = ['curl', 'python', 'javascript'] as const;
type Lang = (typeof LANGS)[number];

const RUNTIME: Record<Lang, string> = {
  curl: 'bash',
  python: 'python',
  javascript: 'node'
};

// --- Sample content (prompts + responses) ---
const CONTENT: Record<
  Sdk,
  {
    label: string;
    model: string;
    endpoint: string;
    tokens: number;
    latency: string;
    cost: string;
    prompt: string;
    response: string;
  }
> = {
  openai: {
    label: 'OpenAI',
    model: 'gpt-5.4',
    endpoint: 'v1/chat/completions',
    tokens: 247,
    latency: '842ms',
    cost: '$0.0062',
    prompt: 'Explain transformers in one paragraph.',
    response:
      'Transformers are a neural-network architecture introduced in 2017 that process sequences in parallel by letting every token attend to every other token through a mechanism called self-attention. Unlike recurrent networks, they have no built-in notion of position, so they rely on positional encodings to preserve order. This design scales remarkably well with data and compute, which is why it now underpins almost every frontier LLM — GPT, Claude, Gemini, Llama — as well as leading models in vision, audio and multimodal domains.'
  },
  claude: {
    label: 'Claude',
    model: 'claude-opus-4-7',
    endpoint: 'v1/messages',
    tokens: 189,
    latency: '612ms',
    cost: '$0.0047',
    prompt: 'Write a Python function that checks if a number is prime.',
    response:
      "Here's a clean primality check that runs in O(sqrt n) and handles edge cases:\n\n```python\ndef is_prime(n: int) -> bool:\n    if n < 2:\n        return False\n    if n < 4:\n        return True         # 2 and 3\n    if n % 2 == 0 or n % 3 == 0:\n        return False\n    i = 5\n    while i * i <= n:\n        if n % i == 0 or n % (i + 2) == 0:\n            return False\n        i += 6\n    return True\n```\n\nThe 6k ± 1 trick skips about two-thirds of candidates because every prime greater than 3 is of that form."
  },
  gemini: {
    label: 'Gemini',
    model: 'gemini-3.1-pro-preview',
    endpoint: 'v1beta/models/gemini-3.1-pro-preview:generateContent',
    tokens: 203,
    latency: '721ms',
    cost: '$0.0051',
    prompt: 'Summarize the French Revolution in three sentences.',
    response:
      "The French Revolution (1789–1799) began as a financial and social crisis that toppled the absolute monarchy after centuries of aristocratic privilege, driven by the bourgeoisie, urban workers, and radical clubs inspired by Enlightenment ideas. It passed through escalating phases — constitutional monarchy, republic, the Reign of Terror under Robespierre, and then the moderate Directory — producing landmark documents like the Declaration of the Rights of Man and deeply restructuring law, land, and religion. It collapsed into Napoleon Bonaparte's coup of 18 Brumaire, but its ideals of liberty, equality, and popular sovereignty reshaped European politics and inspired revolutions for two centuries afterward."
  }
};

// --- Code snippet builders ---
function buildCode(sdk: Sdk, lang: Lang, base: string): string {
  const d = CONTENT[sdk];
  if (sdk === 'openai') {
    if (lang === 'curl') {
      return `curl ${base}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $EZLINK_API_KEY" \\
  -d '{
    "model": "${d.model}",
    "messages": [
      { "role": "user", "content": "${d.prompt}" }
    ]
  }'`;
    }
    if (lang === 'python') {
      return `# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["EZLINK_API_KEY"],
    base_url="${base}/v1",
)

response = client.chat.completions.create(
    model="${d.model}",
    messages=[{
        "role": "user",
        "content": "${d.prompt}"
    }],
)
print(response.choices[0].message.content)`;
    }
    return `// npm install openai
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.EZLINK_API_KEY,
  baseURL: "${base}/v1",
});

const res = await client.chat.completions.create({
  model: "${d.model}",
  messages: [{
    role: "user",
    content: "${d.prompt}"
  }],
});

console.log(res.choices[0].message.content);`;
  }
  if (sdk === 'claude') {
    if (lang === 'curl') {
      return `curl ${base}/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $EZLINK_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${d.model}",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "${d.prompt}" }
    ]
  }'`;
    }
    if (lang === 'python') {
      return `# pip install anthropic
import os
from anthropic import Anthropic

client = Anthropic(
    api_key=os.environ["EZLINK_API_KEY"],
    base_url="${base}",
)

msg = client.messages.create(
    model="${d.model}",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "${d.prompt}"
    }],
)
print(msg.content[0].text)`;
    }
    return `// npm install @anthropic-ai/sdk
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.EZLINK_API_KEY,
  baseURL: "${base}",
});

const msg = await client.messages.create({
  model: "${d.model}",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: "${d.prompt}"
  }],
});

console.log(msg.content[0].text);`;
  }
  // gemini
  if (lang === 'curl') {
    return `curl "${base}/v1beta/models/${d.model}:generateContent" \\
  -H "Content-Type: application/json" \\
  -H "x-goog-api-key: $EZLINK_API_KEY" \\
  -d '{
    "contents": [
      { "parts": [{ "text": "${d.prompt}" }] }
    ]
  }'`;
  }
  if (lang === 'python') {
    return `# pip install google-genai
import os
from google import genai

client = genai.Client(
    api_key=os.environ["EZLINK_API_KEY"],
    http_options={"base_url": "${base}"},
)

response = client.models.generate_content(
    model="${d.model}",
    contents="${d.prompt}",
)
print(response.text)`;
  }
  return `// npm install @google/genai
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.EZLINK_API_KEY,
  httpOptions: { baseUrl: "${base}" },
});

const response = await client.models.generateContent({
  model: "${d.model}",
  contents: "${d.prompt}",
});

console.log(response.text);`;
}

// --- Syntax highlighter (regex based, SSR-safe) ---
const PATTERNS: Record<Lang, Array<{ re: RegExp; cls: string }>> = {
  curl: [
    { re: /(#.*)/g, cls: 'text-text-dim' },
    { re: /"((?:[^"\\]|\\.)*)"/g, cls: 'text-emerald-400' },
    { re: /(\bcurl\b)/g, cls: 'text-purple-300' },
    { re: /(-H|-d)/g, cls: 'text-sky-300' },
    { re: /(\$[A-Z_]+)/g, cls: 'text-[hsl(var(--accent-ezl))]' }
  ],
  python: [
    { re: /(#.*)/g, cls: 'text-text-dim' },
    { re: /"((?:[^"\\]|\\.)*)"/g, cls: 'text-emerald-400' },
    {
      re: /\b(import|from|as|def|return|print|await|async|in|for|while|if|else|None|True|False|class|try|except|raise|with)\b/g,
      cls: 'text-purple-300'
    },
    {
      re: /\b(OpenAI|Anthropic|client|response|genai|Client|os|environ)\b/g,
      cls: 'text-amber-300'
    },
    { re: /\b(\d+)\b/g, cls: 'text-[hsl(var(--accent-ezl))]' }
  ],
  javascript: [
    { re: /(\/\/.*)/g, cls: 'text-text-dim' },
    { re: /"((?:[^"\\]|\\.)*)"/g, cls: 'text-emerald-400' },
    {
      re: /\b(import|from|const|let|var|new|await|async|return|if|else|for|while|in|of)\b/g,
      cls: 'text-purple-300'
    },
    {
      re: /\b(OpenAI|Anthropic|GoogleGenAI|client|console|process)\b/g,
      cls: 'text-amber-300'
    },
    { re: /\b(\d+)\b/g, cls: 'text-[hsl(var(--accent-ezl))]' }
  ]
};

function highlightLine(text: string, lang: Lang): React.ReactNode[] {
  // Multi-pass: find all matches with priority (comments first, then strings, then keywords)
  type Segment = { start: number; end: number; cls: string };
  const segments: Segment[] = [];
  const patterns = PATTERNS[lang];
  for (const { re, cls } of patterns) {
    const rex = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = rex.exec(text)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      // skip if overlaps existing
      if (segments.some((seg) => s < seg.end && e > seg.start)) continue;
      segments.push({ start: s, end: e, cls });
    }
  }
  segments.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  segments.forEach((seg, i) => {
    if (seg.start > cursor) {
      parts.push(
        <span key={`p${i}`} className="text-foreground">
          {text.slice(cursor, seg.start)}
        </span>
      );
    }
    parts.push(
      <span key={`s${i}`} className={seg.cls}>
        {text.slice(seg.start, seg.end)}
      </span>
    );
    cursor = seg.end;
  });
  if (cursor < text.length) {
    parts.push(
      <span key="tail" className="text-foreground">
        {text.slice(cursor)}
      </span>
    );
  }
  return parts;
}

function HighlightedCode({ code, lang }: { code: string; lang: Lang }) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {highlightLine(line, lang)}
          {i < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </>
  );
}

// --- Main component ---
export function Playground() {
  const { t } = useLocale();
  const { serverAddress } = useSystemConfig();
  const P = t.landing.playground;

  const base = serverAddress || 'https://api.ezlinkai.com';

  const [sdk, setSdk] = useState<Sdk>('openai');
  const [lang, setLang] = useState<Lang>('curl');
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamedTokens, setStreamedTokens] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);

  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const code = useMemo(() => buildCode(sdk, lang, base), [sdk, lang, base]);
  const current = CONTENT[sdk];
  const fileName = P.file[lang];

  // Outside click for dropdown
  useEffect(() => {
    if (!langOpen) return;
    function onClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [langOpen]);

  // Stream the response
  const runStream = useCallback(async () => {
    cancelRef.current.cancelled = true;
    await new Promise((r) => setTimeout(r, 30));
    const localCancel = { cancelled: false };
    cancelRef.current = localCancel;

    setStreaming(true);
    setDone(false);
    setStreamedText('');
    setStreamedTokens(0);

    const text = CONTENT[sdk].response;
    let shown = '';
    const charsPerToken = 4;
    for (let i = 0; i < text.length; i++) {
      if (localCancel.cancelled) return;
      shown += text[i];
      setStreamedText(shown);
      if (i % charsPerToken === 0) {
        setStreamedTokens(Math.floor(i / charsPerToken));
      }
      const ch = text[i];
      const delay =
        ch === '\n' ? 14 : ch === ' ' ? 2 : 5 + Math.floor(Math.random() * 10);
      await new Promise((r) => setTimeout(r, delay));
    }
    if (localCancel.cancelled) return;
    setStreamedTokens(CONTENT[sdk].tokens);
    setStreaming(false);
    setDone(true);
  }, [sdk]);

  // Kick off on first mount + on SDK change
  useEffect(() => {
    runStream();
    return () => {
      cancelRef.current.cancelled = true;
    };
  }, [runStream]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard API may fail silently in insecure contexts */
    }
  };

  const displayTokens = streaming ? streamedTokens : done ? current.tokens : 0;

  return (
    <div className="relative mx-auto max-w-[1080px] overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-card px-3.5 py-3">
        <div
          role="tablist"
          aria-label="SDK provider"
          className="flex items-center gap-0.5"
        >
          {SDKS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={sdk === s}
              onClick={() => setSdk(s)}
              className={cn(
                'rounded-lg px-[18px] py-[9px] text-[14px] font-medium tracking-tight transition-colors',
                sdk === s
                  ? 'bg-bg-card text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border-strong))]'
                  : 'text-muted-foreground hover:bg-bg-hover hover:text-foreground'
              )}
            >
              {CONTENT[s].label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            type="button"
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            onClick={() => setLangOpen((v) => !v)}
            className="flex min-w-[96px] items-center justify-between gap-2 rounded-[7px] border border-border bg-bg-card px-3 py-[7px] font-mono text-[12.5px] text-foreground transition-colors hover:border-border-strong hover:bg-bg-hover"
          >
            <span>{lang}</span>
            <span
              className={cn(
                'text-[10px] text-text-dim transition-transform',
                langOpen && 'rotate-180'
              )}
              aria-hidden
            >
              ▾
            </span>
          </button>
          {langOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[160px] rounded-lg border border-border-strong bg-bg-card p-1.5 shadow-xl"
            >
              {LANGS.map((l) => (
                <button
                  key={l}
                  role="option"
                  aria-selected={lang === l}
                  onClick={() => {
                    setLang(l);
                    setLangOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left font-mono text-[12.5px] transition-colors hover:bg-bg-hover',
                    lang === l ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block w-3.5',
                      lang === l && 'text-[hsl(var(--accent-ezl))]'
                    )}
                    aria-hidden
                  >
                    {lang === l ? '✓' : ''}
                  </span>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Replay demo"
          onClick={runStream}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-elev px-[11px] py-1.5 font-mono text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          <span aria-hidden>↻</span> {P.replay}
        </button>

        <div
          className={cn(
            'flex items-center gap-[7px] font-mono text-[11.5px]',
            streaming
              ? 'text-[hsl(var(--accent-ezl))]'
              : 'text-muted-foreground'
          )}
          aria-live="polite"
        >
          <span
            className={cn(
              'h-[6px] w-[6px] rounded-full',
              streaming
                ? 'animate-statpulse bg-[hsl(var(--accent-ezl))] shadow-[0_0_8px_hsl(var(--accent-ezl))]'
                : 'animate-statpulse bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
            )}
          />
          {streaming ? P.status.streaming : P.status.ready}
        </div>
      </div>

      {/* Body split */}
      <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-2">
        {/* Left: code */}
        <div className="flex flex-col border-r border-border bg-bg-elev">
          <div className="flex items-center justify-between border-b border-border px-[18px] py-3 font-mono text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-[13px] w-[11px] opacity-40"
                style={{
                  background: 'currentColor',
                  clipPath: 'polygon(0 0, 70% 0, 100% 30%, 100% 100%, 0 100%)'
                }}
                aria-hidden
              />
              {fileName}
            </span>
            <button
              type="button"
              onClick={copy}
              className="rounded-md px-2 py-0.5 text-[11.5px] transition-colors hover:bg-bg-hover hover:text-foreground"
            >
              {copied ? P.copied : P.copy}
            </button>
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre p-5 font-mono text-[13px] leading-[1.75] text-foreground">
            <code>
              <HighlightedCode code={code} lang={lang} />
            </code>
          </pre>
        </div>

        {/* Right: terminal */}
        <div className="flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <div className="flex gap-[5px]" aria-hidden>
              <span className="h-[9px] w-[9px] rounded-full bg-border-strong" />
              <span className="h-[9px] w-[9px] rounded-full bg-border-strong" />
              <span className="h-[9px] w-[9px] rounded-full bg-border-strong" />
            </div>
            <span className="font-mono normal-case tracking-normal">
              ~/ezlink $ {RUNTIME[lang]} {fileName}
            </span>
            <span />
          </div>
          <div className="flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-[1.7] text-foreground">
            <TerminalBody
              sdk={sdk}
              streamedText={streamedText}
              streaming={streaming}
              done={done}
              promptLabel={P.promptLabel}
              doneLabel={P.doneLabel}
              fileName={fileName}
              runtime={RUNTIME[lang]}
              tokens={current.tokens}
              latency={current.latency}
              cost={current.cost}
            />
          </div>
        </div>
      </div>

      {/* Footer metrics */}
      <div className="flex flex-wrap gap-7 border-t border-border bg-bg-card px-5 py-3 font-mono text-[11.5px] text-muted-foreground">
        <Metric label={P.metrics.provider} value={sdk} />
        <Metric label={P.metrics.model} value={current.model} />
        <Metric label={P.metrics.tokens} value={String(displayTokens)} />
        <Metric label={P.metrics.latency} value={current.latency} />
        <Metric label={P.metrics.cost} value={current.cost} />
        <span className="ml-auto text-text-dim">{P.metrics.nativeNote}</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      {label}{' '}
      <strong className="font-medium tabular-nums text-foreground">
        {value}
      </strong>
    </span>
  );
}

function TerminalBody({
  sdk,
  streamedText,
  streaming,
  done,
  promptLabel,
  doneLabel,
  fileName,
  runtime,
  tokens,
  latency,
  cost
}: {
  sdk: Sdk;
  streamedText: string;
  streaming: boolean;
  done: boolean;
  promptLabel: string;
  doneLabel: string;
  fileName: string;
  runtime: string;
  tokens: number;
  latency: string;
  cost: string;
}) {
  const d = CONTENT[sdk];
  return (
    <div className="space-y-1.5">
      <div>
        <span className="mr-2 text-emerald-400">$</span>
        {runtime} {fileName}
      </div>
      <div className="text-[12px] text-text-dim">
        <strong className="font-normal text-muted-foreground">→ POST</strong>{' '}
        api/{d.endpoint}{' '}
        <strong className="font-normal text-muted-foreground">
          [{d.model}]
        </strong>
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[hsl(var(--accent-ezl))]">
        {promptLabel}
      </div>
      <div className="text-muted-foreground">{d.prompt}</div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[hsl(var(--accent-ezl))]">
        ← {d.model}
      </div>
      <div className="whitespace-pre-wrap break-words text-foreground">
        <FormattedResponse text={streamedText} />
        {streaming && (
          <span className="ml-0.5 inline-block h-[14px] w-[7px] -translate-y-[2px] animate-blink bg-[hsl(var(--accent-ezl))] align-middle" />
        )}
      </div>
      {done && (
        <div className="mt-3 border-t border-dashed border-border pt-3 text-[12px] text-emerald-500">
          {doneLabel} <span className="text-text-dim">·</span> {tokens} tokens{' '}
          <span className="text-text-dim">·</span> {latency}{' '}
          <span className="text-text-dim">·</span> {cost}
        </div>
      )}
    </div>
  );
}

function FormattedResponse({ text }: { text: string }) {
  // Render fenced code blocks and paragraphs
  const chunks = text.split(/```[\w]*\n?/);
  return (
    <>
      {chunks.map((chunk, i) => {
        if (i % 2 === 1) {
          return (
            <pre
              key={i}
              className="my-2 overflow-x-auto rounded-lg border border-border bg-bg-card p-3 font-mono text-[12.5px] leading-[1.6]"
            >
              {chunk.replace(/\n$/, '')}
            </pre>
          );
        }
        const paras = chunk.split('\n\n').filter(Boolean);
        if (paras.length === 0) return null;
        return (
          <React.Fragment key={i}>
            {paras.map((p, j) => (
              <p key={j} className="mb-2 last:mb-0">
                {p}
              </p>
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
}
