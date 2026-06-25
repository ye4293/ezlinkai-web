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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
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
  claude_cache_creation_1_h_tokens?: number;
  cached_tokens?: number;
  // 其他可能的字段
  [key: string]: number | undefined;
}

// billingDetails 字段的类型定义
export interface BillingDetails {
  billing_type: 'token' | 'fixed_price';
  model_ratio?: number;
  completion_ratio?: number;
  group_ratio?: number;
  model_price?: number;
  cached_tokens?: number;
  cache_ratio?: number;
  // Claude 原生三档缓存倍率（相对于输入价格）
  claude_cache_5m_ratio?: number;
  claude_cache_1h_ratio?: number;
  claude_cache_read_ratio?: number;
  // 折扣分量（从 v2 起新增）
  tier_ratio?: number; // 纯等级折扣
  channel_discount?: number; // 渠道折扣
  user_channel_ratio?: number; // 用户针对渠道类型的额外折扣
  // 多 Key 渠道
  is_multi_key?: boolean;
  key_index?: number;
}

// usageDetails 字段名称映射（用于展示），支持 i18n
export const getUsageDetailsLabels = (
  logDetail: Record<string, string>
): Record<string, string> => ({
  input_tokens: logDetail.inputTokens,
  output_tokens: logDetail.outputTokens,
  input_text: logDetail.inputText,
  input_image: logDetail.inputImage,
  output_text: logDetail.outputText,
  output_image: logDetail.outputImage,
  output_reasoning: logDetail.outputReasoning,
  cache_read_input_tokens: logDetail.cacheRead,
  cache_creation_input_tokens: logDetail.cacheCreation,
  claude_cache_creation_5_m_tokens: logDetail.claudeCache5m,
  claude_cache_creation_1_h_tokens: logDetail.claudeCache1h,
  cached_tokens: logDetail.cachedTokens
});

// 保留静态导出用于向后兼容
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
  claude_cache_creation_5_m_tokens: 'Claude 5分钟缓存创建',
  claude_cache_creation_1_h_tokens: 'Claude 1小时缓存创建',
  cached_tokens: '缓存 Token'
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

// 解析 other 字段中的 billingDetails
export const parseBillingDetails = (row: LogStat): BillingDetails | null => {
  const parsed = parseLogOther(row);
  if (parsed) {
    const details = parsed.billing_details || parsed.billingDetails;
    if (details && typeof details === 'object' && 'billing_type' in details) {
      return details as BillingDetails;
    }
  }
  return null;
};

// other 字段解析缓存，避免每列每行重复解析
const otherParseCache = new WeakMap<LogStat, Record<string, any> | null>();

// 从分号分隔格式中提取 JSON 对象或数组（如 usageDetails:{...} 或 retryHistory:[...]）
// 支持 { } 和 [ ] 配对，遵循字符串字面量内的字符及反斜杠转义
const extractJsonFromSemicolonFormat = (
  str: string,
  key: string
): any | null => {
  const index = str.indexOf(`${key}:`);
  if (index === -1) return null;

  // 找到 ':' 之后第一个 '{' 或 '['
  let startIndex = -1;
  let openChar: '{' | '[' | null = null;
  for (let i = index + key.length + 1; i < str.length; i++) {
    if (str[i] === '{' || str[i] === '[') {
      startIndex = i;
      openChar = str[i] as '{' | '[';
      break;
    }
    // 遇到分号说明没有 JSON 块
    if (str[i] === ';') return null;
  }
  if (startIndex === -1 || openChar === null) return null;
  const closeChar = openChar === '{' ? '}' : ']';

  let depth = 0;
  let inStr = false;
  let escape = false;
  let endIndex = -1;
  for (let i = startIndex; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
    } else if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }
  if (endIndex === -1) return null;
  try {
    return JSON.parse(str.substring(startIndex, endIndex + 1));
  } catch {
    return null;
  }
};

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
  // usageDetails & billingDetails
  const usageDetails = extractJsonFromSemicolonFormat(other, 'usageDetails');
  if (usageDetails) result.usageDetails = usageDetails;
  const billingDetails = extractJsonFromSemicolonFormat(
    other,
    'billingDetails'
  );
  if (billingDetails) result.billingDetails = billingDetails;
  // retryHistory（数组）：仅管理员日志会出现，普通用户接口由 stripAdminInfoFromLogs 剥掉
  const retryHistory = extractJsonFromSemicolonFormat(other, 'retryHistory');
  if (Array.isArray(retryHistory)) result.retryHistory = retryHistory;
  // streamStatus
  const streamStatus = extractJsonFromSemicolonFormat(other, 'streamStatus');
  if (streamStatus && typeof streamStatus === 'object')
    result.streamStatus = streamStatus;

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

