'use client';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { LogStat } from '@/lib/types/log';
import { ColumnDef } from '@tanstack/react-table';
import { CopyableCell } from '@/components/ui/copyable-cell';

// usageDetails 字段的类型定义
export interface UsageDetails {
  // 基础 token 计数
  input_tokens?: number;
  output_tokens?: number;
  // 文本/图片分类
  input_text?: number;
  input_image?: number;
  output_text?: number;
  output_image?: number;
  // 推理相关
  output_reasoning?: number;
  // 缓存相关
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  claude_cache_creation_5_m_tokens?: number;
  // 其他可能的字段
  [key: string]: number | undefined;
}

// usageDetails 字段名称映射（用于展示）
export const usageDetailsLabels: Record<string, string> = {
  input_tokens: '输入 Tokens',
  output_tokens: '输出 Tokens',
  input_text: '文本输入',
  input_image: '图片输入',
  output_text: '文本输出',
  output_image: '图片输出',
  output_reasoning: '推理输出',
  cache_read_input_tokens: '缓存读取',
  cache_creation_input_tokens: '缓存创建',
  claude_cache_creation_5_m_tokens: 'Claude 5分钟缓存创建'
};

// 解析 other 字段中的 usageDetails
export const parseUsageDetails = (row: LogStat): UsageDetails | null => {
  const parsed = parseLogOther(row);
  if (parsed) {
    const details = parsed.usage_details || parsed.usageDetails;
    if (details && typeof details === 'object') return details;
  }
  return null;
};

// other 字段解析缓存，避免每列每行重复解析
const otherParseCache = new WeakMap<LogStat, Record<string, any> | null>();

