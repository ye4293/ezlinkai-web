'use client';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ImageStat } from '@/lib/types/image';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { CopyableCell } from '@/components/ui/copyable-cell';

const STATUS_VARIANT_MAP: Record<
  string,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  succeeded: {
    variant: 'outline',
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
  },
  submitted: {
    variant: 'outline',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'
  },
  pending: {
    variant: 'outline',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
  },
  running: {
    variant: 'outline',
    className:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400'
  },
  failed: {
    variant: 'outline',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
  }
};

const processQuota = (quota: number) => {
  // 将quota除以500000，并保留小数点后六位
  const processedQuota = (quota / 500000).toFixed(6);
  // 转换为数值类型，以便去除多余的零
  return `$${parseFloat(processedQuota)}`;
};

export const columns: ColumnDef<ImageStat>[] = [
  {
    accessorKey: 'created_at',
    header: () => <div className="text-center">Created Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at');
      const formattedTime = dayjs(Number(timestamp) * 1000).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      return (
        <div className="text-center">
          <CopyableCell value={formattedTime} label="时间">
            <div className="text-sm">{formattedTime}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 160,
    minSize: 140,
    maxSize: 180
  },
  {
    id: 'channel_id',
    accessorKey: 'channel_id',
    header: () => <div className="text-center">Channel ID</div>,
    cell: ({ row }) => {
      const channelId = row.getValue('channel_id') as number;
      return (
        <div className="text-center">
          <CopyableCell value={channelId} label="渠道ID">
            <div className="text-sm font-medium">{channelId}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    accessorKey: 'task_id',
    header: () => <div className="text-center">Task ID</div>,
    cell: ({ row }) => {
      const taskId = row.getValue('task_id') as string;
      return (
        <div className="text-center">
          <CopyableCell value={taskId} label="任务ID">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="max-w-[180px] truncate px-2 text-sm">
                    {taskId}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[400px] break-all">{taskId}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    size: 200,
    minSize: 150,
    maxSize: 250
  },
  {
    accessorKey: 'provider',
    header: () => <div className="text-center">Provider</div>,
    cell: ({ row }) => {
      const provider = row.getValue('provider') as string;
      return (
        <div className="text-center">
          <CopyableCell value={provider} label="提供商">
            <div className="text-sm">{provider}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    accessorKey: 'model',
    header: () => <div className="text-center">Model</div>,
    cell: ({ row }) => {
      const model = row.getValue('model') as string;
      return (
        <div className="text-center">
          <CopyableCell value={model} label="模型">
            <div className="text-sm">{model}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 140,
    minSize: 120,
    maxSize: 160
  },
  {
    accessorKey: 'mode',
    header: () => <div className="text-center">Mode</div>,
    cell: ({ row }) => {
      const mode = row.getValue('mode') as string;
      return (
        <div className="text-center">
          <CopyableCell value={mode} label="模式">
            <div className="text-sm">{mode}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const { variant, className } = STATUS_VARIANT_MAP[status] ?? {
        variant: 'secondary' as const,
        className: ''
      };
      return (
        <div className="flex justify-center">
          <CopyableCell value={status} label="状态">
            <Badge
              variant={variant}
              className={`text-xs font-medium ${className}`}
            >
              {status}
            </Badge>
          </CopyableCell>
        </div>
      );
    },
    size: 110,
    minSize: 90,
    maxSize: 130
  },
  {
    accessorKey: 'n',
    header: () => <div className="text-center">Count</div>,
    cell: ({ row }) => {
      const count = row.getValue('n') as number;
      return (
        <div className="text-center">
          <CopyableCell value={count} label="数量">
            <div className="text-sm font-medium">{count}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 80,
    minSize: 60,
    maxSize: 100
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: () => <div className="text-center">Username</div>,
    cell: ({ row }) => {
      const username = row.getValue('username') as string;
      return (
        <div className="text-center">
          <CopyableCell value={username} label="用户名">
            <div className="text-sm">{username}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140
  },
  {
    id: 'user_id',
    accessorKey: 'user_id',
    header: () => <div className="text-center">User ID</div>,
    cell: ({ row }) => {
      const userId = row.getValue('user_id') as number;
      return (
        <div className="text-center">
          <CopyableCell value={userId} label="用户ID">
            <div className="text-sm font-medium">{userId}</div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    accessorKey: 'store_url',
    header: () => <div className="text-center">Image</div>,
    cell: ({ row }) => {
      const storeUrl = row.getValue('store_url') as string;

      if (!storeUrl) {
        return (
          <div className="flex justify-center">
            <div className="px-2 text-sm text-gray-500">暂无图片</div>
          </div>
        );
      }

      // 尝试解析JSON格式的URL数组
      let urls: string[] = [];
      try {
        const parsed = JSON.parse(storeUrl);
        if (Array.isArray(parsed)) {
          urls = parsed.filter((url) => url && typeof url === 'string');
        } else {
          urls = [storeUrl]; // 如果不是数组，当作单个URL处理
        }
      } catch {
        // JSON解析失败，当作单个URL处理
        urls = [storeUrl];
      }

      if (urls.length === 0) {
        return (
          <div className="flex justify-center">
            <div className="px-2 text-sm text-gray-500">暂无图片</div>
          </div>
        );
      }

      return (
        <div className="flex flex-wrap justify-center gap-1">
          {urls.map((url, index) => (
            <CopyableCell
              key={index}
              value={url}
              label={`图片链接${index + 1}`}
            >
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-blue-200 px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                    >
                      图片{index + 1}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-[300px] break-words">{url}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CopyableCell>
          ))}
        </div>
      );
    },
    size: 140,
    minSize: 120,
    maxSize: 180
  },
  {
    accessorKey: 'fail_reason',
    header: () => <div className="text-center">Failure Reason</div>,
    cell: ({ row }) => {
      const failReason = row.getValue('fail_reason') as string;
      return (
        <div className="flex justify-center gap-2">
          <CopyableCell value={failReason || ''} label="失败原因">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="max-w-[180px] truncate px-2 text-sm">
                    {failReason || '-'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[400px] break-words">
                    {failReason || '无失败原因'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyableCell>
        </div>
      );
    },
    size: 200,
    minSize: 150,
    maxSize: 250
  },
  {
    accessorKey: 'quota',
    header: () => <div className="text-center">Price</div>,
    cell: ({ row }) => {
      const quota = row.getValue('quota') as number;
      const processedQuota = processQuota(quota);
      return (
        <div className="text-center">
          <CopyableCell value={processedQuota} label="价格">
            <div className="text-sm font-medium text-green-600">
              {processedQuota}
            </div>
          </CopyableCell>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120
  }
];