// streamStatus 字段类型定义（与后端 util.StreamStatus 序列化结果对齐）
export interface StreamStatusInfo {
  status: 'ok' | 'error';
  end_reason:
    | 'done'
    | 'eof'
    | 'handler_stop'
    | 'timeout'
    | 'client_gone'
    | 'scanner_error'
    | 'panic'
    | 'ping_fail'
    | string;
  end_error?: string;
  error_count?: number;
  errors?: string[];
}

// 解析 other 字段中的 streamStatus
export const parseStreamStatus = (row: LogStat): StreamStatusInfo | null => {
  const parsed = parseLogOther(row);
  if (!parsed) return null;
  const ss = parsed.stream_status || parsed.streamStatus;
  if (ss && typeof ss === 'object' && 'end_reason' in ss)
    return ss as StreamStatusInfo;
  return null;
};

// 流状态结束原因中文标签
const END_REASON_LABEL: Record<string, string> = {
  done: '完成',
  eof: 'EOF',
  handler_stop: '处理停止',
  timeout: '超时',
  client_gone: '客户端断开',
  scanner_error: '扫描错误',
  panic: '程序崩溃',
  ping_fail: 'Ping失败'
};

// 流状态徽章样式（按结束原因 + 是否有软错误区分颜色）
const getStreamStatusStyle = (ss: StreamStatusInfo) => {
  const hasErrors = (ss.error_count ?? 0) > 0;
  const normal = ss.status === 'ok';

  // 正常结束且无软错误 → 绿色
  if (normal && !hasErrors) {
    return {
      badge:
        'bg-emerald-50 text-emerald-700 ring-emerald-500/30 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
      icon: '✓'
    };
  }
  // 正常结束但有软错误 → 琥珀色（结束方式本身无误，但过程有警告）
  // 注意：当前后端在 isNormal && errCount > 0 时输出 status:"error"，
  // 此分支在现有协议下不触发，作为防御性代码保留，以兼容未来协议调整。
  if (normal && hasErrors) {
    return {
      badge:
        'bg-amber-50 text-amber-700 ring-amber-500/30 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
      icon: '⚠'
    };
  }
  // 异常结束：按原因细分
  switch (ss.end_reason) {
    case 'client_gone':
      return {
        badge:
          'bg-slate-100 text-slate-600 ring-slate-300 hover:bg-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30',
        icon: '⊘'
      };
    case 'timeout':
      return {
        badge:
          'bg-amber-50 text-amber-700 ring-amber-500/30 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
        icon: '⏱'
      };
    case 'panic':
    case 'scanner_error':
      return {
        badge:
          'bg-rose-50 text-rose-700 ring-rose-500/30 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30',
        icon: '⚠'
      };
    case 'ping_fail':
      return {
        badge:
          'bg-orange-50 text-orange-700 ring-orange-500/30 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/30',
        icon: '⚠'
      };
    default:
      return {
        badge:
          'bg-gray-100 text-gray-600 ring-gray-300 hover:bg-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/30',
        icon: '~'
      };
  }
};

// 重试明细单条结构（与后端 util.RetryAttempt 对齐）
export interface RetryAttempt {
  attempt: number;
  channel_id: number;
  channel_name?: string;
  key_index?: number;
  duration?: number;
  error?: string;
  status?: number;
}

// 解析结构化的重试历史（管理员视图）；普通用户接口已被服务端剥离，永远返回 null
export const parseRetryHistory = (row: LogStat): RetryAttempt[] | null => {
  const parsed = parseLogOther(row);
  if (!parsed) return null;
  const list = parsed.retry_history || parsed.retryHistory;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list as RetryAttempt[];
};

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

