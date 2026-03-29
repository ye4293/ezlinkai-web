'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useBreakpoint } from '@/hooks/useBreakPoints';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertCircle,
  Bot,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Copy,
  Image as ImageIcon,
  ImagePlus,
  Plus,
  Send,
  Settings2,
  Square,
  Trash2,
  User,
  X
} from 'lucide-react';

interface TextContentPart {
  type: 'text';
  text: string;
}

interface ImageContentPart {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

type MessageContent = string | Array<TextContentPart | ImageContentPart>;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

interface ModelOption {
  id: string;
  object: string;
}

interface TokenOption {
  id: number;
  key: string;
  name: string;
  status: number;
}

interface SearchableOption {
  value: string;
  label: string;
}

const ENABLED_TOKEN_STATUS = 1;

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

function normalizeModelOptions(data: unknown): ModelOption[] {
  if (Array.isArray(data)) {
    return data.reduce<ModelOption[]>((models, item) => {
      if (typeof item === 'string') {
        models.push({ id: item, object: 'model' });
        return models;
      }
      if (
        item &&
        typeof item === 'object' &&
        'id' in item &&
        typeof item.id === 'string'
      ) {
        models.push({ id: item.id, object: 'model' });
      }
      return models;
    }, []);
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const uniqueModels = new Set<string>();
  Object.values(data as Record<string, unknown>).forEach((value) => {
    if (!Array.isArray(value)) {
      return;
    }
    value.forEach((model) => {
      if (typeof model === 'string' && model.trim()) {
        uniqueModels.add(model);
      }
    });
  });

  return Array.from(uniqueModels)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, object: 'model' as const }));
}

function normalizeTokenOptions(data: unknown): TokenOption[] {
  if (!data || typeof data !== 'object' || !('list' in data)) {
    return [];
  }

  const list = (data as { list?: unknown }).list;
  if (!Array.isArray(list)) {
    return [];
  }

  return list.filter((item): item is TokenOption => {
    return (
      !!item &&
      typeof item === 'object' &&
      'id' in item &&
      typeof item.id === 'number' &&
      'key' in item &&
      typeof item.key === 'string' &&
      item.key.length > 0 &&
      'status' in item &&
      typeof item.status === 'number' &&
      item.status === ENABLED_TOKEN_STATUS &&
      'name' in item &&
      typeof item.name === 'string'
    );
  });
}

function formatTokenLabel(token: TokenOption) {
  const tokenSuffix =
    token.key.length > 8
      ? `${token.key.slice(0, 4)}...${token.key.slice(-4)}`
      : token.key;
  return token.name ? `${token.name} (${tokenSuffix})` : tokenSuffix;
}

function isDataImageUrl(url: string) {
  return url.startsWith('data:image/');
}

