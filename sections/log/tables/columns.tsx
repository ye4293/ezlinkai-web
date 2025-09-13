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
import { LogStat } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CopyableCell } from '@/components/ui/copyable-cell';

// 解析重试序列的辅助函数
const parseRetrySequence = (
  other: string
): {
  channelIds: number[];
  retrySequence: string;
  displayText: string;
} | null => {
  if (!other) return null;

  const adminInfoMatch = other.match(/adminInfo:(\[.*?\])/);
  if (!adminInfoMatch) return null;

  try {
    const channelIds = JSON.parse(adminInfoMatch[1]);
    if (!Array.isArray(channelIds) || channelIds.length === 0) return null;

    const retrySequence = channelIds.join('->');
    const displayText =
      retrySequence.length > 15
        ? `${channelIds[0]}->...${
            channelIds.length > 1 ? `(${channelIds.length})` : ''
          }`
        : retrySequence;

    return { channelIds, retrySequence, displayText };
  } catch (error) {
    console.error('解析adminInfo失败:', error);
    return null;
  }
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
    header: () => <div className="text-left">Channel</div>,
    cell: ({ row }) => {
      const channel = row.getValue('channel') as number;
      return (
        <div className="text-left">
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
    size: 120,
    minSize: 100,
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
    size: 140,
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
    header: () => <div className="text-left">Type</div>,
    cell: ({ row }) => {
      const type = row.getValue('type') as number;
      return (
        <div className="text-left">
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
    size: 160,
    minSize: 140,
    header: () => <div className="text-left">Model</div>,
    cell: ({ row }) => {
      const modelName = row.getValue('model_name') as string;
      const truncatedModelName =
        modelName.length > 25 ? `${modelName.substring(0, 25)}...` : modelName;

      return (
        <div className="text-left">
          <CopyableCell value={modelName} label="模型名称">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline">{truncatedModelName}</Badge>
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
    header: () => <div className="text-left">Prompt</div>,
    cell: ({ row }) => {
      const promptTokens = row.getValue('prompt_tokens') as number;
      return (
        <div className="text-left">
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
    header: () => <div className="text-left">Completion</div>,
    cell: ({ row }) => {
      const completionTokens = row.getValue('completion_tokens') as number;
      return (
        <div className="text-left">
          <CopyableCell value={completionTokens} label="输出Token">
            {completionTokens}
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
      const other = row.original.other as string;
      const parsed = parseRetrySequence(other);

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
    header: () => <div className="text-left">Quota</div>,
    cell: ({ row }) => {
      const quota = row.getValue('quota') as number;
      const processedQuota = processQuota(quota);
      return (
        <div className="text-left">
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
    header: () => <div className="text-left">Duration/First Word</div>,
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number;
      // 修复：处理数据库中的数字类型（1/0）转换为布尔值
      const isStreamValue = row.original.is_stream;
      const isStream = (isStreamValue as any) === 1 || isStreamValue === true;

      // 修复：处理首字延迟字段名，直接使用 first_word_latency
      const firstWordLatencyValue = (row.original as any).first_word_latency;
      const firstWordLatency =
        typeof firstWordLatencyValue === 'number' ? firstWordLatencyValue : 0;

      // 调试信息（生产环境可删除）
      if (isStream && process.env.NODE_ENV === 'development') {
        console.log('Debug - Row data:', {
          original: row.original,
          first_word_latency: row.original.first_word_latency,
          firstWordLatency: row.original.first_word_latency,
          FirstWordLatency: (row.original as any).FirstWordLatency,
          finalValue: firstWordLatency,
          isStream
        });
      }

      return (
        <div className="flex items-center gap-1.5 text-left">
          <span>{duration}</span>
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
    size: 200,
    minSize: 150,
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