/** HTTP 状态码颜色:2xx 绿 / 4xx 黄 / 5xx 红 / 无 灰 */
export const getStatusTier = (status?: number) => {
  if (!status) {
    return 'bg-gray-100 text-gray-600 ring-gray-300 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/30';
  }
  if (status >= 200 && status < 300) return TIER_EMERALD;
  if (status >= 500) return TIER_ROSE;
  return TIER_AMBER;
};

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
    header: () => <div className="w-20 text-center">重试</div>,
    size: 100,
    cell: ({ row }) => {
      const parsed = parseRetrySequence(row.original);
      const history = parseRetryHistory(row.original);

      if (!parsed && !history) {
        return <div className="w-20 text-center text-muted-foreground">-</div>;
      }

      const attemptCount = history?.length ?? parsed!.channelIds.length;
      // 单次成功（attemptCount===1）不视为重试，直接显示 "-"
      if (attemptCount <= 1) {
        return <div className="w-20 text-center text-muted-foreground">-</div>;
      }

      // 最终结果：优先看 history 最后一条的 status，否则用 row.type==2 (Consume) 推断成功
      const lastAttempt = history?.[history.length - 1];
      const finalSuccess = lastAttempt
        ? lastAttempt.status !== undefined &&
          lastAttempt.status >= 200 &&
          lastAttempt.status < 300
        : row.original.type === 2;

      const totalDuration = history?.reduce((s, a) => s + (a.duration ?? 0), 0);

      const badgeColor = finalSuccess
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/30 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/20'
        : 'bg-rose-50 text-rose-700 ring-rose-500/30 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30 dark:hover:bg-rose-500/20';

      return (
        <div className="w-20 text-center">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`查看 ${attemptCount} 次重试明细`}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-medium ring-1 ring-inset transition-colors ${badgeColor}`}
              >
                <span className="text-[10px]">↻</span>
                <span>{attemptCount}</span>
                <span>{finalSuccess ? '✓' : '✗'}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="left"
              align="start"
              className="w-[28rem] max-w-[90vw] p-0"
            >
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <p className="text-sm font-semibold">重试明细</p>
                <span className="text-xs text-muted-foreground">
                  {`共 ${attemptCount} 次`}
                  {typeof totalDuration === 'number' && totalDuration > 0
                    ? ` · 累计 ${totalDuration.toFixed(2)}s`
                    : ''}
                </span>
              </div>

              {history ? (
                <div className="max-h-[24rem] overflow-y-auto">
                  {history.map((a, i) => {
                    const isSuccess =
                      a.status !== undefined &&
                      a.status >= 200 &&
                      a.status < 300;
                    const isLast = i === history.length - 1;
                    const rowBg = isLast
                      ? isSuccess
                        ? 'bg-emerald-50/40 dark:bg-emerald-500/5'
                        : 'bg-rose-50/40 dark:bg-rose-500/5'
                      : '';
                    return (
                      <div
                        key={a.attempt}
                        className={`flex gap-3 px-4 py-2.5 text-xs ${
                          i > 0 ? 'border-t' : ''
                        } ${rowBg}`}
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {a.attempt}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate font-medium">
                              {a.channel_name || `#${a.channel_id}`}
                            </span>
                            <span className="text-muted-foreground">
                              #{a.channel_id}
                            </span>
                            {typeof a.key_index === 'number' &&
                              a.key_index > 0 && (
                                <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                  key{a.key_index}
                                </span>
                              )}
                            <span
                              className={`ml-auto inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ring-1 ring-inset ${getStatusTier(
                                a.status
                              )}`}
                            >
                              {a.status ?? '-'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {typeof a.duration === 'number'
                                ? `${a.duration.toFixed(2)}s`
                                : '-'}
                            </span>
                          </div>
                          {a.error ? (
                            <p className="break-words text-muted-foreground">
                              {a.error}
                            </p>
                          ) : isLast && isSuccess ? (
                            <p className="text-emerald-600 dark:text-emerald-400">
                              ✓ 成功
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5 px-4 py-3">
                  <p className="text-xs text-muted-foreground">渠道序列</p>
                  <p className="break-all font-mono text-xs">
                    {parsed!.channelIds.join(' → ')}
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    enableHiding: true
  },
  {
    id: 'stream_status',
    accessorKey: 'other',
    header: () => <div className="text-center">流状态</div>,
    size: 110,
    minSize: 90,
    cell: ({ row }) => {
      const isStreamValue = row.original.is_stream;
      const isStream = (isStreamValue as any) === 1 || isStreamValue === true;
      if (!isStream) {
        return <div className="text-center text-muted-foreground">-</div>;
      }

      const ss = parseStreamStatus(row.original);
      if (!ss) {
        return <div className="text-center text-muted-foreground">-</div>;
      }

      const { badge, icon } = getStreamStatusStyle(ss);
      const label = END_REASON_LABEL[ss.end_reason] ?? ss.end_reason;
      const hasErrors = (ss.error_count ?? 0) > 0;

      return (
        <div className="text-center">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`流状态：${label}`}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${badge}`}
              >
                <span className="shrink-0">{icon}</span>
                <span>{label}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-64 p-0">
              {/* 标题栏 */}
              <div className="flex items-center justify-between border-b px-3 py-2">
                <p className="text-sm font-semibold">流式结束状态</p>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}
                >
                  {ss.status === 'ok' ? '正常' : '异常'}
                </span>
              </div>
              {/* 详情 */}
              <div className="space-y-2 px-3 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">结束原因</span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium">{label}</span>
                    <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {ss.end_reason}
                    </span>
                  </span>
                </div>
                {ss.end_error && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">错误信息</span>
                    <p className="break-words rounded bg-muted px-2 py-1 font-mono text-[11px] leading-relaxed">
                      {ss.end_error}
                    </p>
                  </div>
                )}
                {hasErrors && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">过程警告</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {ss.error_count} 条
                      </span>
                    </div>
                    {ss.errors && ss.errors.length > 0 && (
                      <div className="max-h-28 space-y-0.5 overflow-y-auto rounded border">
                        {ss.errors.map((e, i) => (
                          <p
                            key={i}
                            className="break-words border-b px-2 py-1 font-mono text-[10px] text-muted-foreground last:border-b-0"
                          >
                            {e}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
