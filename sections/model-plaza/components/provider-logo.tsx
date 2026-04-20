import Image from 'next/image';
import { Box } from 'lucide-react';

// SVG 源自 @lobehub/icons-static-svg，已复制到 public/providers/
const logoMap: Record<string, string> = {
  OpenAI: '/providers/openai.svg',
  Anthropic: '/providers/anthropic.svg',
  Google: '/providers/google-color.svg',
  DeepSeek: '/providers/deepseek-color.svg',
  xAI: '/providers/xai.svg',
  Alibaba: '/providers/qwen-color.svg',
  Zhipu: '/providers/chatglm-color.svg',
  Baidu: '/providers/baidu-color.svg',
  Moonshot: '/providers/moonshot.svg',
  Mistral: '/providers/mistral-color.svg',
  Meta: '/providers/meta-color.svg',
  Groq: '/providers/groq.svg'
};

interface ProviderLogoMarkProps {
  provider: string;
  size?: number;
  className?: string;
}

export function ProviderLogoMark({
  provider,
  size = 14,
  className = ''
}: ProviderLogoMarkProps) {
  const src = logoMap[provider];
  if (!src) {
    return (
      <Box
        size={size}
        className={`shrink-0 text-muted-foreground ${className}`}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={provider}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      unoptimized
    />
  );
}

interface ProviderLogoProps {
  provider: string;
  size?: number;
  showName?: boolean;
  className?: string;
}

export default function ProviderLogo({
  provider,
  size = 14,
  showName = true,
  className = ''
}: ProviderLogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 ${className}`}
    >
      <ProviderLogoMark provider={provider} size={size} />
      {showName && (
        <span className="text-[10px] font-medium leading-none text-foreground/80">
          {provider}
        </span>
      )}
    </span>
  );
}