// 解析 other 字段（兼容 JSON 和 ezlinkai 分号分隔格式），带缓存
// ezlinkai 格式示例: "adminInfo:[1,2];usageDetails:{...};is_model_mapped:true;upstream_model_name:gpt-4"
export const parseLogOther = (row: LogStat): Record<string, any> | null => {
  if (otherParseCache.has(row)) return otherParseCache.get(row)!;
  const other = row.other;
  if (!other || other.trim() === '') {
    otherParseCache.set(row, null);
    return null;
  }

  // 尝试 JSON 解析（兼容 new-api 格式）
  try {
    const parsed = JSON.parse(other);
    if (typeof parsed === 'object' && parsed !== null) {
      otherParseCache.set(row, parsed);
      return parsed;
    }
  } catch {
    // 非 JSON，走分号分隔解析
  }

  // ezlinkai 分号分隔格式解析
  const result: Record<string, any> = {};
  // 用分号分割，但需要处理 adminInfo:[...] 和 usageDetails:{...} 中包含分号的情况
  // 简单的 key:value 对用正则提取
  const isModelMappedMatch = other.match(/is_model_mapped:(\w+)/);
  if (isModelMappedMatch) {
    result.is_model_mapped = isModelMappedMatch[1] === 'true';
  }
  const upstreamMatch = other.match(/upstream_model_name:([^;]+)/);
  if (upstreamMatch) {
    result.upstream_model_name = upstreamMatch[1].trim();
  }
  // adminInfo
  const adminInfoMatch = other.match(/adminInfo:\s*(\[.*?\])/);
  if (adminInfoMatch) {
    try {
      result.adminInfo = JSON.parse(adminInfoMatch[1]);
    } catch {
      /* ignore */
    }
  }
  // usageDetails
  const usageIndex = other.indexOf('usageDetails:');
  if (usageIndex !== -1) {
    const startIndex = other.indexOf('{', usageIndex);
    if (startIndex !== -1) {
      let braceCount = 0;
      let endIndex = startIndex;
      for (let i = startIndex; i < other.length; i++) {
        if (other[i] === '{') braceCount++;
        else if (other[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
      if (braceCount === 0) {
        try {
          result.usageDetails = JSON.parse(
            other.substring(startIndex, endIndex + 1)
          );
        } catch {
          /* ignore */
        }
      }
    }
  }

  const hasData = Object.keys(result).length > 0;
  otherParseCache.set(row, hasData ? result : null);
  return hasData ? result : null;
};

// 获取模型重定向信息
export const getModelMappingInfo = (
  row: LogStat
): { upstreamModelName: string } | null => {
  const parsed = parseLogOther(row);
  if (parsed && parsed.is_model_mapped === true && parsed.upstream_model_name) {
    return { upstreamModelName: parsed.upstream_model_name };
  }
  return null;
};

// 截断字符串
const truncateStr = (name: string, max: number) =>
  name.length > max ? `${name.substring(0, max)}...` : name;

// 解析重试序列
const parseRetrySequence = (
  row: LogStat
): {
  channelIds: number[];
  retrySequence: string;
  displayText: string;
} | null => {
  const parsed = parseLogOther(row);
  if (!parsed) return null;

  const info = parsed.admin_info || parsed.adminInfo;
  if (!Array.isArray(info) || info.length === 0) return null;

  const channelIds: number[] = info;
  const retrySequence = channelIds.join('->');
  const displayText =
    retrySequence.length > 15
      ? `${channelIds[0]}->...${
          channelIds.length > 1 ? `(${channelIds.length})` : ''
        }`
      : retrySequence;

  return { channelIds, retrySequence, displayText };
};

/** 类型 */
const renderType = (status: number) => {
  switch (status) {
    case 1:
      return <span>Top up</span>;
    case 2:
      return <span>Consumption</span>;
    case 3:
      return <span>Management</span>;
    case 4:
      return <span>System</span>;
    case 5:
      return <span className="font-medium text-red-500">Error</span>;
    default:
      return <span>Unknown</span>;
  }
};

const processQuota = (quota: number) => {
  // 将quota除以500000，并保留小数点后六位
  const processedQuota = (quota / 500000).toFixed(6);
  // 转换为数值类型，以便去除多余的零
  return `$${parseFloat(processedQuota)}`;
};

export const getTokenSpeedValue = (
  log: Pick<LogStat, 'speed' | 'completion_tokens' | 'duration'>
) => {
  if (
    typeof log.speed === 'number' &&
    Number.isFinite(log.speed) &&
    log.speed > 0
  ) {
    return log.speed;
  }

  if (log.duration > 0 && log.completion_tokens > 0) {
    return log.completion_tokens / log.duration;
  }

  return 0;
};

export const formatTokenSpeed = (
  log: Pick<LogStat, 'speed' | 'completion_tokens' | 'duration'>
) => {
  const speed = getTokenSpeedValue(log);
  return speed > 0 ? `${speed.toFixed(2)} t/s` : '-';
};

// 颜色档位常量
const TIER_EMERALD =
  'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30';
const TIER_AMBER =
  'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30';
const TIER_ROSE =
  'bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30';

/** Duration 颜色：越低越好 */
export const getDurationTier = (duration: number) =>
  duration >= 100 ? TIER_ROSE : duration >= 50 ? TIER_AMBER : TIER_EMERALD;

/** Speed 颜色：越高越好 */
export const getSpeedTier = (speed: number) =>
  speed >= 50 ? TIER_EMERALD : speed >= 20 ? TIER_AMBER : TIER_ROSE;

export const columns: ColumnDef<LogStat>[] = [
  {
    id: 'select',
    size: 50,
    minSize: 50,
    maxSize: 50,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'created_at',
    size: 180,
    minSize: 160,
    header: () => <div className="text-center">Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at') as number;
      const formattedTime = dayjs(Number(timestamp) * 1000).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      return (
        <div className="text-left">
          <CopyableCell value={formattedTime} label="时间">
            {formattedTime}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  // 管理员
  {
    id: 'channel',
    accessorKey: 'channel',
    size: 100,
    minSize: 80,
    header: () => <div className="text-center">Channel</div>,
    cell: ({ row }) => {
      const channel = row.getValue('channel') as number;
      return (
        <div className="text-center">
          <CopyableCell value={channel} label="渠道ID">
            {channel}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'username',
    size: 150,
    minSize: 120,
    header: () => <div className="text-left">User</div>,
    cell: ({ row }) => {
      const username = row.getValue('username') as string;
      return (
        <div className="text-left">
          <CopyableCell value={username} label="用户名">
            {username}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'token_name',
    size: 150,
    minSize: 120,
    header: () => <div className="text-left">Token</div>,
    cell: ({ row }) => {
      const tokenName = row.getValue('token_name') as string;
      return (
        <div className="text-left">
          <CopyableCell value={tokenName} label="Token名称">
            {tokenName}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => {
      const type = row.getValue('type') as number;
      return (
        <div className="text-center">
          <CopyableCell value={type} label="类型">
            {renderType(type)}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'model_name',
    size: 320,
    minSize: 280,
    header: () => <div className="text-center">Model</div>,
    cell: ({ row }) => {
      const modelName = row.getValue('model_name') as string;
      const mappingInfo = getModelMappingInfo(row.original);

      if (mappingInfo) {
        const { upstreamModelName } = mappingInfo;
        const copyValue = `${modelName} → ${upstreamModelName}`;
        return (
          <div className="text-center">
            <CopyableCell value={copyValue} label="模型名称">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1">
                      <Badge variant="outline">
                        {truncateStr(modelName, 25)}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="secondary">
                        {truncateStr(upstreamModelName, 25)}
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="space-y-1 text-xs">
                      <p>
                        <span className="text-muted-foreground">
                          请求模型：
                        </span>
                        {modelName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          实际模型：
                        </span>
                        {upstreamModelName}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CopyableCell>
          </div>
        );
      }

      // 无重定向：正常显示
      return (
        <div className="text-center">
          <CopyableCell value={modelName} label="模型名称">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline">{truncateStr(modelName, 40)}</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{modelName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'prompt_tokens',
    header: () => <div className="text-center">Prompt</div>,
    size: 100,
    minSize: 80,
    cell: ({ row }) => {
      const promptTokens = row.getValue('prompt_tokens') as number;
      return (
        <div className="text-center">
          <CopyableCell value={promptTokens} label="输入Token">
            {promptTokens}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'completion_tokens',
    header: () => <div className="text-center">Completion</div>,
    size: 110,
    minSize: 90,
    cell: ({ row }) => {
      const completionTokens = row.getValue('completion_tokens') as number;
      return (
        <div className="text-center">
          <CopyableCell value={completionTokens} label="输出Token">
            {completionTokens}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'speed',
    header: () => <div className="text-center">Speed</div>,
    size: 120,
    minSize: 100,
    cell: ({ row }) => {
      const formattedSpeed = formatTokenSpeed(row.original);
      const speedValue = getTokenSpeedValue(row.original);

      if (formattedSpeed === '-') {
        return <div className="text-center">-</div>;
      }

      return (
        <div className="text-center">
          <CopyableCell value={formattedSpeed} label="Token生成速率">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-medium ring-1 ring-inset ${getSpeedTier(
                speedValue
              )}`}
            >
              {formattedSpeed}
            </span>
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    id: 'retry',
    accessorKey: 'other',
    header: () => <div className="w-24 text-center">重试</div>,
    size: 120,
    cell: ({ row }) => {
      const parsed = parseRetrySequence(row.original);

      if (!parsed) {
        return <div className="w-24 text-center">-</div>;
      }

      const { channelIds, retrySequence, displayText } = parsed;

      return (
        <div className="w-24 text-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-block max-w-full cursor-help truncate font-mono text-xs text-blue-600"
                  title={retrySequence}
                >
                  {displayText}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">渠道重试序列</p>
                  <p className="break-all font-mono text-xs">{retrySequence}</p>
                  <p className="text-xs text-muted-foreground">
                    共 {channelIds.length} 次尝试
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'quota',
    header: () => <div className="text-center">Quota</div>,
    cell: ({ row }) => {
      const quota = row.getValue('quota') as number;
      const processedQuota = processQuota(quota);
      return (
        <div className="text-center">
          <CopyableCell value={processedQuota} label="配额">
            {processedQuota}
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'duration',
    header: () => <div className="text-center">Duration/First Word</div>,
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number;
      // 修复：处理数据库中的数字类型（1/0）转换为布尔值
      const isStreamValue = row.original.is_stream;
      const isStream = (isStreamValue as any) === 1 || isStreamValue === true;

      // 修复：处理首字延迟字段名，直接使用 first_word_latency
      const firstWordLatencyValue = (row.original as any).first_word_latency;
      const firstWordLatency =
        typeof firstWordLatencyValue === 'number' ? firstWordLatencyValue : 0;

      return (
        <div className="flex items-center justify-center gap-1.5 text-center">
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getDurationTier(
              duration
            )}`}
          >
            {duration}s
          </span>
          {isStream && (
            <>
              <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                Stream
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                        firstWordLatency > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {firstWordLatency > 0
                        ? `${firstWordLatency.toFixed(2)}s`
                        : 'N/A'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      First Word Latency:{' '}
                      {firstWordLatency > 0
                        ? `${firstWordLatency.toFixed(3)}s`
                        : 'Not calculated or 0'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'x_request_id',
    header: () => <div className="text-left">X-Request-ID</div>,
    cell: ({ row }) => {
      const xRequestId = row.getValue('x_request_id') as string;
      if (!xRequestId) return <div className="text-left">-</div>;
      const truncatedId =
        xRequestId.length > 12
          ? `${xRequestId.substring(0, 12)}...`
          : xRequestId;

      return (
        <div className="text-left">
          <CopyableCell value={xRequestId} label="X-Request-ID">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-mono text-xs">
                    {truncatedId}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono">{xRequestId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    accessorKey: 'x_response_id',
    header: () => <div className="text-left">X-Response-ID</div>,
    cell: ({ row }) => {
      const xResponseId = row.getValue('x_response_id') as string;
      if (!xResponseId) return <div className="text-left">-</div>;
      const truncatedId =
        xResponseId.length > 12
          ? `${xResponseId.substring(0, 12)}...`
          : xResponseId;

      return (
        <div className="text-left">
          <CopyableCell value={xResponseId} label="X-Response-ID">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-mono text-xs">
                    {truncatedId}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono">{xResponseId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  },
  {
    id: 'content',
    accessorKey: 'content',
    size: 300,
    minSize: 250,
    header: () => <div className="text-left">Details</div>,
    cell: ({ row }) => {
      const content = row.getValue('content') as string;
      const truncatedContent =
        content.length > 50 ? `${content.substring(0, 50)}...` : content;

      return (
        <div className="text-left">
          <CopyableCell value={content} label="详细信息">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{truncatedContent}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{content}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    enableHiding: true
  }
];
