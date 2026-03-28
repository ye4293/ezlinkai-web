'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// --- Types ---
const providers = ['OpenAI', 'Claude', 'Gemini'] as const;
type Provider = (typeof providers)[number];

const languages = ['curl', 'python', 'javascript'] as const;
type Lang = (typeof languages)[number];

// --- Code Snippets: [provider][lang] ---
function getCodeSnippets(
  serverAddress: string
): Record<Provider, Record<Lang, string>> {
  return {
    OpenAI: {
      curl: `curl ${serverAddress}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $EZLINK_API_KEY" \\
  -d '{
    "model": "gpt-5.4",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`,
      python: `from openai import OpenAI

client = OpenAI(
    base_url="${serverAddress}/v1",
    api_key="your-api-key",
)

response = client.chat.completions.create(
    model="gpt-5.4",
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
)

print(response.choices[0].message.content)`,
      javascript: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${serverAddress}/v1',
  apiKey: 'your-api-key',
});

const response = await client.chat.completions.create({
  model: 'gpt-5.4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

console.log(response.choices[0].message.content);`
    },
    Claude: {
      curl: `curl https://api.anthropic.com/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`,
      python: `import anthropic

client = anthropic.Anthropic(
    api_key="your-api-key",
)

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
)

print(message.content[0].text)`,
      javascript: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: 'your-api-key',
});

const message = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

console.log(message.content[0].text);`
    },
    Gemini: {
      curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=$GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [
        { "text": "Hello!" }
      ]
    }]
  }'`,
      python: `from google import genai

client = genai.Client(
    api_key="your-api-key",
)

response = client.models.generate_content(
    model="gemini-3.1-pro-preview",
    contents="Hello!",
)

print(response.text)`,
      javascript: `import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: 'your-api-key',
});

const response = await ai.models.generateContent({
  model: 'gemini-3.1-pro-preview',
  contents: 'Hello!',
});

console.log(response.text);`
    }
  };
}

// --- Syntax highlighting ---
const highlights: Record<
  Lang,
  Array<{ pattern: RegExp; className: string }>
> = {
  curl: [
    { pattern: /(curl|\\)/g, className: 'text-yellow-300' },
    { pattern: /(-H|-d)/g, className: 'text-purple-400' },
    { pattern: /("(?:[^"\\]|\\.)*")/g, className: 'text-green-400' },
    { pattern: /(https?:\/\/[^\s"\\]+)/g, className: 'text-cyan-400' }
  ],
  python: [
    {
      pattern: /\b(from|import|as|def|return|print|await)\b/g,
      className: 'text-purple-400'
    },
    { pattern: /("(?:[^"\\]|\\.)*")/g, className: 'text-green-400' },
    {
      pattern: /\b(OpenAI|Anthropic|client|response|message|genai)\b/g,
      className: 'text-yellow-300'
    },
    { pattern: /(#.*)/g, className: 'text-zinc-500' }
  ],
  javascript: [
    {
      pattern: /\b(import|from|const|new|await|async)\b/g,
      className: 'text-purple-400'
    },
    { pattern: /('(?:[^'\\]|\\.)*')/g, className: 'text-green-400' },
    {
      pattern:
        /\b(OpenAI|Anthropic|GoogleGenAI|client|response|message|ai|console)\b/g,
      className: 'text-yellow-300'
    },
    { pattern: /(\/\/.*)/g, className: 'text-zinc-500' }
  ]
};

function highlightCode(code: string, lang: Lang) {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    const parts: Array<{ text: string; className?: string }> = [{ text: line }];
    for (const { pattern, className } of highlights[lang]) {
      const newParts: Array<{ text: string; className?: string }> = [];
      for (const part of parts) {
        if (part.className) {
          newParts.push(part);
          continue;
        }
        const regex = new RegExp(pattern.source, pattern.flags);
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(part.text)) !== null) {
          if (match.index > lastIndex) {
            newParts.push({ text: part.text.slice(lastIndex, match.index) });
          }
          newParts.push({ text: match[0], className });
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < part.text.length) {
          newParts.push({ text: part.text.slice(lastIndex) });
        }
      }
      parts.length = 0;
      parts.push(...newParts);
    }
    return (
      <span key={i}>
        {parts.map((p, j) =>
          p.className ? (
            <span key={j} className={p.className}>
              {p.text}
            </span>
          ) : (
            <span key={j} className="text-zinc-300">
              {p.text}
            </span>
          )
        )}
        {i < lines.length - 1 ? '\n' : ''}
      </span>
    );
  });
}

// --- Language Dropdown ---
function LangDropdown({
  value,
  onChange
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
      >
        {value}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                onChange(lang);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-800 ${
                value === lang ? 'font-medium text-white' : 'text-zinc-400'
              }`}
            >
              {value === lang && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              )}
              {value !== lang && <span className="w-3" />}
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export default function CodeExample({
  serverAddress
}: {
  serverAddress: string;
}) {
  const [activeProvider, setActiveProvider] = useState<Provider>('OpenAI');
  const [activeLang, setActiveLang] = useState<Lang>('curl');
  const [copied, setCopied] = useState(false);

  const codeSnippets = useMemo(
    () => getCodeSnippets(serverAddress),
    [serverAddress]
  );
  const code = codeSnippets[activeProvider][activeLang];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border bg-zinc-950 shadow-2xl">
        {/* 顶栏 */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
          {/* 左侧：模型厂商 tabs */}
          <div className="flex items-center gap-1">
            {providers.map((provider) => (
              <button
                key={provider}
                onClick={() => setActiveProvider(provider)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeProvider === provider
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {provider}
              </button>
            ))}
          </div>

          {/* 右侧：语言下拉 + 复制按钮 */}
          <div className="flex items-center gap-2">
            <LangDropdown value={activeLang} onChange={setActiveLang} />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              title="Copy code"
            >
              {copied ? (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                    />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* 代码内容 */}
        <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
          <code>{highlightCode(code, activeLang)}</code>
        </pre>
      </div>
      {/* 提示信息 */}
      {activeProvider === 'OpenAI' && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            OpenAI compatible format also supports Claude, Gemini and other
            models — just change the model name
          </span>
        </p>
      )}
      {/* 光晕装饰 */}
      <div className="absolute -right-10 -top-10 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
    </div>
  );
}