function getTextContent(content: MessageContent) {
  if (typeof content === 'string') {
    return content;
  }

  return content
    .filter((part): part is TextContentPart => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function getImageUrls(content: MessageContent) {
  if (typeof content === 'string') {
    return [];
  }

  return content.flatMap((part) =>
    part.type === 'image_url' && part.image_url.url ? [part.image_url.url] : []
  );
}

function buildMessageContent(
  textContent: string,
  imageUrls: string[],
  imageEnabled: boolean
): MessageContent {
  const validImageUrls = imageUrls
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (imageEnabled && validImageUrls.length > 0) {
    return [
      { type: 'text', text: textContent || '' },
      ...validImageUrls.map((url) => ({
        type: 'image_url' as const,
        image_url: { url }
      }))
    ];
  }

  return textContent || '';
}

function getCopyableContent(content: MessageContent) {
  const textContent = getTextContent(content);
  const imageLines = getImageUrls(content).map((url, index) =>
    isDataImageUrl(url) ? `[Image ${index + 1}: local attachment]` : url
  );

  return [textContent, ...imageLines]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join('\n');
}

function normalizeAssistantContent(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (
        part &&
        typeof part === 'object' &&
        'type' in part &&
        part.type === 'text' &&
        'text' in part &&
        typeof part.text === 'string'
      ) {
        return part.text;
      }
      return '';
    })
    .filter((part) => part.length > 0)
    .join('\n')
    .trim();
}

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read image file'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function ImageUrlInput({
  imageUrls,
  imageEnabled,
  localImageCount,
  onImageUrlsChange,
  onImageEnabledChange,
  onRemoveImage
}: {
  imageUrls: string[];
  imageEnabled: boolean;
  localImageCount: number;
  onImageUrlsChange: (urls: string[]) => void;
  onImageEnabledChange: (enabled: boolean) => void;
  onRemoveImage: (index: number) => void;
}) {
  const remoteImageEntries = imageUrls
    .map((url, index) => ({ url, index }))
    .filter(({ url }) => !isDataImageUrl(url));

  const handleAddImageUrl = () => {
    if (!imageEnabled) {
      return;
    }

    onImageUrlsChange([...imageUrls, '']);
  };

  const handleUpdateImageUrl = (index: number, value: string) => {
    const nextUrls = [...imageUrls];
    nextUrls[index] = value;
    onImageUrlsChange(nextUrls);
  };

  const helperText = !imageEnabled
    ? 'Enable images to add URLs, upload files, or paste screenshots.'
    : remoteImageEntries.length === 0 && localImageCount === 0
    ? 'Click + to add image URLs. Upload or paste images from the composer.'
    : `${remoteImageEntries.length} URL${
        remoteImageEntries.length === 1 ? '' : 's'
      }, ${localImageCount} local image${
        localImageCount === 1 ? '' : 's'
      } ready.`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon
            className={cn(
              'h-4 w-4',
              imageEnabled ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <Label className="text-xs font-medium">Images</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={imageEnabled}
            onCheckedChange={onImageEnabledChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={handleAddImageUrl}
            disabled={!imageEnabled}
            title="Add image URL"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{helperText}</p>

      {remoteImageEntries.length > 0 && (
        <div className="space-y-2">
          {remoteImageEntries.map(({ url, index }) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => handleUpdateImageUrl(index, e.target.value)}
                placeholder={`https://example.com/image${index + 1}.png`}
                className="h-8 text-xs"
                disabled={!imageEnabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onRemoveImage(index)}
                disabled={!imageEnabled}
                title="Remove image URL"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {localImageCount > 0 && (
        <div
          className={cn(
            'rounded-md border px-3 py-2 text-xs',
            !imageEnabled && 'opacity-70'
          )}
        >
          {localImageCount} pasted/uploaded local image
          {localImageCount === 1 ? '' : 's'} saved.
        </div>
      )}
    </div>
  );
}

function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  value,
  options,
  disabled,
  onChange
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  value: string;
  options: SearchableOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between px-3 text-xs font-normal"
            disabled={disabled}
          >
            <span className="truncate text-left">
              {selectedOption?.label || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface PlaygroundSettingsContentProps {
  modelOptions: SearchableOption[];
  tokenOptions: SearchableOption[];
  selectedModel: string;
  selectedTokenKey: string;
  modelError: string;
  tokenError: string;
  modelsCount: number;
  tokensCount: number;
  imageUrls: string[];
  imageEnabled: boolean;
  localImageCount: number;
  systemPrompt: string;
  streamEnabled: boolean;
  temperature: number;
  maxTokens: number;
  onModelChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  onImageUrlsChange: (urls: string[]) => void;
  onImageEnabledChange: (enabled: boolean) => void;
  onRemoveImage: (index: number) => void;
  onSystemPromptChange: (value: string) => void;
  onStreamChange: (checked: boolean) => void;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onClearMessages: () => void;
}

function PlaygroundSettingsContent({
  modelOptions,
  tokenOptions,
  selectedModel,
  selectedTokenKey,
  modelError,
  tokenError,
  modelsCount,
  tokensCount,
  imageUrls,
  imageEnabled,
  localImageCount,
  systemPrompt,
  streamEnabled,
  temperature,
  maxTokens,
  onModelChange,
  onTokenChange,
  onImageUrlsChange,
  onImageEnabledChange,
  onRemoveImage,
  onSystemPromptChange,
  onStreamChange,
  onTemperatureChange,
  onMaxTokensChange,
  onClearMessages
}: PlaygroundSettingsContentProps) {
  return (
    <div className="space-y-5 p-4">
      <SearchableSelect
        label="Model"
        value={selectedModel}
        options={modelOptions}
        onChange={onModelChange}
        disabled={modelsCount === 0}
        placeholder={modelError ? 'Models unavailable' : 'Select model'}
        searchPlaceholder="Search models..."
        emptyText="No matching models."
      />

      <SearchableSelect
        label="API Key"
        value={selectedTokenKey}
        options={tokenOptions}
        onChange={onTokenChange}
        disabled={tokensCount === 0}
        placeholder={tokenError ? 'API keys unavailable' : 'Select API key'}
        searchPlaceholder="Search API keys..."
        emptyText="No matching API keys."
      />

      {(modelError || tokenError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Playground setup failed</AlertTitle>
          <AlertDescription>{modelError || tokenError}</AlertDescription>
        </Alert>
      )}

      {!tokenError && tokensCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No API key available</AlertTitle>
          <AlertDescription>
            Create a key in the `Keys` page, then refresh this playground.
          </AlertDescription>
        </Alert>
      )}

      <ImageUrlInput
        imageUrls={imageUrls}
        imageEnabled={imageEnabled}
        localImageCount={localImageCount}
        onImageUrlsChange={onImageUrlsChange}
        onImageEnabledChange={onImageEnabledChange}
        onRemoveImage={onRemoveImage}
      />

      <div className="space-y-2">
        <Label className="text-xs">System Prompt</Label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="You are a helpful assistant."
          className="min-h-[80px] text-xs"
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Stream</Label>
        <Switch checked={streamEnabled} onCheckedChange={onStreamChange} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Temperature</Label>
          <span className="text-xs text-muted-foreground">{temperature}</span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={([value]) => onTemperatureChange(value)}
          min={0}
          max={2}
          step={0.1}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Max Tokens</Label>
        <Input
          type="number"
          value={maxTokens}
          onChange={(e) =>
            onMaxTokensChange(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          className="h-8 text-xs"
          min={1}
          max={128000}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={onClearMessages}
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Clear Messages
      </Button>
    </div>
  );
}

export default function PlaygroundPage() {
  const { data: session } = useSession();
  const { isBelowXl } = useBreakpoint('xl');
  const isCompactLayout = isBelowXl;

  const [models, setModels] = useState<ModelOption[]>([]);
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTokenKey, setSelectedTokenKey] = useState('');
  const [imageEnabled, setImageEnabled] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [modelError, setModelError] = useState('');
  const [tokenError, setTokenError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const modelOptions = useMemo<SearchableOption[]>(
    () =>
      models.map((model) => ({
        value: model.id,
        label: model.id
      })),
    [models]
  );

  const tokenOptions = useMemo<SearchableOption[]>(
    () =>
      tokens.map((token) => ({
        value: token.key,
        label: formatTokenLabel(token)
      })),
    [tokens]
  );

  const validImageUrls = useMemo(
    () => imageUrls.map((url) => url.trim()).filter((url) => url.length > 0),
    [imageUrls]
  );

  const localImageCount = useMemo(
    () => imageUrls.filter((url) => isDataImageUrl(url)).length,
    [imageUrls]
  );

  const hasPendingImages = imageEnabled && validImageUrls.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isCompactLayout) {
      setMobileSettingsOpen(false);
    }
  }, [isCompactLayout]);

  const loadModels = useCallback(async () => {
    try {
      setModelError('');
      const res = await fetch('/api/models');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || `Failed to load models (${res.status})`
        );
      }

      const modelList = normalizeModelOptions(json.data);
      setModels(modelList);
      setSelectedModel((current) => {
        if (current && modelList.some((model) => model.id === current)) {
          return current;
        }
        return modelList[0]?.id ?? '';
      });

      if (modelList.length === 0) {
        setModelError('No models were returned by the current backend.');
      }

      return modelList;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load models';
      setModels([]);
      setSelectedModel('');
      setModelError(message);
      toast.error(message);
      return [];
    }
  }, []);

  const loadTokens = useCallback(async () => {
    try {
      setTokenError('');
      const res = await fetch('/api/token?page=1&pagesize=100');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || `Failed to load API keys (${res.status})`
        );
      }

      const tokenList = normalizeTokenOptions(json.data);
      setTokens(tokenList);
      setSelectedTokenKey((current) => {
        if (current && tokenList.some((token) => token.key === current)) {
          return current;
        }
        return tokenList[0]?.key ?? '';
      });

      if (tokenList.length === 0) {
        setTokenError(
          'No enabled API keys were found. Create one in the Keys page before chatting.'
        );
      }

      return tokenList;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load API keys';
      setTokens([]);
      setSelectedTokenKey('');
      setTokenError(message);
      toast.error(message);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.accessToken) {
      return;
    }

    void loadModels();
    void loadTokens();
  }, [session?.user?.accessToken, loadModels, loadTokens]);

  const appendImages = useCallback((newUrls: string[]) => {
    setImageUrls((prev) => [...prev, ...newUrls]);
  }, []);

  const handleImageFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      try {
        const dataUrls = await Promise.all(
          files.map((file) => readImageFileAsDataUrl(file))
        );
        setImageEnabled(true);
        appendImages(dataUrls);
        toast.success(
          `${dataUrls.length} image${dataUrls.length > 1 ? 's' : ''} added`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to process image';
        toast.error(message);
      }
    },
    [appendImages]
  );

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith('image/')
    );
    await handleImageFiles(files);
    event.target.value = '';
  };

  const handleOpenImageUpload = () => {
    setImageEnabled(true);
    imageFileInputRef.current?.click();
  };

  const handlePasteImage = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const files = items
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (files.length === 0) {
        return;
      }

      event.preventDefault();
      if (!imageEnabled) {
        toast.warning('Enable images in Settings before pasting a screenshot');
        return;
      }

      await handleImageFiles(files);
    },
    [handleImageFiles, imageEnabled]
  );

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const handleClearImages = () => {
    setImageUrls([]);
    setImageEnabled(false);
  };

  const handleSend = useCallback(async () => {
    if ((!inputValue.trim() && !hasPendingImages) || isStreaming) return;
    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }
    if (!selectedTokenKey) {
      toast.error('Please select an API key');
      return;
    }

    const messageContent = buildMessageContent(
      inputValue.trim(),
      validImageUrls,
      imageEnabled
    );
    const userMessage: Message = { role: 'user', content: messageContent };
    const allMessages: Message[] = [
      ...(systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }]
        : []),
      ...messages,
      userMessage
    ];

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    if (hasPendingImages) {
      setImageEnabled(false);
    }
    setIsStreaming(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const body: Record<string, any> = {
        apiKey: selectedTokenKey,
        model: selectedModel,
        messages: allMessages,
        stream: streamEnabled,
        temperature,
        max_tokens: maxTokens
      };

      const res = await fetch('/api/playground/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      if (streamEnabled && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = normalizeAssistantContent(
                parsed.choices?.[0]?.delta?.content
              );
              if (delta) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    const currentContent =
                      typeof last.content === 'string'
                        ? last.content
                        : getTextContent(last.content);
                    updated[updated.length - 1] = {
                      ...last,
                      content: currentContent + delta
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } else {
        const json = await res.json();
        if (json.error) {
          throw new Error(json.error.message || 'Request failed');
        }
        const content = normalizeAssistantContent(
          json.choices?.[0]?.message?.content
        );
        if (!content) {
          throw new Error('No response content');
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content
          };
          return updated;
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      const message = error instanceof Error ? error.message : 'Request failed';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${message}`
        };
        return updated;
      });
      toast.error(message);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [
    hasPendingImages,
    imageEnabled,
    inputValue,
    isStreaming,
    selectedModel,
    systemPrompt,
    messages,
    streamEnabled,
    temperature,
    maxTokens,
    selectedTokenKey,
    validImageUrls
  ]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleClear = () => {
    setMessages([]);
    setInputValue('');
  };

  const handleCopy = (content: MessageContent, idx: number) => {
    const copyValue = getCopyableContent(content);
    if (!copyValue) {
      return;
    }

    navigator.clipboard.writeText(copyValue);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      (inputValue.trim() || hasPendingImages)
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100dvh-52px)] overflow-hidden">
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />

      {!isCompactLayout && (
        <div
          className={cn(
            'relative hidden flex-shrink-0 bg-background transition-all duration-300 xl:block',
            settingsOpen ? 'w-72 border-r' : 'w-0'
          )}
        >
          {settingsOpen && (
            <ScrollArea className="h-full">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSettingsOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <PlaygroundSettingsContent
                modelOptions={modelOptions}
                tokenOptions={tokenOptions}
                selectedModel={selectedModel}
                selectedTokenKey={selectedTokenKey}
                modelError={modelError}
                tokenError={tokenError}
                modelsCount={models.length}
                tokensCount={tokens.length}
                imageUrls={imageUrls}
                imageEnabled={imageEnabled}
                localImageCount={localImageCount}
                systemPrompt={systemPrompt}
                streamEnabled={streamEnabled}
                temperature={temperature}
                maxTokens={maxTokens}
                onModelChange={setSelectedModel}
                onTokenChange={setSelectedTokenKey}
                onImageUrlsChange={setImageUrls}
                onImageEnabledChange={setImageEnabled}
                onRemoveImage={handleRemoveImage}
                onSystemPromptChange={setSystemPrompt}
                onStreamChange={setStreamEnabled}
                onTemperatureChange={setTemperature}
                onMaxTokensChange={setMaxTokens}
                onClearMessages={handleClear}
              />
            </ScrollArea>
          )}
        </div>
      )}

      {isCompactLayout && (
        <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <SheetContent side="left" className="w-[88vw] p-0 sm:max-w-sm">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="text-sm">Settings</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100dvh-57px)]">
              <PlaygroundSettingsContent
                modelOptions={modelOptions}
                tokenOptions={tokenOptions}
                selectedModel={selectedModel}
                selectedTokenKey={selectedTokenKey}
                modelError={modelError}
                tokenError={tokenError}
                modelsCount={models.length}
                tokensCount={tokens.length}
                imageUrls={imageUrls}
                imageEnabled={imageEnabled}
                localImageCount={localImageCount}
                systemPrompt={systemPrompt}
                streamEnabled={streamEnabled}
                temperature={temperature}
                maxTokens={maxTokens}
                onModelChange={setSelectedModel}
                onTokenChange={setSelectedTokenKey}
                onImageUrlsChange={setImageUrls}
                onImageEnabledChange={setImageEnabled}
                onRemoveImage={handleRemoveImage}
                onSystemPromptChange={setSystemPrompt}
                onStreamChange={setStreamEnabled}
                onTemperatureChange={setTemperature}
                onMaxTokensChange={setMaxTokens}
                onClearMessages={handleClear}
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          {(isCompactLayout || !settingsOpen) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                isCompactLayout
                  ? setMobileSettingsOpen(true)
                  : setSettingsOpen(true)
              }
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          <span className="truncate text-sm font-medium">Playground</span>
          {selectedModel && (
            <span className="max-w-[45vw] truncate rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:max-w-xs">
              {selectedModel}
            </span>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="mx-auto w-full max-w-3xl space-y-1 p-3 sm:p-4">
            {messages.length === 0 && (
              <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Bot className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p className="text-sm">
                    Send a message to start the conversation
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const textContent = getTextContent(msg.content);
              const imageAttachments = getImageUrls(msg.content);

              return (
                <div
                  key={idx}
                  className={cn(
                    'group relative rounded-lg px-3 py-2.5 sm:px-4 sm:py-3',
                    msg.role === 'user' ? 'bg-muted/50' : 'bg-background'
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs font-medium capitalize">
                      {msg.role}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="ml-auto opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-3 pl-6">
                    {textContent && (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {textContent}
                      </div>
                    )}

                    {imageAttachments.length > 0 && (
                      <div className="grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-3">
                        {imageAttachments.map((url, imageIndex) => (
                          <a
                            key={`${idx}-${imageIndex}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-md border bg-muted"
                          >
                            <img
                              src={url}
                              alt={`Message attachment ${imageIndex + 1}`}
                              className="h-28 w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {isStreaming &&
                      idx === messages.length - 1 &&
                      msg.role === 'assistant' &&
                      !textContent &&
                      imageAttachments.length === 0 && (
                        <span className="inline-block h-4 w-1.5 animate-pulse bg-foreground/70" />
                      )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t bg-background p-3 sm:p-4">
          <div className="mx-auto max-w-3xl">
            {validImageUrls.length > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  {validImageUrls.length} image
                  {validImageUrls.length === 1 ? '' : 's'} ready
                  {imageEnabled ? ' for the next prompt' : ' saved'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleClearImages}
                >
                  Clear
                </Button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0 sm:h-[44px] sm:w-[44px]"
                onClick={handleOpenImageUpload}
                disabled={isStreaming}
                title="Upload image"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteImage}
                placeholder={
                  imageEnabled
                    ? 'Type a message or paste an image... (Enter to send, Shift+Enter for new line)'
                    : 'Type a message... (Enter to send, Shift+Enter for new line)'
                }
                className="max-h-[200px] min-h-[40px] resize-none text-sm sm:min-h-[44px]"
                rows={1}
                disabled={isStreaming}
              />
              {isStreaming ? (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 sm:h-[44px] sm:w-[44px]"
                  onClick={handleStop}
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 sm:h-[44px] sm:w-[44px]"
                  onClick={handleSend}
                  disabled={
                    (!inputValue.trim() && !hasPendingImages) ||
                    !selectedModel ||
                    !selectedTokenKey
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
