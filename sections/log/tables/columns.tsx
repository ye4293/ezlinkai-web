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

/** 类型 */
const renderType = (status: number) => {
  switch (status) {
    case 1:
      return <Badge variant="secondary">Top up</Badge>;
    case 2:
      return <Badge variant="default">Consumption</Badge>;
    case 3:
      return <Badge variant="outline">Management</Badge>;
    case 4:
      return <Badge variant="outline">System</Badge>;
    default:
      return <Badge variant="destructive">Unknown</Badge>;
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
    header: () => <div className="text-center">Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at');
      return (
        <div className="text-left">
          {dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      );
    }
  },
  // 渠道
  {
    id: 'channel',
    accessorKey: 'channel',
    header: () => <div className="text-left">Channel</div>,
    cell: ({ row }) => (
      <div className="text-left">{row.getValue('channel')}</div>
    )
  },
  {
    accessorKey: 'username',
    header: () => <div className="text-left">User</div>,
    cell: ({ row }) => (
      <div className="text-left">{row.getValue('username')}</div>
    )
  },
  {
    accessorKey: 'token_name',
    header: () => <div className="text-left">Token</div>,
    cell: ({ row }) => (
      <div className="text-left">{row.getValue('token_name')}</div>
    )
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-left">Type</div>,
    cell: ({ row }) => (
      <div className="text-left">{renderType(row.getValue('type'))}</div>
    )
  },
  {
    accessorKey: 'model_name',
    header: () => <div className="text-left">Model</div>,
    cell: ({ row }) => {
      const modelName = row.getValue('model_name') as string;
      const truncatedModelName =
        modelName.length > 25 ? `${modelName.substring(0, 25)}...` : modelName;

      return (
        <div className="text-left">
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
        </div>
      );
    }
  },
  {
    accessorKey: 'prompt_tokens',
    header: () => <div className="text-right">Prompt</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.getValue('prompt_tokens')}</div>
    )
  },
  {
    accessorKey: 'completion_tokens',
    header: () => <div className="text-right">Completion</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.getValue('completion_tokens')}</div>
    )
  },
  {
    id: 'retry',
    accessorKey: 'other',
    header: () => <div className="text-left">Retry</div>,
    cell: ({ row }) => {
      const other = row.original.other as string;

      if (!other) {
        return <div className="text-left">-</div>;
      }

      // 解析adminInfo字段 - 直接匹配 adminInfo:[833,833,834] 格式
      const adminInfoMatch = other.match(/adminInfo:\[(.*?)\]/);
      if (!adminInfoMatch) {
        return <div className="text-left">-</div>;
      }

      try {
        // 解析逗号分隔的字符串为数组
        const channelIds = adminInfoMatch[1]
          .split(',')
          .map((id) => parseInt(id.trim()));
        if (Array.isArray(channelIds) && channelIds.length > 0) {
          // 将数组转换为箭头连接的字符串
          const retrySequence = channelIds.join('->');
          const truncatedRetrySequence =
            retrySequence.length > 20
              ? `${retrySequence.substring(0, 20)}...`
              : retrySequence;
          return (
            <div className="text-left">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-sm text-blue-600">
                      {truncatedRetrySequence}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>渠道重试序列: {retrySequence}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        }
      } catch (error) {
        console.error('解析adminInfo失败:', error);
      }

      return <div className="text-left">-</div>;
    }
  },
  {
    accessorKey: 'quota',
    header: () => <div className="text-right">Quota</div>,
    cell: ({ row }) => (
      <div className="text-right">{processQuota(row.getValue('quota'))}</div>
    )
  },
  {
    accessorKey: 'duration',
    header: () => <div className="text-right">Duration/First Word</div>,
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
        <div className="flex items-center justify-end gap-1.5 text-right">
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
    }
  },
  {
    id: 'content',
    accessorKey: 'content',
    header: () => <div className="text-left">Details</div>,
    cell: ({ row }) => {
      const content = row.getValue('content') as string;
      const truncatedContent =
        content.length > 50 ? `${content.substring(0, 50)}...` : content;

      return (
        <div className="text-left">
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
        </div>
      );
    }
  }
];
